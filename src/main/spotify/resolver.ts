import { applicationStore } from '../state'
import { ApplicationState } from '@shared/types/state'

const resolveCurrentState = (state: ApplicationState) => {
  if (!state.currentTrackUri) {
    return
  }

  const track = state.trackMap[state.currentTrackUri]

  if (track) {
    if (track.uri !== state.currentTrack?.uri) {
      applicationStore.setState({
        currentTrack: track
      })
    }
  } else if (state.currentTrack) {
    applicationStore.setState({
      currentTrack: undefined
    })
  }

  const album = track && state.albumMap[track.albumUri]

  if (album) {
    const albumImages = state.imageUriUrlMap[album.uri] || undefined
    if (
      album.uri !== state.currentAlbum?.uri ||
      (state.currentAlbum &&
        (albumImages?.image_small !== state.currentAlbum.image_small ||
          albumImages?.image_medium !== state.currentAlbum.image_medium ||
          albumImages?.image_large !== state.currentAlbum.image_large))
    ) {
      applicationStore.setState({
        currentAlbum: {
          ...album,
          ...albumImages
        }
      })
    }
  } else if (state.currentAlbum) {
    applicationStore.setState({
      currentAlbum: undefined
    })
  }
}

applicationStore.subscribe((state) => resolveCurrentState(state))
