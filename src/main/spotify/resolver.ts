import { applicationStore } from '../state'
import { ApplicationState, Artist } from '@shared/types/state'

const resolveCurrentState = (state: ApplicationState) => {
  if (!state.currentTrackUri) {
    return
  }

  const track = state.trackMap[state.currentTrackUri]

  if (track) {
    const canvasUrl = state.canvasMap[track.uri]?.url || null
    if (track.uri !== state.currentTrack?.uri || canvasUrl !== state.currentTrack?.canvas) {
      applicationStore.setState({
        currentTrack: {
          ...track,
          canvas: canvasUrl
        }
      })
    }
  } else if (state.currentTrack) {
    applicationStore.setState({
      currentTrack: undefined
    })
  }

  const artists = track?.artistUris.map((artistUri) => state.artistMap[artistUri])

  if (artists) {
    if (
      !artists.includes(undefined) &&
      artists.some((artist, index) => artist?.uri !== state.currentArtists?.[index]?.uri)
    ) {
      applicationStore.setState({
        currentArtists: artists as Artist[]
      })
    }
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
resolveCurrentState(applicationStore.getState())
