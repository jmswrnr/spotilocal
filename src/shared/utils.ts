import { Artist, Track } from '@shared/types/state'

export const formatArtists = (artists: (Artist | undefined)[]) =>
  artists.map((artist) => artist?.name ?? '?').join(', ')

export const formatName = (track: Track, artists: (Artist | undefined)[]) =>
  `${track.name} - ${formatArtists(artists)}`
