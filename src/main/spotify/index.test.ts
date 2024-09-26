import { spotiTest } from '../test/custom-test'

import fs from 'node:fs/promises'
import { beforeEach, describe, expect, vi } from 'vitest'
import { DEFAULT_USER_SETTINGS, transparent1px } from '../constants'

beforeEach(() => {
  vi.resetAllMocks()
  vi.resetModules()
})

describe('Initializes files', () => {
  spotiTest('Writes blank data on load', async ({ expectBlankTextFilesWrites }) => {
    const initFiles = await import('./index').then((module) => module.initFiles)
    vi.mocked(fs.unlink).mockImplementation(async () => {})
    initFiles()
    await vi.waitFor(expectBlankTextFilesWrites)
    expect(fs.writeFile).toBeCalledTimes(6)
  })

  spotiTest('Deletes legacy image', async () => {
    const initFiles = await import('./index').then((module) => module.initFiles)
    vi.mocked(fs.unlink).mockImplementation(async () => {})
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
    vi.mocked(fs.unlink).mockImplementation(async () => {})
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
    vi.mocked(fs.unlink).mockImplementationOnce(async () => {})
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