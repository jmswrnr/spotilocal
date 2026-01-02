import { spotiTest } from '../test/custom-test'

import fs from 'node:fs/promises'
import path from 'node:path'
import { beforeEach, describe, expect, vi } from 'vitest'
import { DEFAULT_USER_SETTINGS, transparent1px } from '../constants'

beforeEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
})

describe('Initializes files', () => {
  spotiTest('Writes blank data on load', async ({ expectBlankTextFilesWrites }) => {
    const initFiles = await import('./index').then((module) => module.initFiles)
    initFiles()
    await vi.waitFor(expectBlankTextFilesWrites)
    expect(fs.writeFile).toBeCalledTimes(5)
  })

  spotiTest('Deletes legacy image', async () => {
    const initFiles = await import('./index').then((module) => module.initFiles)
    initFiles()
    await Promise.all([
      vi.waitFor(() => {
        expect(fs.unlink).toBeCalledWith(path.join('/mocked-output/dir/', 'Spotilocal.png'))
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
    vi.clearAllMocks()
    initFiles()
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
    vi.clearAllMocks()
    initFiles()
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
