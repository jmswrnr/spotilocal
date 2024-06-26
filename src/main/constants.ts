
import path from 'node:path'
import { outputDirectory } from './env'
export const filePrefix = 'Spotilocal'

export const txtTrack = path.join(outputDirectory, `${filePrefix}_Track.txt`)
export const txtURI = path.join(outputDirectory, `${filePrefix}_URI.txt`)
export const txtArtist = path.join(outputDirectory, `${filePrefix}_Artist.txt`)
export const txtAlbum = path.join(outputDirectory, `${filePrefix}_Album.txt`)
export const txtMain = path.join(outputDirectory, `${filePrefix}.txt`)
export const imgOutput = path.join(outputDirectory, `${filePrefix}.png`)

export const transparent1px =
  Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64')