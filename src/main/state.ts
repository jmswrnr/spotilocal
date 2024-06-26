import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

export type Track = {
  uri: string
  linkedFromUri?: string
  albumUri: string
  name: string
  artists: string[]
}

export type ResolvedTrack = Track

export type Album = {
  uri: string
  name: string
}

export type ResolvedAlbum = Album & {
  image?: string
}

export interface RemoteApplicationState {
  isLoggedIn: boolean | null
  isPlaying: boolean
  positionMs: number
  lastUpdatedAt?: number
  currentTrack?: Track
  currentAlbum?: ResolvedAlbum
}

export interface ApplicationState extends RemoteApplicationState {
  currentTrackUri?: string
  trackMap: Record<string, Track | undefined>
  albumMap: Record<string, Album | undefined>
  imageUriUrlMap: Record<string, string>
  savedTrackUri?: string
  savedAlbumUri?: string
  savedImageUrl?: string
}

export const applicationStore = create<ApplicationState>()(
  subscribeWithSelector((_set) => ({
    isLoggedIn: null,
    isPlaying: false,
    positionMs: 0,
    trackMap: {},
    albumMap: {},
    imageUriUrlMap: {}
  }))
)
