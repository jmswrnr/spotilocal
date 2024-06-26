import { app, BrowserWindow, ipcMain, components, Tray, Menu, shell, dialog } from 'electron'
import { join } from 'path'
import icon from '../../resources/icon-16.png?asset'
import { applicationStore } from './state'
import { isUpdateAvailable } from './update-check'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { filePrefix } from './constants'
import { handleSpotifyPlayerState, handleSpotifyTrackData } from './spotify'

let tray: Tray
let spotifyWindow: BrowserWindow

applicationStore.subscribe(
  (state) => state.isLoggedIn,
  (isLoggedIn) => {
    isLoggedIn ? spotifyWindow.hide() : spotifyWindow.show()
  }
)

export const fetchImageFromRenderer = (url: string): Promise<Uint8Array> => {
  return new Promise((resolve, reject) => {
    ipcMain.once(`return-fetch-image-${url}`, (_event, data) => {
      if (data) {
        resolve(data)
      } else {
        reject()
      }
    })
    spotifyWindow.webContents.send('fetch-image', url)
  })
}

app.whenReady().then(async () => {
  try {
    await components.whenReady([components.WIDEVINE_CDM_ID])
  } catch {
    dialog.showErrorBox(
      'Spotilocal Initialization Error',
      'Unable to load required Widevine CDM components'
    )
    return app.exit(1)
  }

  tray = new Tray(icon)

  const canUpdate = await isUpdateAvailable()
  const contextMenu = Menu.buildFromTemplate([
    {
      label: filePrefix,
      enabled: false
    },
    canUpdate
      ? {
          label: 'Update Available!',
          type: 'normal',
          click: () => {
            shell.openPath('https://github.com/jmswrnr/spotilocal/releases/latest')
          }
        }
      : {
          label: `v${__VERSION__}`,
          type: 'normal',
          enabled: false
        },
    {
      type: 'separator'
    },
    {
      label: 'Logout',
      type: 'normal',
      click: () => {
        spotifyWindow.webContents.session.clearStorageData()
      }
    },
    {
      label: 'Exit',
      type: 'normal',
      click: () => {
        app.quit()
      }
    }
  ])

  tray.setContextMenu(contextMenu)

  spotifyWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    webPreferences: {
      sandbox: false,
      partition: 'persist:spotify',
      contextIsolation: false,
      devTools: true,
      preload: join(__dirname, '../preload/spotify.js')
    }
  })
  spotifyWindow.setMenu(null)
  spotifyWindow.webContents.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
  )
  spotifyWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    if (details.url === __LOGIN_URL__) {
      applicationStore.setState({
        isLoggedIn: details.statusCode === 302
      })
    }
    callback({ cancel: false, responseHeaders: details.responseHeaders })
  })

  spotifyWindow.loadURL(__LOGIN_URL__)

  electronApp.setAppUserModelId('com.spotilocal.app')
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on('spotify-logged-in', () => {
    applicationStore.setState({
      isLoggedIn: true
    })
  })

  ipcMain.on('spotify-track-data', (_event, tracks) => handleSpotifyTrackData(tracks))

  ipcMain.on('spotify-player-state', (_event, player_state) => handleSpotifyPlayerState(player_state))

  app.on('window-all-closed', () => {
    app.quit()
  })
})
