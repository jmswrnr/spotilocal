import { spotiTest } from '../../test/custom-test'

import fs from 'node:fs/promises'
import { writeToPath } from '@fast-csv/format'

import { DEFAULT_USER_SETTINGS } from '../../constants'
import { afterEach, beforeEach, describe, expect, vi } from 'vitest'

beforeEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('History Exporter', () => {
  spotiTest('Does not export if user preference is disabled', async () => {
    await import('../index')
    const { applicationStore } = await import('../../state')
    applicationStore.setState({
      userSettings: {
        ...DEFAULT_USER_SETTINGS,
        enableHistory: false
      }
    })
    expect(
      vi
        .mocked(fs.writeFile)
        .mock.calls.some((call) => call[0] === '\\mocked-output\\dir\\Spotilocal_History.txt')
    ).not.toBe(true)
    expect(
      vi
        .mocked(fs.writeFile)
        .mock.calls.some((call) => call[0] === '\\mocked-output\\dir\\Spotilocal_History.json')
    ).not.toBe(true)
    expect(writeToPath).not.toBeCalled()
  })
  spotiTest('Does export if user preference is enabled', async () => {
    await import('../index')
    const { applicationStore } = await import('../../state')
    applicationStore.setState({
      userSettings: {
        ...DEFAULT_USER_SETTINGS,
        enableHistory: true
      }
    })
    expect(
      vi
        .mocked(fs.writeFile)
        .mock.calls.some((call) => call[0] === '\\mocked-output\\dir\\Spotilocal_History.txt')
    ).toBe(true)
    expect(
      vi
        .mocked(fs.writeFile)
        .mock.calls.some((call) => call[0] === '\\mocked-output\\dir\\Spotilocal_History.json')
    ).toBe(true)
    expect(writeToPath).toBeCalled()
  })
  describe('Files', () => {
    beforeEach(async () => {
      await import('../index')
      const { applicationStore } = await import('../../state')
      applicationStore.setState({
        userSettings: {
          ...DEFAULT_USER_SETTINGS,
          enableHistory: true
        }
      })
    })
    spotiTest('CSV Export', async ({ trackData, state1337TrackPlaying, state888TrackPlaying }) => {
      vi.setSystemTime(new Date(2000, 1, 1, 13))
      const { handleSpotifyPlayerState, handleSpotifyTrackDataV1: handleSpotifyTrackData } = await import('../api-handlers')
      handleSpotifyTrackData(trackData as any)
      handleSpotifyPlayerState({
        ...state1337TrackPlaying,
        playback_id: 'playback1'
      })
      vi.setSystemTime(new Date(2000, 1, 1, 15))
      handleSpotifyPlayerState({
        ...state888TrackPlaying,
        playback_id: 'playback3'
      })

      expect(writeToPath).toBeCalledWith(
        '\\mocked-output\\dir\\Spotilocal_History.csv',
        [
          ['1337 Track', '1337 Artist', '1337 Album', '2000-02-01 13:00:00'],
          ['888 Track', '888 Artist', '888 Album', '2000-02-01 15:00:00']
        ],
        { headers: ['Track', 'Artists', 'Album', 'Time'] }
      )
    })

    spotiTest('Text Export', async ({ trackData, state1337TrackPlaying, state888TrackPlaying }) => {
      vi.setSystemTime(new Date(2000, 1, 1, 13))
      const { handleSpotifyPlayerState, handleSpotifyTrackDataV1: handleSpotifyTrackData } = await import('../api-handlers')
      handleSpotifyTrackData(trackData as any)
      handleSpotifyPlayerState({
        ...state1337TrackPlaying,
        playback_id: 'playback1'
      })
      vi.setSystemTime(new Date(2000, 1, 1, 15))
      handleSpotifyPlayerState({
        ...state888TrackPlaying,
        playback_id: 'playback3'
      })

      expect(fs.writeFile).toBeCalledWith(
        '\\mocked-output\\dir\\Spotilocal_History.txt',
        '1337 Track - 1337 Artist\n888 Track - 888 Artist',
        'utf-8'
      )
    })

    spotiTest('JSON Export', async ({ trackData, state1337TrackPlaying, state888TrackPlaying }) => {
      vi.setSystemTime(new Date(2000, 1, 1, 13))
      const { handleSpotifyPlayerState, handleSpotifyTrackDataV1: handleSpotifyTrackData } = await import('../api-handlers')
      handleSpotifyTrackData(trackData as any)
      handleSpotifyPlayerState({
        ...state1337TrackPlaying,
        playback_id: 'playback1'
      })
      vi.setSystemTime(new Date(2000, 1, 1, 15))
      handleSpotifyPlayerState({
        ...state888TrackPlaying,
        playback_id: 'playback2'
      })

      expect(fs.writeFile).toBeCalledWith(
        '\\mocked-output\\dir\\Spotilocal_History.json',
        '{\n' +
          '  "trackMap": {\n' +
          '    "spotify:track:1337": {\n' +
          '      "uri": "spotify:track:1337",\n' +
          '      "albumUri": "spotify:album:1337",\n' +
          '      "artistUris": [\n' +
          '        "spotify:artist:1337"\n' +
          '      ],\n' +
          '      "name": "1337 Track"\n' +
          '    },\n' +
          '    "spotify:track:888": {\n' +
          '      "uri": "spotify:track:888",\n' +
          '      "albumUri": "spotify:album:888",\n' +
          '      "artistUris": [\n' +
          '        "spotify:artist:888"\n' +
          '      ],\n' +
          '      "name": "888 Track",\n' +
          '      "linkedFromUri": "spotify:track:1234"\n' +
          '    },\n' +
          '    "spotify:track:1234": {\n' +
          '      "uri": "spotify:track:888",\n' +
          '      "albumUri": "spotify:album:888",\n' +
          '      "artistUris": [\n' +
          '        "spotify:artist:888"\n' +
          '      ],\n' +
          '      "name": "888 Track",\n' +
          '      "linkedFromUri": "spotify:track:1234"\n' +
          '    }\n' +
          '  },\n' +
          '  "albumMap": {\n' +
          '    "spotify:album:1337": {\n' +
          '      "uri": "spotify:album:1337",\n' +
          '      "name": "1337 Album"\n' +
          '    },\n' +
          '    "spotify:album:888": {\n' +
          '      "uri": "spotify:album:888",\n' +
          '      "name": "888 Album"\n' +
          '    }\n' +
          '  },\n' +
          '  "artistMap": {\n' +
          '    "spotify:artist:1337": {\n' +
          '      "name": "1337 Artist",\n' +
          '      "uri": "spotify:artist:1337"\n' +
          '    },\n' +
          '    "spotify:artist:888": {\n' +
          '      "name": "888 Artist",\n' +
          '      "uri": "spotify:artist:888"\n' +
          '    }\n' +
          '  },\n' +
          '  "history": [\n' +
          '    {\n' +
          '      "trackUri": "spotify:track:1337",\n' +
          '      "timestamp": 949410000000\n' +
          '    },\n' +
          '    {\n' +
          '      "trackUri": "spotify:track:888",\n' +
          '      "timestamp": 949417200000\n' +
          '    }\n' +
          '  ],\n' +
          '  "latestPlaybackId": "playback2"\n' +
          '}'
      )
    })
  })
})

describe('History Updater', () => {
  spotiTest(
    'Adds track to playback history when playback ID changes',
    async ({ trackData, state1337TrackPlaying, state1337TrackPaused, state888TrackPlaying }) => {
      vi.setSystemTime(new Date(2000, 1, 1, 13))

      await import('../index')
      const { applicationStore } = await import('../../state')
      const { handleSpotifyPlayerState, handleSpotifyTrackDataV1: handleSpotifyTrackData } = await import('../api-handlers')
      applicationStore.setState({
        userSettings: {
          ...DEFAULT_USER_SETTINGS,
          enableHistory: true
        }
      })

      expect(applicationStore.getState().playbackHistory).toStrictEqual([])

      // Pausing and playing the same track does not add duplicate
      handleSpotifyTrackData(trackData as any)
      handleSpotifyPlayerState({
        ...state1337TrackPlaying,
        playback_id: 'playback1'
      })
      handleSpotifyPlayerState({
        ...state1337TrackPaused,
        playback_id: 'playback1'
      })
      handleSpotifyPlayerState({
        ...state1337TrackPlaying,
        playback_id: 'playback1'
      })

      expect(applicationStore.getState().playbackHistory).toMatchInlineSnapshot(`
        [
          {
            "timestamp": 949410000000,
            "trackUri": "spotify:track:1337",
          },
        ]
      `)

      // Playing with another playback id adds another entry
      vi.setSystemTime(new Date(2000, 1, 1, 14))
      handleSpotifyPlayerState({
        ...state1337TrackPlaying,
        playback_id: 'playback2'
      })
      expect(applicationStore.getState().playbackHistory).toMatchInlineSnapshot(`
        [
          {
            "timestamp": 949410000000,
            "trackUri": "spotify:track:1337",
          },
          {
            "timestamp": 949413600000,
            "trackUri": "spotify:track:1337",
          },
        ]
      `)

      // Playing next song adds entry
      vi.setSystemTime(new Date(2000, 1, 1, 15))
      handleSpotifyPlayerState({
        ...state888TrackPlaying,
        playback_id: 'playback3'
      })
      expect(applicationStore.getState().playbackHistory).toMatchInlineSnapshot(`
        [
          {
            "timestamp": 949410000000,
            "trackUri": "spotify:track:1337",
          },
          {
            "timestamp": 949413600000,
            "trackUri": "spotify:track:1337",
          },
          {
            "timestamp": 949417200000,
            "trackUri": "spotify:track:888",
          },
        ]
      `)
    }
  )
})
