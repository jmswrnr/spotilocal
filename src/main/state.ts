import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

export type Track = {
  uri: string
  linkedFromUri?: string
  albumUri: string
  name: string
  artists: string[]
}

export type Album = {
  uri: string
  name: string
}

export interface ApplicationState {
  isLoggedIn: boolean | null
  isPlaying: boolean
  positionMs: number
  lastUpdatedAt?: number
  currentTrackUri?: string
  trackMap: Record<string, Track>
  albumMap: Record<string, Album>
  imageUriUrlMap: Record<string, string>
  savedTrackUri?: string
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
