import { applicationStore, userStateSlice } from './state'
import fs from 'node:fs/promises'
import {
  imgOutput,
  jsonOutput,
  transparent1px,
  txtAlbum,
  txtArtist,
  txtMain,
  txtTrack,
  txtURI
} from './constants'
import { produce } from 'immer'
import { fetchImageFromRenderer } from '.'
import {
  Album,
  ApplicationState,
  ResolvedAlbum,
  ResolvedTrack,
  Track,
  UserExposedState
} from '@shared/types/state'

const writeTrackImageToDisk = async (imageUrl: string) => {
  const imagedata = await fetchImageFromRenderer(imageUrl)
  if (imageUrl === applicationStore.getState().savedImageUrl) {
    fs.writeFile(imgOutput, imagedata)
  }
}

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
  isPlaying: boolean,
  savedImageUrl: string | undefined,
  album: ResolvedAlbum | undefined,
  emptyFilesWhenPaused: boolean
) => {
  const shouldbeEmpty = !isPlaying && emptyFilesWhenPaused

  if (!shouldbeEmpty && album?.image) {
    if (savedImageUrl !== album.image) {
      applicationStore.setState({
        savedImageUrl: album.image
      })
      await writeTrackImageToDisk(album.image)
    }
    return
  }

  if (savedImageUrl !== undefined) {
    applicationStore.setState({
      savedImageUrl: undefined
    })
    await writeBlankImageToDisk()
  }
}
applicationStore.subscribe(
  (state) => ({
    isPlaying: state.isPlaying,
    savedImageUrl: state.savedImageUrl,
    currentAlbum: state.currentAlbum,
    emptyFilesWhenPaused: state.userSettings.emptyFilesWhenPaused
  }),
  (slice) =>
    saveCurrentImage(
      slice.isPlaying,
      slice.savedImageUrl,
      slice.currentAlbum,
      slice.emptyFilesWhenPaused
    )
)

const saveCurrentTrack = (
  isPlaying: boolean,
  savedTrackUri: string | undefined,
  track: ResolvedTrack | undefined,
  emptyFilesWhenPaused: boolean
) => {
  const shouldbeEmpty = !isPlaying && emptyFilesWhenPaused

  if (!shouldbeEmpty && track) {
    if (savedTrackUri !== track.uri) {
      applicationStore.setState({
        savedTrackUri: track.uri
      })
      fs.writeFile(
        txtMain,
        `${track.name} - ${track.artists.map((artist) => artist.name).join(', ')}`
      )
      fs.writeFile(txtArtist, track.artists.map((artist) => artist.name).join(', '))
      fs.writeFile(txtTrack, track.name)
      fs.writeFile(txtURI, track.uri)
    }
    return
  }

  if (savedTrackUri !== undefined) {
    applicationStore.setState({
      savedTrackUri: undefined
    })
    fs.writeFile(txtMain, '')
    fs.writeFile(txtArtist, '')
    fs.writeFile(txtTrack, '')
    fs.writeFile(txtURI, '')
  }
}
applicationStore.subscribe(
  (state) => ({
    isPlaying: state.isPlaying,
    savedTrackUri: state.savedTrackUri,
    currentTrack: state.currentTrack,
    emptyFilesWhenPaused: state.userSettings.emptyFilesWhenPaused
  }),
  (slice) =>
    saveCurrentTrack(
      slice.isPlaying,
      slice.savedTrackUri,
      slice.currentTrack,
      slice.emptyFilesWhenPaused
    )
)

const saveCurrentAlbum = (
  isPlaying: boolean,
  savedAlbumUri: string | undefined,
  album: ResolvedAlbum | undefined,
  emptyFilesWhenPaused: boolean
) => {
  const shouldbeEmpty = !isPlaying && emptyFilesWhenPaused

  if (!shouldbeEmpty && album) {
    if (savedAlbumUri !== album.uri) {
      applicationStore.setState({
        savedAlbumUri: album.uri
      })
      fs.writeFile(txtAlbum, album.name)
    }
    return
  }

  if (savedAlbumUri !== undefined) {
    applicationStore.setState({
      savedAlbumUri: undefined
    })
    fs.writeFile(txtAlbum, '')
  }
}
applicationStore.subscribe(
  (state) => ({
    isPlaying: state.isPlaying,
    savedAlbumUri: state.savedAlbumUri,
    currentAlbum: state.currentAlbum,
    emptyFilesWhenPaused: state.userSettings.emptyFilesWhenPaused
  }),
  (slice) =>
    saveCurrentAlbum(
      slice.isPlaying,
      slice.savedAlbumUri,
      slice.currentAlbum,
      slice.emptyFilesWhenPaused
    )
)

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

const handleRemoteStateSliceUpdate = (slice: UserExposedState, saveJsonFile: boolean) => {
  if (saveJsonFile) {
    fs.writeFile(jsonOutput, JSON.stringify(slice, null, 2))
  }
}

applicationStore.subscribe(
  (state) => ({
    slice: userStateSlice(state),
    saveJsonFile: state.userSettings.saveJsonFile
  }),
  (data) => handleRemoteStateSliceUpdate(data.slice, data.saveJsonFile)
)

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
            artists: track.artists.map((artist) => ({
              name: artist.name,
              uri: artist.uri
            }))
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
      state.durationMs = parseInt(player_state.duration) || 0
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
