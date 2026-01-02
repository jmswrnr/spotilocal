import { spotiTest } from '../../test/custom-test'

import fs from 'node:fs/promises'
import path from 'node:path'
import { beforeEach, describe, expect, vi } from 'vitest'
import { DEFAULT_USER_SETTINGS, transparent1px } from '../../constants'

beforeEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
})

describe('Cover Art Sizes', async () => {
  describe('Handle changing settings', () => {
    spotiTest('Deletes unused images', async () => {
      const { applicationStore } = await import('../../state')
      applicationStore.setState({
        userSettings: {
          ...DEFAULT_USER_SETTINGS,
          emptyFilesWhenPaused: false,
          saveSmallImage: true,
          saveMediumImage: true,
          saveLargeImage: true
        }
      })
      const initFiles = await import('../index').then((module) => module.initFiles)
      initFiles()
      vi.clearAllMocks()
      applicationStore.setState({
        userSettings: {
          ...DEFAULT_USER_SETTINGS,
          emptyFilesWhenPaused: false,
          saveSmallImage: false,
          saveMediumImage: false,
          saveLargeImage: false
        }
      })
      await Promise.all([
        vi.waitFor(() => {
          expect(fs.unlink).toBeCalledWith(path.join('/mocked-output/dir/', 'Spotilocal_Small.png'))
        }),
        vi.waitFor(() => {
          expect(fs.unlink).toBeCalledWith(path.join('/mocked-output/dir/', 'Spotilocal_Medium.png'))
        }),
        vi.waitFor(() => {
          expect(fs.unlink).toBeCalledWith(path.join('/mocked-output/dir/', 'Spotilocal_Large.png'))
        })
      ])
    })

    spotiTest('Empties used images', async () => {
      const { applicationStore } = await import('../../state')
      applicationStore.setState({
        userSettings: {
          ...DEFAULT_USER_SETTINGS,
          emptyFilesWhenPaused: false,
          saveSmallImage: false,
          saveMediumImage: false,
          saveLargeImage: false
        }
      })
      await import('../index')
      vi.clearAllMocks()
      applicationStore.setState({
        userSettings: {
          ...DEFAULT_USER_SETTINGS,
          emptyFilesWhenPaused: false,
          saveSmallImage: true,
          saveMediumImage: true,
          saveLargeImage: true
        }
      })
      await Promise.all([
        vi.waitFor(() => {
          expect(fs.writeFile).toBeCalledWith(
            path.join('/mocked-output/dir/', 'Spotilocal_Small.png'),
            transparent1px
          )
        }),
        vi.waitFor(() => {
          expect(fs.writeFile).toBeCalledWith(
            path.join('/mocked-output/dir/', 'Spotilocal_Medium.png'),
            transparent1px
          )
        }),
        vi.waitFor(() => {
          expect(fs.writeFile).toBeCalledWith(
            path.join('/mocked-output/dir/', 'Spotilocal_Large.png'),
            transparent1px
          )
        })
      ])
    })
  })
  describe('when using emptyFilesWhenPaused', () => {
    spotiTest(
      'updates correct files when play state changes',
      async ({ trackData, state1337TrackPlaying, state1337TrackPaused }) => {
        await import('../index')
        const { handleSpotifyPlayerState, handleSpotifyTrackDataV1: handleSpotifyTrackData } = await import('../api-handlers')
        const { applicationStore } = await import('../../state')
        applicationStore.setState({
          userSettings: {
            ...DEFAULT_USER_SETTINGS,
            emptyFilesWhenPaused: true,
            saveSmallImage: false,
            saveMediumImage: false,
            saveLargeImage: true
          }
        })
        handleSpotifyTrackData(trackData as any)
        handleSpotifyPlayerState(state1337TrackPlaying)
        await Promise.all([
          vi.waitFor(() => {
            expect(fs.writeFile).toBeCalledWith(
              path.join('/mocked-output/dir/', 'Spotilocal_Large.png'),
              'mock-fetched-image-https://1337-640-test-image.png'
            )
          })
        ])
        handleSpotifyPlayerState(state1337TrackPaused)
        await Promise.all([
          vi.waitFor(() => {
            expect(fs.writeFile).toBeCalledWith(
              path.join('/mocked-output/dir/', 'Spotilocal_Large.png'),
              transparent1px
            )
          })
        ])
      }
    )
  })
  describe('All Enabled', async () => {
    spotiTest('saves all 3 images', async ({ trackData, state1337TrackPlaying }) => {
      await import('../index')
      const { handleSpotifyPlayerState, handleSpotifyTrackDataV1: handleSpotifyTrackData } = await import('../api-handlers')
      const { applicationStore } = await import('../../state')
      applicationStore.setState({
        userSettings: {
          ...DEFAULT_USER_SETTINGS,
          emptyFilesWhenPaused: false,
          saveSmallImage: true,
          saveMediumImage: true,
          saveLargeImage: true
        }
      })
      handleSpotifyTrackData(trackData as any)
      handleSpotifyPlayerState(state1337TrackPlaying)
      await Promise.all([
        vi.waitFor(() => {
          expect(fs.writeFile).toBeCalledWith(
            path.join('/mocked-output/dir/', 'Spotilocal_Small.png'),
            'mock-fetched-image-https://1337-64-test-image.png'
          )
        }),
        vi.waitFor(() => {
          expect(fs.writeFile).toBeCalledWith(
            path.join('/mocked-output/dir/', 'Spotilocal_Medium.png'),
            'mock-fetched-image-https://1337-300-test-image.png'
          )
        }),
        vi.waitFor(() => {
          expect(fs.writeFile).toBeCalledWith(
            path.join('/mocked-output/dir/', 'Spotilocal_Large.png'),
            'mock-fetched-image-https://1337-640-test-image.png'
          )
        })
      ])
    })
  })
  spotiTest('saveSmallImage Only', async ({ trackData, state1337TrackPlaying }) => {
    await import('../index')
    const { handleSpotifyPlayerState, handleSpotifyTrackDataV1: handleSpotifyTrackData } = await import('../api-handlers')
    const { applicationStore } = await import('../../state')
    applicationStore.setState({
      userSettings: {
        ...DEFAULT_USER_SETTINGS,
        emptyFilesWhenPaused: false,
        saveSmallImage: true,
        saveMediumImage: false,
        saveLargeImage: false
      }
    })
    vi.clearAllMocks()
    handleSpotifyTrackData(trackData as any)
    handleSpotifyPlayerState(state1337TrackPlaying)
    await Promise.all([
      vi.waitFor(() => {
        expect(fs.writeFile).toBeCalledWith(
          path.join('/mocked-output/dir/', 'Spotilocal_Small.png'),
          'mock-fetched-image-https://1337-64-test-image.png'
        )
      })
    ])
  })
  spotiTest('saveMediumImage Only', async ({ trackData, state1337TrackPlaying }) => {
    await import('../index')
    const { handleSpotifyPlayerState, handleSpotifyTrackDataV1: handleSpotifyTrackData } = await import('../api-handlers')
    const { applicationStore } = await import('../../state')
    applicationStore.setState({
      userSettings: {
        ...DEFAULT_USER_SETTINGS,
        emptyFilesWhenPaused: false,
        saveSmallImage: false,
        saveMediumImage: true,
        saveLargeImage: false
      }
    })
    vi.clearAllMocks()
    handleSpotifyTrackData(trackData as any)
    handleSpotifyPlayerState(state1337TrackPlaying)
    await Promise.all([
      vi.waitFor(() => {
        expect(fs.writeFile).toBeCalledWith(
          path.join('/mocked-output/dir/', 'Spotilocal_Medium.png'),
          'mock-fetched-image-https://1337-300-test-image.png'
        )
      })
    ])
  })
  spotiTest('saveLargeImage Only', async ({ trackData, state1337TrackPlaying }) => {
    await import('../index')
    const { handleSpotifyPlayerState, handleSpotifyTrackDataV1: handleSpotifyTrackData } = await import('../api-handlers')
    const { applicationStore } = await import('../../state')
    applicationStore.setState({
      userSettings: {
        ...DEFAULT_USER_SETTINGS,
        emptyFilesWhenPaused: false,
        saveSmallImage: false,
        saveMediumImage: false,
        saveLargeImage: true
      }
    })
    vi.clearAllMocks()
    handleSpotifyTrackData(trackData as any)
    handleSpotifyPlayerState(state1337TrackPlaying)
    await Promise.all([
      vi.waitFor(() => {
        expect(fs.writeFile).toBeCalledWith(
          path.join('/mocked-output/dir/', 'Spotilocal_Large.png'),
          'mock-fetched-image-https://1337-640-test-image.png'
        )
      })
    ])
  })
})
