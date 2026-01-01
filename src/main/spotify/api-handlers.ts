import { produce } from 'immer'
import { applicationStore } from '../state'
import { Album, ApplicationState, Track } from '@shared/types/state'

type TrackDataV1 = {
  uri: string
  name: string
  album: {
    uri: string
    name: string
    images: {
      width: number
      height: number
      url: string
    }[]
  }
  artists: {
    uri: string
    name: string
  }[]
  linked_from?: {
    uri: string
  }
}

type TrackDataV2 = {
  __typename: 'Track'
  uri: string
  name: string
  albumOfTrack: {
    uri: string
    name: string
    coverArt: {
      sources: {
        url: string
        width: number
        height: number
      }[]
    }
  }
  artists: {
    items:{
      uri: string
      profile: {
        name: string
      }
    }[]
  }
}

const convertTrackDataV2ToTrackDataV1 = (track: TrackDataV2): TrackDataV1 => {
  return {
    uri: track.uri,
    name: track.name,
    album: {
      uri: track.albumOfTrack.uri,
      name: track.albumOfTrack.name,
      images: track.albumOfTrack.coverArt.sources.map((source) => ({
        width: source.width,
        height: source.height,
        url: source.url
      }))
    },
    artists: track.artists.items.map((artist) => ({
      uri: artist.uri,
      name: artist.profile.name
    }))
  }
}

export const handleSpotifyTrackDataV2 = (tracks: TrackDataV2[] | undefined) => {
  if (!tracks || !Array.isArray(tracks)) {
    return
  }
  const trackDataV1 = tracks.map((track) => convertTrackDataV2ToTrackDataV1(track))
  handleSpotifyTrackDataV1(trackDataV1)
}

export const handleSpotifyTrackDataV1 = (tracks: TrackDataV1[] | undefined) => {
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
