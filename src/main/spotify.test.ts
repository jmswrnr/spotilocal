import { beforeEach, describe, expect, it, test, vi } from 'vitest'
import fs from 'node:fs/promises'

vi.mock('./env', () => ({
  outputDirectory: '/mocked-output/dir/',
}))

vi.mock('./index', () => ({
  fetchImageFromRenderer: (url: string) =>
    new Promise((resolve) => resolve('mock-fetched-image-' + url))
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
  const { transparent1px } = await import('./spotify')
  expect(fs.writeFile).toBeCalledWith('\\mocked-output\\dir\\Spotilocal.txt', '')
  expect(fs.writeFile).toBeCalledWith('\\mocked-output\\dir\\Spotilocal_Artist.txt', '')
  expect(fs.writeFile).toBeCalledWith('\\mocked-output\\dir\\Spotilocal_Track.txt', '')
  expect(fs.writeFile).toBeCalledWith('\\mocked-output\\dir\\Spotilocal_Album.txt', '')
  expect(fs.writeFile).toBeCalledWith('\\mocked-output\\dir\\Spotilocal_URI.txt', '')
  expect(fs.writeFile).toBeCalledWith('\\mocked-output\\dir\\Spotilocal.png', transparent1px)
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
          width: 300,
          height: 300,
          url: 'https://1337-300-test-image.png'
        }
      ]
    },
    artists: [
      {
        name: '1337 Artist'
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
          width: 1024,
          height: 1024,
          url: 'https://888-1024-test-image.png'
        },
        {
          width: 64,
          height: 64,
          url: 'https://888-64-test-image.png'
        }
      ]
    },
    artists: [
      {
        name: '888 Artist'
      }
    ],
    linked_from: {
      uri: 'spotify:track:1234'
    }
  }
]

test('Writes blank data on load', async () => {
  await expectBlankFilesWrites()
  expect(fs.writeFile).toBeCalledTimes(6)
})

test('Handle Spotify player state update', async () => {
  const { handleSpotifyPlayerState } = await import('./spotify')
  const { applicationStore } = await import('./state')
  const initState = applicationStore.getState()
  expect(initState.isPlaying).toBe(false)
  handleSpotifyPlayerState({
    timestamp: '1719432114603',
    is_paused: false,
    position_as_of_timestamp: 1337,
    track: {
      uri: 'spotify:track:1337'
    }
  })
  const playingState = applicationStore.getState()
  expect(playingState.isPlaying).toBe(true)
  expect(playingState.positionMs).toBe(1337)
  expect(playingState.lastUpdatedAt).toBe(1719432114603)
  expect(playingState.currentTrackUri).toBe('spotify:track:1337')
  handleSpotifyPlayerState({
    timestamp: '1719432114604',
    is_paused: true,
    position_as_of_timestamp: 0
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
      position_as_of_timestamp: 1337,
      track: {
        uri: 'spotify:track:1337'
      }
    })
    expect(fs.writeFile).toBeCalledWith('\\mocked-output\\dir\\Spotilocal.txt', '1337 Track - 1337 Artist')
    expect(fs.writeFile).toBeCalledWith('\\mocked-output\\dir\\Spotilocal_Artist.txt', '1337 Artist')
    expect(fs.writeFile).toBeCalledWith('\\mocked-output\\dir\\Spotilocal_Track.txt', '1337 Track')
    expect(fs.writeFile).toBeCalledWith('\\mocked-output\\dir\\Spotilocal_Album.txt', '1337 Album')
    expect(fs.writeFile).toBeCalledWith('\\mocked-output\\dir\\Spotilocal_URI.txt', 'spotify:track:1337')
    await vi.waitFor(() => {
      expect(fs.writeFile).toBeCalledWith('\\mocked-output\\dir\\Spotilocal.png', 'mock-fetched-image-https://1337-300-test-image.png')
    })
    
    const newState = applicationStore.getState()
    expect(newState.savedTrackUri).toBe('spotify:track:1337')
    expect(fs.writeFile).toBeCalledTimes(6)

    vi.resetAllMocks()
    handleSpotifyPlayerState({
      timestamp: '1719432114604',
      is_paused: true,
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
            "888 Artist",
          ],
          "linkedFromUri": "spotify:track:1234",
          "name": "888 Track",
          "uri": "spotify:track:888",
        },
        "spotify:track:1337": {
          "albumUri": "spotify:album:1337",
          "artists": [
            "1337 Artist",
          ],
          "name": "1337 Track",
          "uri": "spotify:track:1337",
        },
        "spotify:track:888": {
          "albumUri": "spotify:album:888",
          "artists": [
            "888 Artist",
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
        "spotify:album:1337": "https://1337-300-test-image.png",
        "spotify:album:888": "https://888-64-test-image.png",
      }
    `)
  })
})
