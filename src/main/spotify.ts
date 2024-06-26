import { Album, ApplicationState, Track, applicationStore } from './state'
import fs from 'node:fs/promises'
import path from 'node:path'
import { filePrefix, outputDirectory } from './constants'
import { produce } from 'immer'
import { fetchImageFromRenderer } from '.'

const writeTrackImageToDisk = async (trackUri: string, imageUrl: string) => {
  await writeBlankImageToDisk()
  const imagedata = await fetchImageFromRenderer(imageUrl)
  if (trackUri === applicationStore.getState().savedTrackUri) {
    console.log('writing!', imagedata)
    fs.writeFile(path.join(outputDirectory, `${filePrefix}.png`), imagedata)
  }
}

export const transparent1px = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64'
)

const writeBlankImageToDisk = async () => {
  fs.writeFile(path.join(outputDirectory, `${filePrefix}.png`), transparent1px)
}

const writeDataToDisk = (track: Track, album?: Album) => {
  fs.writeFile(
    path.join(outputDirectory, `${filePrefix}.txt`),
    `${track.name} - ${track.artists.join(', ')}`
  )
  fs.writeFile(
    path.join(outputDirectory, `${filePrefix}_Artist.txt`),
    track.artists.join(', ') || ''
  )
  fs.writeFile(path.join(outputDirectory, `${filePrefix}_Track.txt`), track.name || '')
  fs.writeFile(path.join(outputDirectory, `${filePrefix}_Album.txt`), album?.name || '')
  fs.writeFile(path.join(outputDirectory, `${filePrefix}_URI.txt`), track.uri || '')
  writeBlankImageToDisk()
}

const writeBlankToDisk = () => {
  fs.writeFile(path.join(outputDirectory, `${filePrefix}.txt`), '')
  fs.writeFile(path.join(outputDirectory, `${filePrefix}_Artist.txt`), '')
  fs.writeFile(path.join(outputDirectory, `${filePrefix}_Track.txt`), '')
  fs.writeFile(path.join(outputDirectory, `${filePrefix}_Album.txt`), '')
  fs.writeFile(path.join(outputDirectory, `${filePrefix}_URI.txt`), '')
  writeBlankImageToDisk()
}

const saveStateToDisk = (state: ApplicationState) => {
  if (state.isPlaying) {
    if (!state.currentTrackUri) {
      return
    }
    const track = state.trackMap[state.currentTrackUri]
    if (!track || track.uri === state.savedTrackUri) {
      return
    }

    const album = state.albumMap[track.albumUri]

    applicationStore.setState({
      savedTrackUri: track.uri
    })

    const image =
      (track.linkedFromUri && state.imageUriUrlMap[track.linkedFromUri]) ||
      state.imageUriUrlMap[track.uri] ||
      state.imageUriUrlMap[album?.uri] ||
      undefined

    if (image) {
      writeTrackImageToDisk(track.uri, image)
    } else {
      writeBlankImageToDisk()
    }

    writeDataToDisk(track, album)
  } else {
    // not playing
    if (!state.savedTrackUri) {
      return
    }

    applicationStore.setState({
      savedTrackUri: undefined
    })

    writeBlankToDisk()
  }
}

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

applicationStore.subscribe((state) => saveStateToDisk(state))
writeBlankToDisk()
