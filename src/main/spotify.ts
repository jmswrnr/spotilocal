import { applicationStore } from './state'
import fs from 'node:fs/promises'
import { imgOutput, txtAlbum, txtArtist, txtMain, txtTrack, txtURI } from './constants'
import { produce } from 'immer'
import { fetchImageFromRenderer } from '.'
import { Album, ApplicationState, ResolvedAlbum, ResolvedTrack, Track } from '@shared/types/state'

const writeTrackImageToDisk = async (imageUrl: string) => {
  const imagedata = await fetchImageFromRenderer(imageUrl)
  if (imageUrl === applicationStore.getState().savedImageUrl) {
    fs.writeFile(imgOutput, imagedata)
  }
}

export const transparent1px = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64'
)

const writeBlankImageToDisk = async () => {
  fs.writeFile(imgOutput, transparent1px)
}

const writeBlankTextToDisk = async () => {
  fs.writeFile(txtTrack, '')
  fs.writeFile(txtURI, '')
  fs.writeFile(txtArtist, '')
  fs.writeFile(txtAlbum, '')
  fs.writeFile(txtMain, '')
}

const saveCurrentImage = async (
  savedImageUrl: string | undefined,
  track: ResolvedTrack | undefined,
  album: ResolvedAlbum | undefined
) => {
  if (!track && !album && savedImageUrl) {
    applicationStore.setState({
      savedImageUrl: undefined
    })
    await writeBlankImageToDisk()
    return
  }

  if (album?.image && savedImageUrl !== album.image) {
    applicationStore.setState({
      savedImageUrl: album.image
    })
    await writeTrackImageToDisk(album.image)
    return
  }
}
applicationStore.subscribe(
  (state) => ({
    savedImageUrl: state.savedImageUrl,
    currentTrack: state.currentTrack,
    currentAlbum: state.currentAlbum
  }),
  (slice) => saveCurrentImage(slice.savedImageUrl, slice.currentTrack, slice.currentAlbum)
)

const saveCurrentTrack = (savedTrackUri: string | undefined, track: ResolvedTrack | undefined) => {
  if (track?.uri === savedTrackUri) {
    return
  }
  fs.writeFile(txtMain, track ? `${track.name} - ${track.artists.join(', ')}` : '')
  fs.writeFile(txtArtist, track ? track.artists.join(', ') : '')
  fs.writeFile(txtTrack, track?.name || '')
  fs.writeFile(txtURI, track?.uri || '')

  applicationStore.setState({
    savedTrackUri: track?.uri
  })
}
applicationStore.subscribe(
  (state) => ({
    savedTrackUri: state.savedTrackUri,
    currentTrack: state.currentTrack
  }),
  (slice) => saveCurrentTrack(slice.savedTrackUri, slice.currentTrack)
)

const saveCurrentAlbum = (savedAlbumUri: string | undefined, album: ResolvedAlbum | undefined) => {
  if (album?.uri === savedAlbumUri) {
    return
  }
  fs.writeFile(txtAlbum, album?.name || '')
  applicationStore.setState({
    savedAlbumUri: album?.uri
  })
}
applicationStore.subscribe(
  (state) => ({
    savedAlbumUri: state.savedAlbumUri,
    currentAlbum: state.currentAlbum
  }),
  (slice) => saveCurrentAlbum(slice.savedAlbumUri, slice.currentAlbum)
)

const resolveCurrentState = (state: ApplicationState) => {
  if (!state.isPlaying || !state.currentTrackUri) {
    if (state.currentTrack || state.currentAlbum) {
      applicationStore.setState({
        currentTrack: undefined,
        currentAlbum: undefined
      })
    }
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
    const albumImage = state.imageUriUrlMap[album.uri] || undefined
    if (
      album.uri !== state.currentAlbum?.uri ||
      (state.currentAlbum && albumImage !== state.currentAlbum.image)
    ) {
      applicationStore.setState({
        currentAlbum: {
          ...album,
          image: albumImage
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

writeBlankImageToDisk()
writeBlankTextToDisk()

export const handleSpotifyTrackData = (tracks: any[]) => {
  if (!tracks || !Array.isArray(tracks)) {
    return
  }
  applicationStore.setState(
    produce<ApplicationState>((state) => {
      for (const track of tracks) {
        if (track?.uri) {
          const cleanTrack: Track = {
            uri: track.uri,
            albumUri: track.album.uri,
            name: track.name,
            artists: track.artists.map((artist) => artist.name)
          }

          state.trackMap[cleanTrack.uri] = cleanTrack

          if (track.linked_from?.uri) {
            cleanTrack.linkedFromUri = track.linked_from.uri
            state.trackMap[track.linked_from.uri] = cleanTrack
          }
        }

        if (track?.album?.uri) {
          const cleanAlbum: Album = {
            uri: track.album.uri,
            name: track.album.name
          }

          state.albumMap[cleanAlbum.uri] = cleanAlbum

          const albumArtUrl = (
            track.album.images.find((image) => image.width === 300) ?? track.album.images.at(-1)
          )?.url

          if (albumArtUrl) {
            state.imageUriUrlMap[track.album.uri] = albumArtUrl
          }
        }
      }
    })
  )
}

export const handleSpotifyPlayerState = (player_state: any) => {
  if (!player_state) {
    return
  }
  applicationStore.setState(
    produce<ApplicationState>((state) => {
      state.lastUpdatedAt = parseInt(player_state.timestamp) || 0
      state.isPlaying = !player_state.is_paused
      state.positionMs = parseInt(player_state.position_as_of_timestamp) || 0
      state.currentTrackUri = player_state.track?.uri || undefined
      if (
        player_state.track?.uri &&
        player_state.track?.metadata?.image_url?.includes('spotify:image:')
      ) {
        state.imageUriUrlMap[player_state.track.uri] =
          player_state.track.metadata.image_url.replace(
            'spotify:image:',
            'https://i.scdn.co/image/'
          )
      }
    })
  )
}
