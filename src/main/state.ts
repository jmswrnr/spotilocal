import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

export type Track = {
  uri: string
  albumName: string
  albumArtUrl: string
  name: string
  artists: string[]
}

export interface ApplicationState {
  isLoggedIn: boolean | null
  isPlaying: boolean
  positionMs: number
  lastUpdatedAt?: number,
  currentTrackUri?: string
  trackMap: Record<string, Track>
  savedTrackUri?: string
}

export const applicationStore = create<ApplicationState>()(
  subscribeWithSelector((_set) => ({
    isLoggedIn: null,
    isPlaying: false,
    positionMs: 0,
    trackMap: {}
  }))
)
