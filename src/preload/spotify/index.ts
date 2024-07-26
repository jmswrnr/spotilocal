import { ipcRenderer } from 'electron'

if (window.fetch.toString().includes('native')) {
  const superFetch = window.fetch
  window.fetch = async (...args) => {
    const response = await superFetch(...args)
    try {
      if (typeof args?.[0] === 'string') {
        if (args[0].includes('/v1/tracks')) {
          const tracks = (await response.clone().json())?.tracks
          tracks && ipcRenderer.send('spotify-track-data', tracks)
        } else if (args[0].includes('/connect-state/v1')) {
          const player_state = (await response.clone().json())?.player_state
          player_state && ipcRenderer.send('spotify-player-state', player_state)
        }
      }
    } catch {
      // error
    }
    return response
  }
}

ipcRenderer.on('fetch-image', async (event, url) => {
  const response = await fetch(url)
  const data = Buffer.from(await response.arrayBuffer())
  event.sender.send(`return-fetch-image-${url}`, data)
})

const wsHostRegExp = RegExp(__WEBSOCKET_HOSTNAME_PARTIAL__, 'i')

if (window.WebSocket.toString().includes('native')) {
  window.WebSocket = class extends WebSocket {
    constructor(url, protocol) {
      super(url, protocol)
      if (wsHostRegExp.test(url)) {
        ipcRenderer.send('spotify-logged-in')
        this.addEventListener('message', (event: MessageEvent) => {
          try {
            const json = JSON.parse(event.data.toString())
            const player_state = json?.payloads?.[0]?.cluster?.player_state
            player_state && ipcRenderer.send('spotify-player-state', player_state)
          } catch (e) {
            console.error(e)
          }
        })
      }
    }
  }
}
