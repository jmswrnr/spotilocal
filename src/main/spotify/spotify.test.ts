import { spotiTest } from '../test/custom-test'
import { beforeEach, describe, expect, vi } from 'vitest'
import fs from 'node:fs/promises'
import { DEFAULT_USER_SETTINGS } from '../constants'

beforeEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
})

describe('User settings', async () => {
  describe('emptyFilesWhenPaused', async () => {
    describe('disabled', () => {
      spotiTest(
        'write current track when application loaded with paused state',
        async ({ trackData, state1337TrackPaused, expected1337TrackFileWrites }) => {
          await import('./index')
          const { handleSpotifyPlayerState, handleSpotifyTrackData } = await import(
            './api-handlers'
          )
          const { applicationStore } = await import('../state')

          applicationStore.setState({
            userSettings: {
              ...DEFAULT_USER_SETTINGS,
              emptyFilesWhenPaused: false,
              saveJsonFile: false
            }
          })

          vi.clearAllMocks()
          handleSpotifyTrackData(trackData)
          handleSpotifyPlayerState(state1337TrackPaused)

          await expected1337TrackFileWrites()
        }
      )
      spotiTest('do not empty files when paused', async ({ trackData, state1337TrackPlaying }) => {
        await import('./index')
        const { handleSpotifyPlayerState, handleSpotifyTrackData } = await import('./api-handlers')
        const { applicationStore } = await import('../state')

        applicationStore.setState({
          userSettings: {
            ...DEFAULT_USER_SETTINGS,
            emptyFilesWhenPaused: false,
            saveJsonFile: false
          }
        })

        handleSpotifyTrackData(trackData)
        handleSpotifyPlayerState(state1337TrackPlaying)
        vi.clearAllMocks()
        handleSpotifyPlayerState({
          timestamp: '1719432114604',
          is_paused: true
        })
        expect(fs.writeFile).not.toBeCalled()
      })
    })
    describe('enabled', () => {
      spotiTest('do empty files when paused', async ({ trackData, expectBlankTextFilesWrites }) => {
        await import('./index')
        const { handleSpotifyPlayerState, handleSpotifyTrackData } = await import('./api-handlers')
        const { applicationStore } = await import('../state')

        applicationStore.setState({
          userSettings: {
            ...DEFAULT_USER_SETTINGS,
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
        vi.clearAllMocks()
        handleSpotifyPlayerState({
          timestamp: '1719432114604',
          is_paused: true
        })
        await expectBlankTextFilesWrites()
      })
    })
  })
})
