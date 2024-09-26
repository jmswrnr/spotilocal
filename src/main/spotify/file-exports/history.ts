import { applicationStore } from '../../state'
import { shallow } from 'zustand/shallow'
import { ApplicationState } from '@shared/types/state'
import { produce } from 'immer'
import fs from 'node:fs/promises'
import { writeToPath } from '@fast-csv/format'
import { historyCsvOutput, historyJsonOutput, historyTxtOutput } from '../../constants'
import { HistoryJson } from '../loaders/history'
import { formatArtists, formatName } from '../utils'
import dayjs from 'dayjs'
import { EOL } from 'node:os'

// Save History Files

applicationStore.subscribe(
  (state) => ({
    enableHistory: state.userSettings?.enableHistory,
    trackMap: state.trackMap,
    albumMap: state.albumMap,
    artistMap: state.artistMap,
    history: state.playbackHistory,
    latestPlaybackId: state.latestStoredPlaybackId
  }),
  async (slice) => {
    if (slice.enableHistory) {
      fs.writeFile(
        historyJsonOutput,
        JSON.stringify(
          {
            trackMap: slice.trackMap,
            albumMap: slice.albumMap,
            artistMap: slice.artistMap,
            history: slice.history,
            latestPlaybackId: slice.latestPlaybackId
          } satisfies HistoryJson,
          null,
          2
        )
      )
      const textOutput = slice.history
        .map((entry) => {
          const track = slice.trackMap[entry.trackUri]
          const artists = track?.artistUris.map((uri) => slice.artistMap[uri])
          if (track && artists) {
            return formatName(track, artists)
          }
          return undefined
        })
        .filter((string) => Boolean(string))
        .join(EOL)
      fs.writeFile(historyTxtOutput, textOutput, 'utf-8')

      await new Promise<void>((res, rej) => {
        const csvRows = slice.history
          .map((entry) => {
            const track = slice.trackMap[entry.trackUri]
            const album = track && slice.albumMap[track.albumUri]
            const artists = track?.artistUris.map((uri) => slice.artistMap[uri])

            if (track && album && artists) {
              return [
                track.name,
                formatArtists(artists),
                album.name,
                dayjs(entry.timestamp).format('YYYY-MM-DD HH:mm:ss')
              ]
            }

            return undefined
          })
          .filter((row) => !!row)
        writeToPath(historyCsvOutput, csvRows, { headers: ['Track', 'Artists', 'Album', 'Time'] })
          .on('error', (err: Error) => rej(err))
          .on('finish', () => res())
      })
    }
  },
  { equalityFn: shallow, fireImmediately: true }
)

// Add History Entry

applicationStore.subscribe(
  (state) => ({
    enableHistory: state.userSettings.enableHistory,
    latestStoredPlaybackId: state.latestStoredPlaybackId,
    currentPlaybackId: state.currentPlaybackId,
    currentTrackUri: state.currentTrackUri
  }),
  (slice) => {
    if (
      slice.currentTrackUri &&
      slice.enableHistory &&
      slice.currentPlaybackId &&
      slice.currentPlaybackId !== slice.latestStoredPlaybackId
    ) {
      applicationStore.setState(
        produce<ApplicationState>((state) => {
          state.latestStoredPlaybackId = slice.currentPlaybackId
          state.playbackHistory.push({
            trackUri: slice.currentTrackUri!,
            timestamp: Date.now()
          })
        })
      )
    }
  },
  { equalityFn: shallow }
)
