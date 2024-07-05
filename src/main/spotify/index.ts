import './resolver'

import './file-exports/album'
import './file-exports/track'
import './file-exports/images'
import './file-exports/json'

import { initializeDefaultImageFiles } from './file-exports/images'
import { writeBlankTrackToDisk } from './file-exports/track'
import { writeBlankAlbumToDisk } from './file-exports/album'

export const initFiles = () => {
  initializeDefaultImageFiles()
  writeBlankTrackToDisk()
  writeBlankAlbumToDisk()
}
