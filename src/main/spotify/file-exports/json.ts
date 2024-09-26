import { Track, UserExposedState } from '@shared/types/state'
import fs from 'node:fs/promises'
import { jsonOutput } from '../../constants'
import { applicationStore, userStateSlice } from '../../state'
import { shallow } from 'zustand/shallow'

type JsonOutput = Omit<UserExposedState, 'currentTrack'> & {
  currentTrack?: ReturnType<typeof cleanCurrentTrack>
}

const cleanCurrentTrack = (
  currentTrack: Track | undefined
): Omit<Track, 'albumUri' | 'artistUris'> | undefined => {
  if (!currentTrack) {
    return undefined
  }
  const { albumUri, artistUris, ...rest } = currentTrack
  return rest
}

const handleUserExposedStateSliceUpdate = (slice: UserExposedState, saveJsonFile: boolean) => {
  if (saveJsonFile) {
    const outputData: JsonOutput = {
      ...slice
    }
    const cleanedCurrentTrack = cleanCurrentTrack(slice.currentTrack)
    if (cleanedCurrentTrack) {
      outputData.currentTrack = cleanedCurrentTrack
    }
    fs.writeFile(jsonOutput, JSON.stringify(outputData, null, 2))
  }
}

applicationStore.subscribe(
  (state) => ({
    slice: userStateSlice(state),
    saveJsonFile: state.userSettings.saveJsonFile
  }),
  (data) => handleUserExposedStateSliceUpdate(data.slice, data.saveJsonFile),
  { equalityFn: shallow }
)
