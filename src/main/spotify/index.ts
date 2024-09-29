import './resolver'
import './system-clock-offset'

import './file-exports/album'
import './file-exports/track'
import './file-exports/images'
import './file-exports/json'
import './file-exports/history'

import { initializeDefaultImageFiles } from './file-exports/images'
import { initializeTrackFiles, writeBlankTrackToDisk } from './file-exports/track'
import { writeBlankAlbumToDisk } from './file-exports/album'

export const initFiles = () => {
  initializeDefaultImageFiles()
  initializeTrackFiles()
  writeBlankTrackToDisk()
  writeBlankAlbumToDisk()
}
