import { Artist, Track } from '@shared/types/state'
import fs from 'node:fs/promises'
import { txtArtist, txtMain, txtTrack, txtURI } from '../../constants'
import { applicationStore } from '../../state'
import { shallow } from 'zustand/shallow'
import { formatArtists, formatName } from '../utils'

let savedTrackUri: string | undefined

const writeTrackToDisk = async (track: Track, artists: Artist[]) => {
  savedTrackUri = track.uri
  fs.writeFile(txtMain, formatName(track, artists))
  fs.writeFile(txtArtist, formatArtists(artists))
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
  track: Track | undefined,
  artists: Artist[] | undefined,
  emptyFilesWhenPaused: boolean
) => {
  const shouldbeEmpty = !isPlaying && emptyFilesWhenPaused

  if (!shouldbeEmpty && track && artists) {
    if (savedTrackUri !== track.uri) {
      writeTrackToDisk(track, artists)
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
    currentArtists: state.currentArtists,
    emptyFilesWhenPaused: state.userSettings.emptyFilesWhenPaused
  }),
  (slice) =>
    saveCurrentTrack(
      slice.isPlaying,
      slice.currentTrack,
      slice.currentArtists,
      slice.emptyFilesWhenPaused
    ),
  { equalityFn: shallow }
)
