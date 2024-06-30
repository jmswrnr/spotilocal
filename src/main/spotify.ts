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
import { shallow } from 'zustand/shallow'

let savedImageUrl: string | undefined
let savedTrackUri: string | undefined
let savedAlbumUri: string | undefined

const writeTrackImageToDisk = async (imageUrl: string) => {
  savedImageUrl = imageUrl
  const imagedata = await fetchImageFromRenderer(imageUrl)
  if (savedImageUrl === imageUrl) {
    fs.writeFile(imgOutput, imagedata)
  }
}

const writeBlankImageToDisk = async () => {
  savedImageUrl = undefined
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
  album: ResolvedAlbum | undefined,
  emptyFilesWhenPaused: boolean
) => {
  const shouldbeEmpty = !isPlaying && emptyFilesWhenPaused

  if (!shouldbeEmpty && album?.image_medium) {
    if (savedImageUrl !== album.image_medium) {
      await writeTrackImageToDisk(album.image_medium)
    }
    return
  }

  if (savedImageUrl !== undefined) {
    await writeBlankImageToDisk()
  }
}
applicationStore.subscribe(
  (state) => ({
    isPlaying: state.isPlaying,
    currentAlbum: state.currentAlbum,
    emptyFilesWhenPaused: state.userSettings.emptyFilesWhenPaused
  }),
  (slice) => saveCurrentImage(slice.isPlaying, slice.currentAlbum, slice.emptyFilesWhenPaused),
  { equalityFn: shallow }
)

const saveCurrentTrack = (
  isPlaying: boolean,
  track: ResolvedTrack | undefined,
  emptyFilesWhenPaused: boolean
) => {
  const shouldbeEmpty = !isPlaying && emptyFilesWhenPaused

  if (!shouldbeEmpty && track) {
    if (savedTrackUri !== track.uri) {
      savedTrackUri = track.uri
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
    savedTrackUri = undefined
    fs.writeFile(txtMain, '')
    fs.writeFile(txtArtist, '')
    fs.writeFile(txtTrack, '')
    fs.writeFile(txtURI, '')
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

const saveCurrentAlbum = (
  isPlaying: boolean,
  album: ResolvedAlbum | undefined,
  emptyFilesWhenPaused: boolean
) => {
  const shouldbeEmpty = !isPlaying && emptyFilesWhenPaused

  if (!shouldbeEmpty && album) {
    if (savedAlbumUri !== album.uri) {
      savedAlbumUri = album.uri
      fs.writeFile(txtAlbum, album.name)
    }
    return
  }

  if (savedAlbumUri !== undefined) {
    savedAlbumUri = undefined
    fs.writeFile(txtAlbum, '')
  }
}
applicationStore.subscribe(
  (state) => ({
    isPlaying: state.isPlaying,
    currentAlbum: state.currentAlbum,
    emptyFilesWhenPaused: state.userSettings.emptyFilesWhenPaused
  }),
  (slice) => saveCurrentAlbum(slice.isPlaying, slice.currentAlbum, slice.emptyFilesWhenPaused),
  { equalityFn: shallow }
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
  (data) => handleRemoteStateSliceUpdate(data.slice, data.saveJsonFile),
  { equalityFn: shallow }
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

          track.album.images?.sort((a, b) => {
            return a.width - b.width
          })

          const image_small = track.album.images.at(0)?.url
          const image_medium = track.album.images.at(1)?.url
          const image_large = track.album.images.at(-1)?.url

          if (image_small || image_medium || image_large) {
            state.imageUriUrlMap[track.album.uri] = {
              image_small: image_small || image_medium || image_large,
              image_medium: image_medium || image_large || image_small,
              image_large: image_large || image_medium || image_small
            }
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
        (player_state.track?.metadata?.image_small_url?.includes('spotify:image:') ||
          player_state.track?.metadata?.image_url?.includes('spotify:image:') ||
          player_state.track?.metadata?.image_large_url?.includes('spotify:image:'))
      ) {
        const image_small = player_state.track.metadata.image_small_url.replace(
          'spotify:image:',
          'https://i.scdn.co/image/'
        )
        const image_medium = player_state.track.metadata.image_url.replace(
          'spotify:image:',
          'https://i.scdn.co/image/'
        )
        const image_large = player_state.track.metadata.image_large_url.replace(
          'spotify:image:',
          'https://i.scdn.co/image/'
        )
        state.imageUriUrlMap[player_state.track.uri] = {
          image_small: image_small || image_medium || image_large,
          image_medium: image_medium || image_large || image_small,
          image_large: image_large || image_medium || image_small
        }
      }
    })
  )
}
