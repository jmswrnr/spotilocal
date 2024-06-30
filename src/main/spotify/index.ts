import './resolver'
import './album'
import './track'
import './images'
import './json'

import { writeBlankImageToDisk } from './images'
import { writeBlankTrackToDisk } from './track'
import { writeBlankAlbumToDisk } from './album'

export const initFiles = () => {
  writeBlankImageToDisk()
  writeBlankTrackToDisk()
  writeBlankAlbumToDisk()
}
