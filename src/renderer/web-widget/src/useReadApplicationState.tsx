import type { UserExposedState } from '@shared/types/state'
import { create } from 'zustand'
import ReconnectingWebSocket from 'reconnecting-websocket'

const urlParams = new URLSearchParams(window.location.search)
const port = urlParams.get('__wsport') || new URL(location.href).port

const socket = new ReconnectingWebSocket(`ws://localhost:${port}`)

export const useRemoteApplicationStore = create<UserExposedState | null>(() => null)

socket.addEventListener('message', (event) => {
  const json = JSON.parse(event.data)
  try {
    switch (json.command) {
      case 'state': {
        useRemoteApplicationStore.setState(json.value)
        break
      }
    }
  } catch (e) {
    console.error(e)
  }
})
