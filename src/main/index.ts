import electron, { app, BrowserWindow, ipcMain, components, Tray, shell, dialog } from 'electron'
import { join } from 'path'
import icon from '../../resources/icon-16.png?asset'
import { handleSpotifyPlayerState, handleSpotifyTrackData } from './spotify'
import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { applicationStore, remoteStateSlice } from './state'
import { isUpdateAvailable as getIsUpdateAvailable } from './update-check'
import { autoPlacement, computePosition } from '@floating-ui/core'
import { ApplicationState, RemoteApplicationState, UserSettings } from '@shared/types/state'
import { SETTINGS_WINDOW_SIZE } from './constants'
import { produce } from 'immer'

app.commandLine.appendSwitch('wm-window-animations-disabled')

let tray: Tray
let spotifyWindow: BrowserWindow
let settingsWindow: BrowserWindow

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

const positionWindowToTray = async (window: BrowserWindow, animate: boolean = false) => {
  const [windowWidth, windowHeight] = window.getSize()
  const position = await computePosition(
    tray.getBounds(),
    { width: windowWidth, height: windowHeight, x: 0, y: 0 },
    {
      platform: {
        getElementRects: (data) => data,
        getDimensions: (element) => element,
        getClippingRect: () => electron.screen.getPrimaryDisplay().workArea
      },
      middleware: [autoPlacement()]
    }
  )
  window.setPosition(position.x, position.y, animate)
}

const toggleSettingsWindow = async () => {
  if (settingsWindow.isVisible()) {
    settingsWindow.hide()
  } else {
    await positionWindowToTray(settingsWindow)
    settingsWindow.show()

    if (is.dev) {
      settingsWindow.webContents.openDevTools({ mode: 'detach' })
    }
  }
}

const sendStateToRenderer = (slice: RemoteApplicationState) => {
  if (!settingsWindow) {
    return
  }

  settingsWindow.webContents.send('state-update', slice)
}

applicationStore.subscribe(remoteStateSlice, (slice) => sendStateToRenderer(slice))

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

  getIsUpdateAvailable().then((isUpdateAvailable: boolean) => {
    applicationStore.setState({
      isUpdateAvailable
    })
  })

  settingsWindow = new BrowserWindow({
    ...SETTINGS_WINDOW_SIZE,
    useContentSize: true,
    alwaysOnTop: true,
    fullscreenable: false,
    frame: false,
    resizable: false,
    show: false,
    skipTaskbar: true,
    transparent: true,
    webPreferences: {
      sandbox: false,
      devTools: true,
      preload: join(__dirname, '../preload/settings.js')
    }
  })
  settingsWindow.setMenu(null)
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    settingsWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    settingsWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
  settingsWindow.on('resize', () => {
    positionWindowToTray(settingsWindow)
  })

  if (!is.dev) {
    settingsWindow.on('blur', () => {
      settingsWindow.hide()
    })
  }

  tray = new Tray(icon)
  tray.on('click', () => toggleSettingsWindow())
  tray.on('right-click', () => toggleSettingsWindow())
  tray.setTitle('Spotilocal')
  tray.setToolTip('Spotilocal')

  spotifyWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    webPreferences: {
      sandbox: false,
      partition: 'persist:spotify',
      contextIsolation: false,
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

  spotifyWindow.on('close', (event) => {
    event.preventDefault()
    spotifyWindow.hide()
  })

  electronApp.setAppUserModelId('com.spotilocal.app')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on('set-user-settings', (_event, patch: Partial<UserSettings>) => {
    applicationStore.setState(
      produce<ApplicationState>((state) => {
        state.userSettings = {
          ...state.userSettings,
          ...patch
        }
      })
    )
  })

  ipcMain.on('get-state', () => {
    sendStateToRenderer(remoteStateSlice(applicationStore.getState()))
  })

  ipcMain.on('get-update', () => {
    shell.openPath('https://github.com/jmswrnr/spotilocal/releases/latest')
    settingsWindow.blur()
  })

  ipcMain.on('quit', () => {
    spotifyWindow.destroy()
    settingsWindow.destroy()
    app.quit()
  })

  ipcMain.on('logout', async () => {
    await spotifyWindow?.webContents.session.clearStorageData()
    await spotifyWindow?.loadURL(__LOGIN_URL__)
    spotifyWindow?.moveTop()
    spotifyWindow?.focus()
    spotifyWindow?.show()
    settingsWindow.blur()
  })

  ipcMain.on('login', async () => {
    await spotifyWindow?.loadURL(__LOGIN_URL__)
    spotifyWindow?.moveTop()
    spotifyWindow?.focus()
    spotifyWindow?.show()
  })

  ipcMain.on('spotify-logged-in', () => {
    applicationStore.setState({
      isLoggedIn: true
    })
  })

  ipcMain.on('spotify-track-data', (_event, tracks) => handleSpotifyTrackData(tracks))

  ipcMain.on('spotify-player-state', (_event, player_state) =>
    handleSpotifyPlayerState(player_state)
  )

  app.on('window-all-closed', () => {
    app.quit()
  })
})
