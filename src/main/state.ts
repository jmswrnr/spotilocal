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
import { loadHistoryJson } from './spotify/loaders/history'
import { is } from '@electron-toolkit/utils'

export const userStateSlice = (state: RemoteApplicationState): UserExposedState => ({
  isPlaying: state.isPlaying,
  positionMs: state.positionMs,
  durationMs: state.durationMs,
  lastUpdatedAt: state.lastUpdatedAt,
  currentTrack: state.currentTrack,
  currentAlbum: state.currentAlbum,
  currentArtists: state.currentArtists
})

export const remoteStateSlice = (state: ApplicationState): RemoteApplicationState => ({
  isDevMode: state.isDevMode,
  isUpdateAvailable: state.isUpdateAvailable,
  isLoggedIn: state.isLoggedIn,
  userSettings: state.userSettings,
  webWidgetPortError: state.webWidgetPortError,
  ...userStateSlice(state)
})

const historyJson = loadHistoryJson()

export const applicationStore = create<ApplicationState>()(
  subscribeWithSelector((_set) => ({
    isDevMode: is.dev,
    isUpdateAvailable: null,
    isLoggedIn: null,
    isPlaying: false,
    positionMs: 0,
    durationMs: 0,
    systemClockOffset: 0,
    trackMap: historyJson?.trackMap || {},
    albumMap: historyJson?.albumMap || {},
    artistMap: historyJson?.artistMap || {},
    imageUriUrlMap: {},
    webWidgetPortError: false,
    playbackHistory: historyJson?.history || [],
    latestStoredPlaybackId: historyJson?.latestPlaybackId,
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