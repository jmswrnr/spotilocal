import type { RemoteApplicationState } from '@shared/types/state'
import { create } from 'zustand'

export const useRemoteApplicationStore = create<RemoteApplicationState | null>(() => null)

window.electron.ipcRenderer.on('state-update', (_event, state: RemoteApplicationState) => {
  useRemoteApplicationStore.setState(state)
})

window.electron.ipcRenderer.send('get-state')
