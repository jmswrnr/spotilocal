import { ResolvedTrack } from '@shared/types/state'
import fs from 'node:fs/promises'
import { txtArtist, txtMain, txtTrack, txtURI } from '../../constants'
import { applicationStore } from '../../state'
import { shallow } from 'zustand/shallow'

let savedTrackUri: string | undefined

const writeTrackToDisk = async (track: ResolvedTrack) => {
  savedTrackUri = track.uri
  fs.writeFile(txtMain, `${track.name} - ${track.artists.map((artist) => artist.name).join(', ')}`)
  fs.writeFile(txtArtist, track.artists.map((artist) => artist.name).join(', '))
  fs.writeFile(txtTrack, track.name)
  fs.writeFile(txtURI, track.uri)
}

export const writeBlankTrackToDisk = async () => {
  savedTrackUri = undefined
  fs.writeFile(txtTrack, '')
  fs.writeFile(txtURI, '')
  fs.writeFile(txtArtist, '')
  fs.writeFile(txtMain, '')
}

const saveCurrentTrack = (
  isPlaying: boolean,
  track: ResolvedTrack | undefined,
  emptyFilesWhenPaused: boolean
) => {
  const shouldbeEmpty = !isPlaying && emptyFilesWhenPaused

  if (!shouldbeEmpty && track) {
    if (savedTrackUri !== track.uri) {
      writeTrackToDisk(track)
    }
    return
  }

  if (savedTrackUri !== undefined) {
    writeBlankTrackToDisk()
  }
}
applicationStore.subscribe(
  (state) => ({
    isPlaying: state.isPlaying,
    currentTrack: state.currentTrack,
    emptyFilesWhenPaused: state.userSettings.emptyFilesWhenPaused
  }),
  (slice) => saveCurrentTrack(slice.isPlaying, slice.currentTrack, slice.emptyFilesWhenPaused),
  { equalityFn: shallow }
)
