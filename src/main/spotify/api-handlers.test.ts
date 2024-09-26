import { spotiTest } from '../test/custom-test'

import fs from 'node:fs/promises'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { DEFAULT_USER_SETTINGS } from '../constants'

beforeEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
})

test('Handle Spotify player state update', async () => {
  await import('./index')
  const { handleSpotifyPlayerState } = await import('./api-handlers')
  const { applicationStore } = await import('../state')
  const initState = applicationStore.getState()
  expect(initState.isPlaying).toBe(false)
  applicationStore.setState({
    userSettings: {
      ...DEFAULT_USER_SETTINGS,
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
})

describe('Handle Spotify track data', async () => {
  spotiTest(
    'Writes files',
    async ({
      trackData,
      expected1337TrackFileWrites,
      expectBlankTextFilesWrites,
      state1337TrackPlaying,
      state1337TrackPaused
    }) => {
      await import('./index')
      const { handleSpotifyTrackData, handleSpotifyPlayerState } = await import('./api-handlers')
      const { applicationStore } = await import('../state')
      handleSpotifyTrackData(trackData)
      applicationStore.setState({
        userSettings: DEFAULT_USER_SETTINGS
      })

      vi.clearAllMocks()
      handleSpotifyPlayerState(state1337TrackPlaying)
      await expected1337TrackFileWrites()
      expect(fs.writeFile).toBeCalledTimes(6)

      vi.clearAllMocks()
      handleSpotifyPlayerState(state1337TrackPaused)
      await expectBlankTextFilesWrites()
      expect(fs.writeFile).toBeCalledTimes(6)
    }
  )

  spotiTest('Updates state', async ({ trackData }) => {
    await import('./index')
    const { handleSpotifyTrackData } = await import('./api-handlers')
    const { applicationStore } = await import('../state')
    handleSpotifyTrackData(trackData)
    applicationStore.setState({
      userSettings: DEFAULT_USER_SETTINGS
    })
    vi.clearAllMocks()
    const newState = applicationStore.getState()
    expect(newState.trackMap).toMatchInlineSnapshot(`
      {
        "spotify:track:1234": {
          "albumUri": "spotify:album:888",
          "artistUris": [
            "spotify:artist:888",
          ],
          "linkedFromUri": "spotify:track:1234",
          "name": "888 Track",
          "uri": "spotify:track:888",
        },
        "spotify:track:1337": {
          "albumUri": "spotify:album:1337",
          "artistUris": [
            "spotify:artist:1337",
          ],
          "name": "1337 Track",
          "uri": "spotify:track:1337",
        },
        "spotify:track:888": {
          "albumUri": "spotify:album:888",
          "artistUris": [
            "spotify:artist:888",
          ],
          "linkedFromUri": "spotify:track:1234",
          "name": "888 Track",
          "uri": "spotify:track:888",
        },
      }
    `)
    expect(newState.artistMap).toMatchInlineSnapshot(`
      {
        "spotify:artist:1337": {
          "name": "1337 Artist",
          "uri": "spotify:artist:1337",
        },
        "spotify:artist:888": {
          "name": "888 Artist",
          "uri": "spotify:artist:888",
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
