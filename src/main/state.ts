import type { ApplicationState, RemoteApplicationState, UserSettings } from '@shared/types/state'
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { settingsDiskStore } from './disk-storage'

export const remoteStateSlice = (state: ApplicationState): RemoteApplicationState => ({
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
      test: false,
      ...settingsDiskStore.store
    }
  }))
)

applicationStore.subscribe(
  (state) => state.userSettings,
  (userSettings) => {
    settingsDiskStore.store = userSettings
  }
)
