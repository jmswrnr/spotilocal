import path from 'node:path'
import { outputDirectory } from './env'
import type { Size } from 'electron'
import { UserSettings } from '@shared/types/state'
export const filePrefix = 'Spotilocal'

export const txtTrack = path.join(outputDirectory, `${filePrefix}_Track.txt`)
export const txtURI = path.join(outputDirectory, `${filePrefix}_URI.txt`)
export const txtArtist = path.join(outputDirectory, `${filePrefix}_Artist.txt`)
export const txtAlbum = path.join(outputDirectory, `${filePrefix}_Album.txt`)
export const txtMain = path.join(outputDirectory, `${filePrefix}.txt`)
export const jsonOutput = path.join(outputDirectory, `${filePrefix}.json`)

export const imgOutputLegacy = path.join(outputDirectory, `${filePrefix}.png`)
export const imgOutputSmall = path.join(outputDirectory, `${filePrefix}_Small.png`)
export const imgOutputMedium = path.join(outputDirectory, `${filePrefix}_Medium.png`)
export const imgOutputLarge = path.join(outputDirectory, `${filePrefix}_Large.png`)

export const SETTINGS_WINDOW_SIZE: Size = { width: 220, height: 250 }

export const transparent1px = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64'
)

export const DEFAULT_USER_SETTINGS: UserSettings = {
  emptyFilesWhenPaused: true,
  saveJsonFile: false,
  saveSmallImage: false,
  saveMediumImage: true,
  saveLargeImage: false,
  enableWebWidget: false,
  webWidgetPort: -1,
}