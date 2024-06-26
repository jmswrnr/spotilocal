import type { ApplicationState, RemoteApplicationState } from '@shared/types/state'
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

export const remoteStateSlice = (state: ApplicationState):RemoteApplicationState => ({
  isUpdateAvailable: state.isUpdateAvailable,
  isLoggedIn: state.isLoggedIn,
  isPlaying: state.isPlaying,
  positionMs: state.positionMs,
  lastUpdatedAt: state.lastUpdatedAt,
  currentTrack: state.currentTrack,
  currentAlbum: state.currentAlbum,
  userSettings: state.userSettings
})

export const applicationStore = create<ApplicationState>()(
  subscribeWithSelector((_set) => ({
    isUpdateAvailable: null,
    isLoggedIn: null,
    isPlaying: false,
    positionMs: 0,
    trackMap: {},
    albumMap: {},
    imageUriUrlMap: {},
    userSettings: {
      test: false
    }
  }))
)
