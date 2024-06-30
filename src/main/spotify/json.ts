import { UserExposedState } from '@shared/types/state'
import fs from 'node:fs/promises'
import { jsonOutput } from '../constants'
import { applicationStore, userStateSlice } from '../state'
import { shallow } from 'zustand/shallow'

const handleUserExposedStateSliceUpdate = (slice: UserExposedState, saveJsonFile: boolean) => {
  if (saveJsonFile) {
    fs.writeFile(jsonOutput, JSON.stringify(slice, null, 2))
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
