import { spotiTest } from '../../test/custom-test'

import fs from 'node:fs/promises'
import { beforeEach, describe, expect, vi } from 'vitest'
import { DEFAULT_USER_SETTINGS } from '../../constants'

beforeEach(() => {
  vi.resetAllMocks()
  vi.resetModules()
})

describe('saveJsonFile', async () => {
  describe('enabled', () => {
    spotiTest('write state to json file', async ({ trackData }) => {
      await import('../index')
      const { handleSpotifyPlayerState, handleSpotifyTrackData } = await import('../api-handlers')
      const { applicationStore } = await import('../../state')

      applicationStore.setState({
        userSettings: {
          ...DEFAULT_USER_SETTINGS,
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
          '    "name": "1337 Track"\n' +
          '  },\n' +
          '  "currentAlbum": {\n' +
          '    "uri": "spotify:album:1337",\n' +
          '    "name": "1337 Album",\n' +
          '    "image_small": "https://1337-64-test-image.png",\n' +
          '    "image_medium": "https://1337-300-test-image.png",\n' +
          '    "image_large": "https://1337-640-test-image.png"\n' +
          '  },\n' +
          '  "currentArtists": [\n' +
          '    {\n' +
          '      "name": "1337 Artist",\n' +
          '      "uri": "spotify:artist:1337"\n' +
          '    }\n' +
          '  ]\n' +
          '}'
      )
    })
  })
})
