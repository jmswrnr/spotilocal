import { ipcRenderer } from 'electron'

try {
  // Delete all IndexedDB databases
  // This ensures queries are not cached so we can hook the response
  indexedDB.databases().then(databases => {
    databases.forEach(db => {
      if (db.name) {
        indexedDB.deleteDatabase(db.name)
      }
    })
  })
} catch {}

if (window.fetch.toString().includes('native')) {
  const superFetch = window.fetch
  window.fetch = async (...args) => {
    if (typeof args?.[0] === 'string') {
      switch (true) {
        case args[0].includes('/pathfinder/v2/query'): {
          let response = await superFetch(...args)
          const data = (await response.clone().json())?.data
          if (data && typeof data === 'object') {
            if ('tracks' in data && Array.isArray(data.tracks)) {
              ipcRenderer.send('spotify-track-data-v2', data.tracks)
            }
            if('trackUnion' in data && typeof data.trackUnion === 'object' && 'canvas' in data.trackUnion && data.trackUnion.canvas && data.trackUnion.uri) {
              ipcRenderer.send('spotify-canvas-data', data.trackUnion)
            }
          }
          return response
        }
        case args[0].includes('/v1/tracks'): {
          let response = await superFetch(...args)
          const tracks = (await response.clone().json())?.tracks
          tracks && ipcRenderer.send('spotify-track-data', tracks)
          return response
        }
        case args[0].includes('/connect-state/v1'): {
          let response = await superFetch(...args)
          const player_state = (await response.clone().json())?.player_state
          player_state && ipcRenderer.send('spotify-player-state', player_state)
          console.log('spotify-player-state', player_state)
          return response
        }
        case args[0].includes('/melody/v1/time'): {
          const startTimestamp = Date.now()
          let response = await superFetch(...args)
          const endTimeStamp = Date.now()
          const requestDuration = endTimeStamp - startTimestamp
          const serverTimestamp = (await response.clone().json())?.timestamp
          const expectedServerTimestamp = startTimestamp + requestDuration * 0.5
          const timestampDrift = expectedServerTimestamp - serverTimestamp
          timestampDrift && ipcRenderer.send('set-system-clock-offset', timestampDrift)
          return response
        }
      }
    }

    return await superFetch(...args)
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
