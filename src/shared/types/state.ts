export type Artist = {
  uri: string
  name: string
}

export type Track = {
  uri: string
  linkedFromUri?: string
  albumUri: string
  name: string
  artists: Artist[]
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
  saveJsonFile: boolean
}

export interface UserExposedState {
  isPlaying: boolean
  positionMs: number
  durationMs: number
  lastUpdatedAt?: number
  currentTrack?: Track
  currentAlbum?: ResolvedAlbum
}

export interface RemoteApplicationState extends UserExposedState {
  isUpdateAvailable: boolean | null
  isLoggedIn: boolean | null
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
