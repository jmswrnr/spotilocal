import { spotiTest } from '../test/custom-test'
import { beforeEach, describe, expect, vi } from 'vitest'
import fs from 'node:fs/promises'
import { transparent1px, DEFAULT_USER_SETTINGS } from '../constants'

beforeEach(() => {
  vi.resetAllMocks()
  vi.resetModules()
})

describe('Initializes files', () => {
  spotiTest('Writes blank data on load', async ({ expectBlankTextFilesWrites }) => {
    const initFiles = await import('./index').then((module) => module.initFiles)
    initFiles()
    await vi.waitFor(expectBlankTextFilesWrites)
    expect(fs.writeFile).toBeCalledTimes(6)
  })

  spotiTest('Deletes legacy image', async () => {
    const initFiles = await import('./index').then((module) => module.initFiles)
    initFiles()
    await Promise.all([
      vi.waitFor(() => {
        expect(fs.unlink).toBeCalledWith('\\mocked-output\\dir\\Spotilocal.png')
      })
    ])
  })

  spotiTest('Deletes unused images', async () => {
    const initFiles = await import('./index').then((module) => module.initFiles)
    const { applicationStore } = await import('../state')
    applicationStore.setState({
      userSettings: {
        ...DEFAULT_USER_SETTINGS,
        emptyFilesWhenPaused: false,
        saveSmallImage: false,
        saveMediumImage: false,
        saveLargeImage: false
      }
    })
    vi.resetAllMocks()
    initFiles()
    await Promise.all([
      vi.waitFor(() => {
        expect(fs.unlink).toBeCalledWith('\\mocked-output\\dir\\Spotilocal_Small.png')
      }),
      vi.waitFor(() => {
        expect(fs.unlink).toBeCalledWith('\\mocked-output\\dir\\Spotilocal_Medium.png')
      }),
      vi.waitFor(() => {
        expect(fs.unlink).toBeCalledWith('\\mocked-output\\dir\\Spotilocal_Large.png')
      })
    ])
  })

  spotiTest('Empties used images', async () => {
    const initFiles = await import('./index').then((module) => module.initFiles)
    const { applicationStore } = await import('../state')
    applicationStore.setState({
      userSettings: {
        ...DEFAULT_USER_SETTINGS,
        emptyFilesWhenPaused: false,
        saveSmallImage: true,
        saveMediumImage: true,
        saveLargeImage: true
      }
    })
    vi.resetAllMocks()
    initFiles()
    await Promise.all([
      vi.waitFor(() => {
        expect(fs.writeFile).toBeCalledWith(
          '\\mocked-output\\dir\\Spotilocal_Small.png',
          transparent1px
        )
      }),
      vi.waitFor(() => {
        expect(fs.writeFile).toBeCalledWith(
          '\\mocked-output\\dir\\Spotilocal_Medium.png',
          transparent1px
        )
      }),
      vi.waitFor(() => {
        expect(fs.writeFile).toBeCalledWith(
          '\\mocked-output\\dir\\Spotilocal_Large.png',
          transparent1px
        )
      })
    ])
  })
})

describe('User settings', async () => {
  describe('Cover Art Sizes', async () => {
    describe('Handle changing settings', () => {
      spotiTest('Deletes unused images', async () => {
        const { applicationStore } = await import('../state')
        applicationStore.setState({
          userSettings: {
            ...DEFAULT_USER_SETTINGS,
            emptyFilesWhenPaused: false,
            saveSmallImage: true,
            saveMediumImage: true,
            saveLargeImage: true
          }
        })
        const initFiles = await import('./index').then((module) => module.initFiles)
        initFiles()
        vi.resetAllMocks()
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
            expect(fs.unlink).toBeCalledWith('\\mocked-output\\dir\\Spotilocal_Small.png')
          }),
          vi.waitFor(() => {
            expect(fs.unlink).toBeCalledWith('\\mocked-output\\dir\\Spotilocal_Medium.png')
          }),
          vi.waitFor(() => {
            expect(fs.unlink).toBeCalledWith('\\mocked-output\\dir\\Spotilocal_Large.png')
          })
        ])
      })

      spotiTest('Empties used images', async () => {
        const { applicationStore } = await import('../state')
        applicationStore.setState({
          userSettings: {
            ...DEFAULT_USER_SETTINGS,
            emptyFilesWhenPaused: false,
            saveSmallImage: false,
            saveMediumImage: false,
            saveLargeImage: false
          }
        })
        await import('./index')
        vi.resetAllMocks()
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
              '\\mocked-output\\dir\\Spotilocal_Small.png',
              transparent1px
            )
          }),
          vi.waitFor(() => {
            expect(fs.writeFile).toBeCalledWith(
              '\\mocked-output\\dir\\Spotilocal_Medium.png',
              transparent1px
            )
          }),
          vi.waitFor(() => {
            expect(fs.writeFile).toBeCalledWith(
              '\\mocked-output\\dir\\Spotilocal_Large.png',
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
          await import('./index')
          const { handleSpotifyPlayerState, handleSpotifyTrackData } = await import(
            './api-handlers'
          )
          const { applicationStore } = await import('../state')
          applicationStore.setState({
            userSettings: {
              ...DEFAULT_USER_SETTINGS,
              emptyFilesWhenPaused: true,
              saveSmallImage: false,
              saveMediumImage: false,
              saveLargeImage: true
            }
          })
          handleSpotifyTrackData(trackData)
          handleSpotifyPlayerState(state1337TrackPlaying)
          await Promise.all([
            vi.waitFor(() => {
              expect(fs.writeFile).toBeCalledWith(
                '\\mocked-output\\dir\\Spotilocal_Large.png',
                'mock-fetched-image-https://1337-640-test-image.png'
              )
            })
          ])
          handleSpotifyPlayerState(state1337TrackPaused)
          await Promise.all([
            vi.waitFor(() => {
              expect(fs.writeFile).toBeCalledWith(
                '\\mocked-output\\dir\\Spotilocal_Large.png',
                transparent1px
              )
            })
          ])
        }
      )
    })
    describe('All Enabled', async () => {
      spotiTest('saves all 3 images', async ({ trackData, state1337TrackPlaying }) => {
        await import('./index')
        const { handleSpotifyPlayerState, handleSpotifyTrackData } = await import('./api-handlers')
        const { applicationStore } = await import('../state')
        applicationStore.setState({
          userSettings: {
            ...DEFAULT_USER_SETTINGS,
            emptyFilesWhenPaused: false,
            saveSmallImage: true,
            saveMediumImage: true,
            saveLargeImage: true
          }
        })
        handleSpotifyTrackData(trackData)
        handleSpotifyPlayerState(state1337TrackPlaying)
        await Promise.all([
          vi.waitFor(() => {
            expect(fs.writeFile).toBeCalledWith(
              '\\mocked-output\\dir\\Spotilocal_Small.png',
              'mock-fetched-image-https://1337-64-test-image.png'
            )
          }),
          vi.waitFor(() => {
            expect(fs.writeFile).toBeCalledWith(
              '\\mocked-output\\dir\\Spotilocal_Medium.png',
              'mock-fetched-image-https://1337-300-test-image.png'
            )
          }),
          vi.waitFor(() => {
            expect(fs.writeFile).toBeCalledWith(
              '\\mocked-output\\dir\\Spotilocal_Large.png',
              'mock-fetched-image-https://1337-640-test-image.png'
            )
          })
        ])
      })
    })
    spotiTest('saveSmallImage Only', async ({ trackData, state1337TrackPlaying }) => {
      await import('./index')
      const { handleSpotifyPlayerState, handleSpotifyTrackData } = await import('./api-handlers')
      const { applicationStore } = await import('../state')
      applicationStore.setState({
        userSettings: {
          ...DEFAULT_USER_SETTINGS,
          emptyFilesWhenPaused: false,
          saveSmallImage: true,
          saveMediumImage: false,
          saveLargeImage: false
        }
      })
      vi.resetAllMocks()
      handleSpotifyTrackData(trackData)
      handleSpotifyPlayerState(state1337TrackPlaying)
      await Promise.all([
        vi.waitFor(() => {
          expect(fs.writeFile).toBeCalledWith(
            '\\mocked-output\\dir\\Spotilocal_Small.png',
            'mock-fetched-image-https://1337-64-test-image.png'
          )
        })
      ])
    })
    spotiTest('saveMediumImage Only', async ({ trackData, state1337TrackPlaying }) => {
      await import('./index')
      const { handleSpotifyPlayerState, handleSpotifyTrackData } = await import('./api-handlers')
      const { applicationStore } = await import('../state')
      applicationStore.setState({
        userSettings: {
          ...DEFAULT_USER_SETTINGS,
          emptyFilesWhenPaused: false,
          saveSmallImage: false,
          saveMediumImage: true,
          saveLargeImage: false
        }
      })
      vi.resetAllMocks()
      handleSpotifyTrackData(trackData)
      handleSpotifyPlayerState(state1337TrackPlaying)
      await Promise.all([
        vi.waitFor(() => {
          expect(fs.writeFile).toBeCalledWith(
            '\\mocked-output\\dir\\Spotilocal_Medium.png',
            'mock-fetched-image-https://1337-300-test-image.png'
          )
        })
      ])
    })
    spotiTest('saveLargeImage Only', async ({ trackData, state1337TrackPlaying }) => {
      await import('./index')
      const { handleSpotifyPlayerState, handleSpotifyTrackData } = await import('./api-handlers')
      const { applicationStore } = await import('../state')
      applicationStore.setState({
        userSettings: {
          ...DEFAULT_USER_SETTINGS,
          emptyFilesWhenPaused: false,
          saveSmallImage: false,
          saveMediumImage: false,
          saveLargeImage: true
        }
      })
      vi.resetAllMocks()
      handleSpotifyTrackData(trackData)
      handleSpotifyPlayerState(state1337TrackPlaying)
      await Promise.all([
        vi.waitFor(() => {
          expect(fs.writeFile).toBeCalledWith(
            '\\mocked-output\\dir\\Spotilocal_Large.png',
            'mock-fetched-image-https://1337-640-test-image.png'
          )
        })
      ])
    })
  })
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

          vi.resetAllMocks()
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
        vi.resetAllMocks()
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
        vi.resetAllMocks()
        handleSpotifyPlayerState({
          timestamp: '1719432114604',
          is_paused: true
        })
        await expectBlankTextFilesWrites()
      })
    })
  })

  describe('saveJsonFile', async () => {
    describe('enabled', () => {
      spotiTest('write state to json file', async ({ trackData }) => {
        await import('./index')
        const { handleSpotifyPlayerState, handleSpotifyTrackData } = await import('./api-handlers')
        const { applicationStore } = await import('../state')

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
