import fs from 'node:fs'
import { historyJsonOutput } from '../../constants'
import { ApplicationState } from '@shared/types/state'

export type HistoryJson = {
  trackMap: ApplicationState['trackMap']
  albumMap: ApplicationState['albumMap']
  artistMap: ApplicationState['artistMap']
  history: ApplicationState['playbackHistory']
  latestPlaybackId?: string
}

export const loadHistoryJson = (): HistoryJson => {
  try {
    const jsonString = fs.readFileSync(historyJsonOutput, 'utf-8')
    return JSON.parse(jsonString)
  } catch {
    return null
  }
}
