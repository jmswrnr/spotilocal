import { spotiTest } from '../../test/custom-test'

import fs from 'node:fs'
import { beforeEach, describe, expect, vi } from 'vitest'

beforeEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
})

describe('History Loader', () => {
  describe('History JSON', () => {
    spotiTest('History is loaded if file exists', async () => {
      const mockHistory = {
        trackMap: { '1': { name: 'track 1' } },
        albumMap: { '1': { name: 'album 1' } },
        artistMap: { '1': { name: 'artist 1' } },
        latestPlaybackId: '123',
        history: ['history-track-entry-1', 'history-track-entry-2']
      }
      vi.mocked(fs.readFileSync).mockImplementationOnce(() => JSON.stringify(mockHistory))
      await import('../index')
      const { applicationStore } = await import('../../state')
      const state = applicationStore.getState()
      expect(state.trackMap).toStrictEqual(mockHistory.trackMap)
      expect(state.albumMap).toStrictEqual(mockHistory.albumMap)
      expect(state.artistMap).toStrictEqual(mockHistory.artistMap)
      expect(state.latestStoredPlaybackId).toStrictEqual(mockHistory.latestPlaybackId)
      expect(state.playbackHistory).toStrictEqual(mockHistory.history)
    })

    spotiTest('State is ok if invalid file is loaded', async () => {
      vi.mocked(fs.readFileSync).mockImplementationOnce(() => '')
      await import('../index')
      const { applicationStore } = await import('../../state')
      const state = applicationStore.getState()
      expect(state.trackMap).toStrictEqual({})
      expect(state.albumMap).toStrictEqual({})
      expect(state.artistMap).toStrictEqual({})
      expect(state.latestStoredPlaybackId).toStrictEqual(undefined)
      expect(state.playbackHistory).toStrictEqual([])
    })

    spotiTest('State is ok if invalid JSON file is loaded', async () => {
      const mockHistory = {}
      vi.mocked(fs.readFileSync).mockImplementationOnce(() => JSON.stringify(mockHistory))
      await import('../index')
      const { applicationStore } = await import('../../state')
      const state = applicationStore.getState()
      expect(state.trackMap).toStrictEqual({})
      expect(state.albumMap).toStrictEqual({})
      expect(state.artistMap).toStrictEqual({})
      expect(state.latestStoredPlaybackId).toStrictEqual(undefined)
      expect(state.playbackHistory).toStrictEqual([])
    })

    spotiTest('History is empty if no file exists', async () => {
      vi.mocked(fs.readFileSync).mockImplementationOnce(() => {
        throw new Error()
      })
      await import('../index')
      const { applicationStore } = await import('../../state')
      const state = applicationStore.getState()
      expect(state.trackMap).toStrictEqual({})
      expect(state.albumMap).toStrictEqual({})
      expect(state.artistMap).toStrictEqual({})
      expect(state.latestStoredPlaybackId).toStrictEqual(undefined)
      expect(state.playbackHistory).toStrictEqual([])
    })
  })
})
