import { ResolvedAlbum } from '@shared/types/state'
import fs from 'node:fs/promises'
import { imgOutput, transparent1px } from '../../constants'
import { applicationStore } from '../../state'
import { shallow } from 'zustand/shallow'
import { fetchImageFromRenderer } from '../..'

let savedImageUrl: string | undefined

const writeTrackImageToDisk = async (imageUrl: string) => {
  savedImageUrl = imageUrl
  const imagedata = await fetchImageFromRenderer(imageUrl)
  if (savedImageUrl === imageUrl) {
    fs.writeFile(imgOutput, imagedata)
  }
}

export const writeBlankImageToDisk = async () => {
  savedImageUrl = undefined
  fs.writeFile(imgOutput, transparent1px)
}

const saveCurrentImage = async (
  isPlaying: boolean,
  album: ResolvedAlbum | undefined,
  emptyFilesWhenPaused: boolean
) => {
  const shouldbeEmpty = !isPlaying && emptyFilesWhenPaused

  if (!shouldbeEmpty && album?.image_medium) {
    if (savedImageUrl !== album.image_medium) {
      await writeTrackImageToDisk(album.image_medium)
    }
    return
  }

  if (savedImageUrl !== undefined) {
    await writeBlankImageToDisk()
  }
}
applicationStore.subscribe(
  (state) => ({
    isPlaying: state.isPlaying,
    currentAlbum: state.currentAlbum,
    emptyFilesWhenPaused: state.userSettings.emptyFilesWhenPaused
  }),
  (slice) => saveCurrentImage(slice.isPlaying, slice.currentAlbum, slice.emptyFilesWhenPaused),
  { equalityFn: shallow }
)
