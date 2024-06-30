import { beforeEach, describe, expect, it, test, vi } from 'vitest'
import fs from 'node:fs/promises'
import { transparent1px } from './constants'

vi.mock('./env', () => ({
  outputDirectory: '/mocked-output/dir/'
}))

vi.mock('./index', () => ({
  fetchImageFromRenderer: (url: string) =>
    new Promise((resolve) => resolve('mock-fetched-image-' + url))
}))

vi.mock('./disk-storage', () => ({
  settingsDiskStore: {
    store: {}
  }
}))

vi.mock('node:fs/promises', () => ({
  default: {
    writeFile: vi.fn()
  }
}))

beforeEach(() => {
  vi.resetAllMocks()
  vi.resetModules()
})

const expectBlankFilesWrites = async () => {
  expect(fs.writeFile).toBeCalledWith('\\mocked-output\\dir\\Spotilocal.txt', '')
  expect(fs.writeFile).toBeCalledWith('\\mocked-output\\dir\\Spotilocal_Artist.txt', '')
  expect(fs.writeFile).toBeCalledWith('\\mocked-output\\dir\\Spotilocal_Track.txt', '')
  expect(fs.writeFile).toBeCalledWith('\\mocked-output\\dir\\Spotilocal_Album.txt', '')
  expect(fs.writeFile).toBeCalledWith('\\mocked-output\\dir\\Spotilocal_URI.txt', '')
  expect(fs.writeFile).toBeCalledWith('\\mocked-output\\dir\\Spotilocal.png', transparent1px)
}

const expected1337TrackFileWrites = async () => {
  expect(fs.writeFile).toBeCalledWith(
    '\\mocked-output\\dir\\Spotilocal.txt',
    '1337 Track - 1337 Artist'
  )
  expect(fs.writeFile).toBeCalledWith('\\mocked-output\\dir\\Spotilocal_Artist.txt', '1337 Artist')
  expect(fs.writeFile).toBeCalledWith('\\mocked-output\\dir\\Spotilocal_Track.txt', '1337 Track')
  expect(fs.writeFile).toBeCalledWith('\\mocked-output\\dir\\Spotilocal_Album.txt', '1337 Album')
  expect(fs.writeFile).toBeCalledWith(
    '\\mocked-output\\dir\\Spotilocal_URI.txt',
    'spotify:track:1337'
  )
  await vi.waitFor(() => {
    expect(fs.writeFile).toBeCalledWith(
      '\\mocked-output\\dir\\Spotilocal.png',
      'mock-fetched-image-https://1337-300-test-image.png'
    )
  })
}

const trackData = [
  {
    uri: 'spotify:track:1337',
    name: '1337 Track',
    album: {
      uri: 'spotify:album:1337',
      name: '1337 Album',
      images: [
        {
          width: 64,
          height: 64,
          url: 'https://1337-64-test-image.png'
        },
        {
          width: 300,
          height: 300,
          url: 'https://1337-300-test-image.png'
        },
        {
          width: 640,
          height: 640,
          url: 'https://1337-640-test-image.png'
        }
      ]
    },
    artists: [
      {
        name: '1337 Artist',
        uri: 'spotify:artist:1337'
      }
    ]
  },
  {
    uri: 'spotify:track:888',
    name: '888 Track',
    album: {
      uri: 'spotify:album:888',
      name: '888 Album',
      images: [
        {
          width: 32,
          height: 32,
          url: 'https://1337-32-test-image.png'
        },
        {
          width: 150,
          height: 150,
          url: 'https://1337-150-test-image.png'
        },
        {
          width: 320,
          height: 320,
          url: 'https://1337-320-test-image.png'
        }
      ]
    },
    artists: [
      {
        name: '888 Artist',
        uri: 'spotify:artist:888'
      }
    ],
    linked_from: {
      uri: 'spotify:track:1234'
    }
  }
]

test('Writes blank data on load', async () => {
  await import('./spotify')
  await vi.waitFor(expectBlankFilesWrites)
  expect(fs.writeFile).toBeCalledTimes(6)
})

describe('User settings', async () => {
  describe('emptyFilesWhenPaused', async () => {
    describe('disabled', () => {
      test('write current track when application loaded with paused state', async () => {
        const { handleSpotifyPlayerState, handleSpotifyTrackData } = await import('./spotify')
        const { applicationStore } = await import('./state')

        applicationStore.setState({
          userSettings: {
            emptyFilesWhenPaused: false,
            saveJsonFile: false
          }
        })

        vi.resetAllMocks()
        handleSpotifyTrackData(trackData)
        handleSpotifyPlayerState({
          timestamp: '1719432114603',
          is_paused: true,
          position_as_of_timestamp: '1337',
          duration: '2000',
          track: {
            uri: 'spotify:track:1337'
          }
        })

        await expected1337TrackFileWrites()
      })
      test('do not empty files when paused', async () => {
        const { handleSpotifyPlayerState, handleSpotifyTrackData } = await import('./spotify')
        const { applicationStore } = await import('./state')

        applicationStore.setState({
          userSettings: {
            emptyFilesWhenPaused: false,
            saveJsonFile: false
          }
        })

        handleSpotifyTrackData(trackData)
        handleSpotifyPlayerState({
          timestamp: '1719432114603',
          is_paused: false,
          position_as_of_timestamp: 1337,
          duration: 2000,
          track: {
            uri: 'spotify:track:1337'
          }
        })
        vi.resetAllMocks()
        handleSpotifyPlayerState({
          timestamp: '1719432114604',
          is_paused: true
        })
        expect(fs.writeFile).not.toBeCalled()
      })
    })
    describe('enabled', () => {
      test('do empty files when paused', async () => {
        const { handleSpotifyPlayerState, handleSpotifyTrackData } = await import('./spotify')
        const { applicationStore } = await import('./state')

        applicationStore.setState({
          userSettings: {
            emptyFilesWhenPaused: true,
            saveJsonFile: false
          }
        })

        handleSpotifyTrackData(trackData)
        handleSpotifyPlayerState({
          timestamp: '1719432114603',
          is_paused: false,
          position_as_of_timestamp: '1337',
          track: {
            uri: 'spotify:track:1337'
          }
        })
        vi.resetAllMocks()
        handleSpotifyPlayerState({
          timestamp: '1719432114604',
          is_paused: true
        })
        expectBlankFilesWrites()
      })
    })
  })

  describe('saveJsonFile', async () => {
    describe('enabled', () => {
      test('write state to json file', async () => {
        const { handleSpotifyPlayerState, handleSpotifyTrackData } = await import('./spotify')
        const { applicationStore } = await import('./state')

        applicationStore.setState({
          userSettings: {
            emptyFilesWhenPaused: false,
            saveJsonFile: true
          }
        })

        vi.resetAllMocks()
        handleSpotifyTrackData(trackData)
        handleSpotifyPlayerState({
          timestamp: '1719432114603',
          is_paused: true,
          position_as_of_timestamp: '1337',
          duration: '2000',
          track: {
            uri: 'spotify:track:1337'
          }
        })

        expect(fs.writeFile).toBeCalledWith(
          '\\mocked-output\\dir\\Spotilocal.json',
          '{\n' +
            '  "isPlaying": false,\n' +
            '  "positionMs": 1337,\n' +
            '  "durationMs": 2000,\n' +
            '  "lastUpdatedAt": 1719432114603,\n' +
            '  "currentTrack": {\n' +
            '    "uri": "spotify:track:1337",\n' +
            '    "albumUri": "spotify:album:1337",\n' +
            '    "name": "1337 Track",\n' +
            '    "artists": [\n' +
            '      {\n' +
            '        "name": "1337 Artist",\n' +
            '        "uri": "spotify:artist:1337"\n' +
            '      }\n' +
            '    ]\n' +
            '  },\n' +
            '  "currentAlbum": {\n' +
            '    "uri": "spotify:album:1337",\n' +
            '    "name": "1337 Album",\n' +
            '    "image_small": "https://1337-64-test-image.png",\n' +
            '    "image_medium": "https://1337-300-test-image.png",\n' +
            '    "image_large": "https://1337-640-test-image.png"\n' +
            '  }\n' +
            '}'
        )
      })
    })
  })
})

test('Handle Spotify player state update', async () => {
  const { handleSpotifyPlayerState } = await import('./spotify')
  const { applicationStore } = await import('./state')
  const initState = applicationStore.getState()
  expect(initState.isPlaying).toBe(false)
  applicationStore.setState({
    userSettings: {
      emptyFilesWhenPaused: false,
      saveJsonFile: false
    }
  })
  handleSpotifyPlayerState({
    timestamp: '1719432114603',
    is_paused: false,
    position_as_of_timestamp: '1337',
    duration: '2000',
    track: {
      uri: 'spotify:track:1337',
      metadata: {
        image_small_url: 'spotify:image:small',
        image_url: 'spotify:image:medium',
        image_large_url: 'spotify:image:large'
      }
    }
  })
  const playingState = applicationStore.getState()
  expect(playingState.isPlaying).toBe(true)
  expect(playingState.positionMs).toBe(1337)
  expect(playingState.durationMs).toBe(2000)
  expect(playingState.lastUpdatedAt).toBe(1719432114603)
  expect(playingState.currentTrackUri).toBe('spotify:track:1337')
  expect(playingState.imageUriUrlMap).toMatchInlineSnapshot(`
    {
      "spotify:track:1337": {
        "image_large": "https://i.scdn.co/image/large",
        "image_medium": "https://i.scdn.co/image/medium",
        "image_small": "https://i.scdn.co/image/small",
      },
    }
  `)
  handleSpotifyPlayerState({
    timestamp: '1719432114604',
    is_paused: true,
    position_as_of_timestamp: '0',
    duration: '0'
  })
  const pausedState = applicationStore.getState()
  expect(pausedState.isPlaying).toBe(false)
  expect(pausedState.currentTrackUri).toBe(undefined)
  expect(fs.writeFile).toBeCalledTimes(6)
})

describe('Handle Spotify track data', async () => {
  const { handleSpotifyTrackData, handleSpotifyPlayerState } = await import('./spotify')
  const { applicationStore } = await import('./state')

  beforeEach(() => {
    handleSpotifyTrackData(trackData)
  })

  it('Writes files', async () => {
    handleSpotifyPlayerState({
      timestamp: '1719432114603',
      is_paused: false,
      position_as_of_timestamp: '1337',
      duration: '2000',
      track: {
        uri: 'spotify:track:1337'
      }
    })
    await expected1337TrackFileWrites()
    expect(fs.writeFile).toBeCalledTimes(6)

    vi.resetAllMocks()
    handleSpotifyPlayerState({
      timestamp: '1719432114604',
      is_paused: true
    })

    expectBlankFilesWrites()
    expect(fs.writeFile).toBeCalledTimes(6)
  })

  it('Updates state', () => {
    const newState = applicationStore.getState()
    expect(newState.trackMap).toMatchInlineSnapshot(`
      {
        "spotify:track:1234": {
          "albumUri": "spotify:album:888",
          "artists": [
            {
              "name": "888 Artist",
              "uri": "spotify:artist:888",
            },
          ],
          "linkedFromUri": "spotify:track:1234",
          "name": "888 Track",
          "uri": "spotify:track:888",
        },
        "spotify:track:1337": {
          "albumUri": "spotify:album:1337",
          "artists": [
            {
              "name": "1337 Artist",
              "uri": "spotify:artist:1337",
            },
          ],
          "name": "1337 Track",
          "uri": "spotify:track:1337",
        },
        "spotify:track:888": {
          "albumUri": "spotify:album:888",
          "artists": [
            {
              "name": "888 Artist",
              "uri": "spotify:artist:888",
            },
          ],
          "linkedFromUri": "spotify:track:1234",
          "name": "888 Track",
          "uri": "spotify:track:888",
        },
      }
    `)
    expect(newState.albumMap).toMatchInlineSnapshot(`
      {
        "spotify:album:1337": {
          "name": "1337 Album",
          "uri": "spotify:album:1337",
        },
        "spotify:album:888": {
          "name": "888 Album",
          "uri": "spotify:album:888",
        },
      }
    `)
    expect(newState.imageUriUrlMap).toMatchInlineSnapshot(`
      {
        "spotify:album:1337": {
          "image_large": "https://1337-640-test-image.png",
          "image_medium": "https://1337-300-test-image.png",
          "image_small": "https://1337-64-test-image.png",
        },
        "spotify:album:888": {
          "image_large": "https://1337-320-test-image.png",
          "image_medium": "https://1337-150-test-image.png",
          "image_small": "https://1337-32-test-image.png",
        },
      }
    `)
  })
})
