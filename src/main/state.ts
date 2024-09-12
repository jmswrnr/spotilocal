import type {
  ApplicationState,
  RemoteApplicationState,
  UserExposedState
} from '@shared/types/state'
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { settingsDiskStore } from './disk-storage'
import { shallow } from 'zustand/shallow'
import { DEFAULT_USER_SETTINGS } from './constants'

export const userStateSlice = (state: RemoteApplicationState): UserExposedState => ({
  isPlaying: state.isPlaying,
  positionMs: state.positionMs,
  durationMs: state.durationMs,
  lastUpdatedAt: state.lastUpdatedAt,
  currentTrack: state.currentTrack,
  currentAlbum: state.currentAlbum
})

export const remoteStateSlice = (state: ApplicationState): RemoteApplicationState => ({
  isUpdateAvailable: state.isUpdateAvailable,
  isLoggedIn: state.isLoggedIn,
  userSettings: state.userSettings,
  webWidgetPortError: state.webWidgetPortError,
  ...userStateSlice(state)
})

export const applicationStore = create<ApplicationState>()(
  subscribeWithSelector((_set) => ({
    isUpdateAvailable: null,
    isLoggedIn: null,
    isPlaying: false,
    positionMs: 0,
    durationMs: 0,
    trackMap: {},
    albumMap: {},
    imageUriUrlMap: {},
    webWidgetPortError: false,
    userSettings: {
      ...DEFAULT_USER_SETTINGS,
      ...settingsDiskStore.store
    }
  }))
)

applicationStore.subscribe(
  (state) => state.userSettings,
  (userSettings) => {
    settingsDiskStore.store = userSettings
  },
  { equalityFn: shallow }
)
