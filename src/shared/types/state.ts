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

export type UserSettings = {
  emptyFilesWhenPaused: boolean
}

export interface RemoteApplicationState {
  isUpdateAvailable: boolean | null
  isLoggedIn: boolean | null
  isPlaying: boolean
  positionMs: number
  durationMs: number
  lastUpdatedAt?: number
  currentTrack?: Track
  currentAlbum?: ResolvedAlbum
  userSettings: UserSettings
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
