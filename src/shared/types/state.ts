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

export type ResolvedTrack = Track & {
  canvas: string | null
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

export type CanvasFile = {
  fileId: string
  type: string
  uri: string
  url: string
}

export type ResolvedAlbum = Album & Partial<Images>

export type TrackHistoryEntry = {
  trackUri: string
  timestamp: number
}

export type UserSettings = {
  dev_showSpotifyPlayer?: boolean
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
  currentTrack?: ResolvedTrack
  currentAlbum?: ResolvedAlbum
  currentArtists?: Artist[]
}

export interface RemoteApplicationState extends UserExposedState {
  isDevMode: boolean
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
  // imageUriUrlMap maps album.uri to imagedata
  imageUriUrlMap: Record<string, Images>
  // canvasMap maps track.uri to canvas file data
  canvasMap: Record<string, CanvasFile | undefined>
  currentPlaybackId?: string
  latestStoredPlaybackId?: string
  playbackHistory: TrackHistoryEntry[]
  systemClockOffset: number
  serverLastUpdatedAt?: number
}
