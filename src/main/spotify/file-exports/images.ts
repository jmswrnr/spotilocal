import { Images, ResolvedAlbum } from '@shared/types/state'
import fs from 'node:fs/promises'
import {
  imgOutputLarge,
  imgOutputLegacy,
  imgOutputMedium,
  imgOutputSmall,
  transparent1px
} from '../../constants'
import { applicationStore } from '../../state'
import { shallow } from 'zustand/shallow'
import { fetchImageFromRenderer } from '../..'

enum ImageState {
  Deleted = 'deleted',
  Transparent = 'transparent'
}

const savedImageUrls: Record<keyof Images, string | ImageState> = {
  image_small: ImageState.Deleted,
  image_medium: ImageState.Deleted,
  image_large: ImageState.Deleted
}

const writeTrackImageToDisk = async (key: keyof Images, outputPath: string, imageUrl: string) => {
  savedImageUrls[key] = imageUrl
  const imagedata = await fetchImageFromRenderer(imageUrl)
  if (savedImageUrls[key] === imageUrl) {
    fs.writeFile(outputPath, imagedata)
  }
}

const writeBlankImageToDisk = async (key: keyof Images, outputPath: string) => {
  savedImageUrls[key] = ImageState.Transparent
  fs.writeFile(outputPath, transparent1px)
}

const deleteImageFromDisk = async (key: keyof Images, targetPath: string) => {
  try {
    savedImageUrls[key] = ImageState.Deleted
    await fs.unlink(targetPath)
  } catch {}
}

export const initializeDefaultImageFiles = () => {
  const {
    userSettings: { saveSmallImage, saveMediumImage, saveLargeImage }
  } = applicationStore.getState()

  if (saveSmallImage) {
    writeBlankImageToDisk('image_small', imgOutputSmall)
  } else {
    deleteImageFromDisk('image_small', imgOutputSmall)
  }

  if (saveMediumImage) {
    writeBlankImageToDisk('image_medium', imgOutputMedium)
  } else {
    deleteImageFromDisk('image_medium', imgOutputMedium)
  }

  if (saveLargeImage) {
    writeBlankImageToDisk('image_large', imgOutputLarge)
  } else {
    deleteImageFromDisk('image_large', imgOutputLarge)
  }

  fs.unlink(imgOutputLegacy).catch(() => {})
}

const createImageUpdaterFunction =
  (imageKey: keyof Images) =>
  async (
    album: ResolvedAlbum | undefined,
    shouldbeEmpty: boolean,
    shouldBeSaved: boolean,
    outputPath: string
  ) => {
    if (!shouldBeSaved) {
      return
    }

    const imageUrl = album?.[imageKey]

    if (!shouldbeEmpty && imageUrl) {
      if (savedImageUrls[imageKey] !== imageUrl) {
        await writeTrackImageToDisk(imageKey, outputPath, imageUrl)
      }
      return
    }

    if (savedImageUrls[imageKey] !== undefined) {
      await writeBlankImageToDisk(imageKey, outputPath)
    }
  }

const updateSmallImage = createImageUpdaterFunction('image_small')
const updateMediumImage = createImageUpdaterFunction('image_medium')
const updateLargeImage = createImageUpdaterFunction('image_large')

const saveCurrentImage = async (
  isPlaying: boolean,
  album: ResolvedAlbum | undefined,
  emptyFilesWhenPaused: boolean,
  saveSmallImage: boolean,
  saveMediumImage: boolean,
  saveLargeImage: boolean
) => {
  const shouldbeEmpty = !isPlaying && emptyFilesWhenPaused
  await Promise.allSettled([
    updateSmallImage(album, shouldbeEmpty, saveSmallImage, imgOutputSmall),
    updateMediumImage(album, shouldbeEmpty, saveMediumImage, imgOutputMedium),
    updateLargeImage(album, shouldbeEmpty, saveLargeImage, imgOutputLarge)
  ])
}

applicationStore.subscribe(
  (state) => ({
    isPlaying: state.isPlaying,
    currentAlbum: state.currentAlbum,
    emptyFilesWhenPaused: state.userSettings.emptyFilesWhenPaused,
    saveSmallImage: state.userSettings.saveSmallImage,
    saveMediumImage: state.userSettings.saveMediumImage,
    saveLargeImage: state.userSettings.saveLargeImage
  }),
  (slice) =>
    saveCurrentImage(
      slice.isPlaying,
      slice.currentAlbum,
      slice.emptyFilesWhenPaused,
      slice.saveSmallImage,
      slice.saveMediumImage,
      slice.saveLargeImage
    )
)

const cleanupImages = async (
  saveSmallImage: boolean,
  saveMediumImage: boolean,
  saveLargeImage: boolean
) => {
  if (!saveSmallImage && savedImageUrls.image_small !== ImageState.Deleted) {
    deleteImageFromDisk('image_small', imgOutputSmall)
  }
  if (!saveMediumImage && savedImageUrls.image_medium !== ImageState.Deleted) {
    deleteImageFromDisk('image_medium', imgOutputMedium)
  }
  if (!saveLargeImage && savedImageUrls.image_large !== ImageState.Deleted) {
    deleteImageFromDisk('image_large', imgOutputLarge)
  }
}

applicationStore.subscribe(
  (state) => ({
    saveSmallImage: state.userSettings.saveSmallImage,
    saveMediumImage: state.userSettings.saveMediumImage,
    saveLargeImage: state.userSettings.saveLargeImage
  }),
  (slice) => cleanupImages(slice.saveSmallImage, slice.saveMediumImage, slice.saveLargeImage),
  { equalityFn: shallow }
)
