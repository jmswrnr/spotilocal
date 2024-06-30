import { ResolvedAlbum } from '@shared/types/state'
import fs from 'node:fs/promises'
import { txtAlbum } from '../../constants'
import { applicationStore } from '../../state'
import { shallow } from 'zustand/shallow'

let savedAlbumUri: string | undefined

const writeAlbumToDisk = async (album: ResolvedAlbum) => {
  savedAlbumUri = album.uri
  fs.writeFile(txtAlbum, album.name)
}

export const writeBlankAlbumToDisk = async () => {
  savedAlbumUri = undefined
  fs.writeFile(txtAlbum, '')
}

const saveCurrentAlbum = (
  isPlaying: boolean,
  album: ResolvedAlbum | undefined,
  emptyFilesWhenPaused: boolean
) => {
  const shouldbeEmpty = !isPlaying && emptyFilesWhenPaused

  if (!shouldbeEmpty && album) {
    if (savedAlbumUri !== album.uri) {
      writeAlbumToDisk(album)
    }
    return
  }

  if (savedAlbumUri !== undefined) {
    writeBlankAlbumToDisk()
  }
}
applicationStore.subscribe(
  (state) => ({
    isPlaying: state.isPlaying,
    currentAlbum: state.currentAlbum,
    emptyFilesWhenPaused: state.userSettings.emptyFilesWhenPaused
  }),
  (slice) => saveCurrentAlbum(slice.isPlaying, slice.currentAlbum, slice.emptyFilesWhenPaused),
  { equalityFn: shallow }
)
