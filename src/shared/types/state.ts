export type Artist = {
  uri: string
  name: string
}

export type Track = {
  uri: string
  linkedFromUri?: string
  albumUri: string
  name: string
  artistUris: string[]
}

export type Album = {
  uri: string
  name: string
}

export type Images = {
  image_small?: string
  image_medium?: string
  image_large?: string
}

export type ResolvedAlbum = Album & Partial<Images>

export type TrackHistoryEntry = {
  trackUri: string
  timestamp: number
}

export type UserSettings = {
  emptyFilesWhenPaused: boolean
  saveJsonFile: boolean
  saveSmallImage: boolean
  saveMediumImage: boolean
  saveLargeImage: boolean
  enableWebWidget: boolean
  webWidgetPort: number
  enableHistory: boolean
}

export interface UserExposedState {
  isPlaying: boolean
  positionMs: number
  durationMs: number
  lastUpdatedAt?: number
  currentTrack?: Track
  currentAlbum?: ResolvedAlbum
  currentArtists?: Artist[]
}

export interface RemoteApplicationState extends UserExposedState {
  webWidgetPortError: boolean
  isUpdateAvailable: boolean | null
  isLoggedIn: boolean | null
  userSettings: UserSettings
}

export interface ApplicationState extends RemoteApplicationState {
  currentTrackUri?: string
  trackMap: Record<string, Track | undefined>
  albumMap: Record<string, Album | undefined>
  artistMap: Record<string, Artist | undefined>
  imageUriUrlMap: Record<string, Images>
  currentPlaybackId?: string
  latestStoredPlaybackId?: string
  playbackHistory: TrackHistoryEntry[]
  systemClockOffset: number
  serverLastUpdatedAt?: number
}
