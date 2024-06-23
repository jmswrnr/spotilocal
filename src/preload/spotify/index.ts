import { ipcRenderer } from 'electron'

if (window.fetch.toString().includes('native')) {
  const superFetch = window.fetch
  window.fetch = async (...args) => {
    const response = await superFetch(...args)
    if (typeof args?.[0] === 'string' && args[0].includes('/v1/tracks')) {
      const tracks = (await response.json())?.tracks
      tracks && ipcRenderer.send('spotify-track-data', tracks)
    }
    return response
  }
}

ipcRenderer.on('fetch-image', async (event, url) => {
  const response = await fetch(url)
  const data = Buffer.from(await response.arrayBuffer())
  event.sender.send(`return-fetch-image-${url}`, data)
})

if (window.WebSocket.toString().includes('native')) {
  window.WebSocket = class extends WebSocket {
    constructor(url, protocol) {
      super(url, protocol)
      if (url.includes(__WEBSOCKET_HOSTNAME_PARTIAL__)) {
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
