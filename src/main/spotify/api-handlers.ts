import { produce } from 'immer'
import { applicationStore } from '../state'
import { Album, ApplicationState, Track } from '@shared/types/state'

export const handleSpotifyTrackData = (tracks: any) => {
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
            artistUris: track.artists.map((artist) => artist.uri),
            name: track.name
          }

          state.trackMap[cleanTrack.uri] = cleanTrack

          for (const artist of track.artists) {
            state.artistMap[artist.uri] = {
              name: artist.name,
              uri: artist.uri
            }
          }

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
      state.serverLastUpdatedAt = parseInt(player_state.timestamp) || 0
      state.durationMs = parseInt(player_state.duration) || 0
      state.isPlaying = !player_state.is_paused
      state.positionMs = parseInt(player_state.position_as_of_timestamp) || 0
      state.currentPlaybackId = player_state.playback_id
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
