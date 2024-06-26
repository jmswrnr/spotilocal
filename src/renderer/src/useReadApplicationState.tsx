import type { ApplicationState } from '@shared/types/state'
import { create } from 'zustand'

export const useRemoteApplicationStore = create<ApplicationState | null>(() => null)

window.electron.ipcRenderer.on('state-update', (_event, state: ApplicationState) => {
  useRemoteApplicationStore.setState(state)
})

window.electron.ipcRenderer.send('get-state')
