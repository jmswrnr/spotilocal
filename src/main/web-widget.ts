import { ApplicationState } from '@shared/types/state'
import { applicationStore, userStateSlice } from './state'
import express from 'express'
import http from 'node:http'
import getPort from 'get-port'
import { AddressInfo } from 'node:net'
import { WebSocketServer } from 'ws'
import { shallow } from 'zustand/shallow'
import { is } from '@electron-toolkit/utils'
import { join } from 'node:path'

const app = express()
const server = http.createServer(app)
const wss = new WebSocketServer({ server })

app.use((req, res, next) => {
  if (!req.url.includes('web-widget') && !req.url.match(/assets\/index.*\.js/)) {
    res.sendStatus(404)
    return
  }
  res.setHeader(
    'Content-Security-Policy',
    `connect-src ws://localhost:${applicationStore.getState().userSettings.webWidgetPort.toString()}; default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://*.scdn.co`
  )
  next()
})

if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
  app.use((req, res) => {
    const newQuery = {
      ...req.query,
      __wsport: applicationStore.getState().userSettings.webWidgetPort.toString()
    }
    res.redirect(
      307,
      process.env['ELECTRON_RENDERER_URL'] +
        req.path +
        '?' +
        new URLSearchParams(newQuery).toString()
    )
  })
} else {
  app.use(express.static(join(__dirname, '../renderer')))
}

process.on('uncaughtException', (err) => {
  if (
    // @ts-ignore
    err.code === 'EADDRINUSE' &&
    // @ts-ignore
    err.port === applicationStore.getState().userSettings.webWidgetPort
  ) {
    applicationStore.setState({ webWidgetPortError: true })
  }
})

server.on('listening', () => {
  console.log('Web API: Listening', server.address())
  applicationStore.setState({ webWidgetPortError: false })
})

server.on('close', () => {
  console.log('Web API: Closed', server.address())
  resolveCurrentState(applicationStore.getState())
})

wss.on('connection', (ws) => {
  ws.send(
    JSON.stringify({
      command: 'state',
      value: userStateSlice(applicationStore.getState())
    })
  )
})

applicationStore.subscribe(
  (state) => userStateSlice(state),
  (slice) => {
    const message = JSON.stringify({
      command: 'state',
      value: slice
    })
    for (const client of wss.clients) {
      client.send(message)
    }
  },
  { equalityFn: shallow }
)

const resolveCurrentState = async (state: ApplicationState, previousState?: ApplicationState) => {
  if (
    previousState &&
    previousState?.userSettings.webWidgetPort !== state.userSettings.webWidgetPort &&
    state.webWidgetPortError === true
  ) {
    applicationStore.setState({ webWidgetPortError: false })
  }
  
  if (server.listening) {
    const port = (server.address() as AddressInfo | null)?.port
    if (
      !state.userSettings.enableWebWidget ||
      (port !== null && state.userSettings.webWidgetPort !== port)
    ) {
      server.close()
      server.closeAllConnections()
      for (const client of wss.clients) {
        client.close()
      }
    }
  } else {
    // Server not listening
    if (state.userSettings.enableWebWidget) {
      if (state.userSettings.webWidgetPort <= 0) {
        const newPort = await getPort()
        applicationStore.setState((state) => ({
          userSettings: { ...state.userSettings, webWidgetPort: newPort }
        }))
      } else if (!state.webWidgetPortError) {
        server.listen(state.userSettings.webWidgetPort)
      }
    }
  }
}

applicationStore.subscribe((state, previousState) => resolveCurrentState(state, previousState))
resolveCurrentState(applicationStore.getState())
