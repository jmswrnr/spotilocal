import './resolver'
import './system-clock-offset'

import './file-exports/album'
import './file-exports/track'
import './file-exports/images'
import './file-exports/json'
import './file-exports/history'

import { mkdirSync } from 'node:fs'
import { initializeDefaultImageFiles } from './file-exports/images'
import { initializeTrackFiles, writeBlankTrackToDisk } from './file-exports/track'
import { writeBlankAlbumToDisk } from './file-exports/album'
import { outputDirectory } from '../constants'

export const initFiles = () => {
  mkdirSync(outputDirectory, { recursive: true })
  
  initializeDefaultImageFiles()
  initializeTrackFiles()
  writeBlankTrackToDisk()
  writeBlankAlbumToDisk()
}
