import { Artist, Track } from '@shared/types/state'

export const formatArtists = (artists: Artist[]) =>
  artists.map((artist) => artist?.name || '?').join(', ')

export const formatName = (track: Track, artists: Artist[]) =>
  `${track.name} - ${formatArtists(artists)}`
