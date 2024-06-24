import { app, BrowserWindow, ipcMain, components, Tray, Menu, shell } from 'electron'
import { join } from 'path'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import icon from '../../resources/icon-16.png?asset'
import { ApplicationState, Track, Album, applicationStore } from './state'
import fs from 'node:fs/promises'
import path from 'node:path'
import { isUpdateAvailable } from './update-check'
import { produce } from 'immer'

let tray: Tray
let spotifyWindow: BrowserWindow

const outputDirectory = process.env.PORTABLE_EXECUTABLE_DIR || app.getAppPath()
const filePrefix = 'Spotilocal'

applicationStore.subscribe(
  (state) => state.isLoggedIn,
  (isLoggedIn) => {
    isLoggedIn ? spotifyWindow.hide() : spotifyWindow.show()
  }
)

const fetchImageFromRenderer = (url: string): Promise<Uint8Array> => {
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

const writeTrackImageToDisk = async (trackUri: string, imageUrl: string) => {
  await writeBlankImageToDisk()
  const imagedata = await fetchImageFromRenderer(imageUrl)
  if (trackUri === applicationStore.getState().savedTrackUri) {
    fs.writeFile(path.join(outputDirectory, `${filePrefix}.png`), imagedata)
  }
}

const transparent1px =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='

const writeBlankImageToDisk = async () => {
  fs.writeFile(
    path.join(outputDirectory, `${filePrefix}.png`),
    Buffer.from(transparent1px, 'base64')
  )
}

const writeBlankToDisk = () => {
  fs.writeFile(path.join(outputDirectory, `${filePrefix}.txt`), '')
  fs.writeFile(path.join(outputDirectory, `${filePrefix}_Artist.txt`), '')
  fs.writeFile(path.join(outputDirectory, `${filePrefix}_Track.txt`), '')
  fs.writeFile(path.join(outputDirectory, `${filePrefix}_Album.txt`), '')
  fs.writeFile(path.join(outputDirectory, `${filePrefix}_URI.txt`), '')
  writeBlankImageToDisk()
}

const writeDataToDisk = (track: Track, album?: Album) => {
  fs.writeFile(
    path.join(outputDirectory, `${filePrefix}.txt`),
    `${track.name} - ${track.artists.join(', ')}`
  )
  fs.writeFile(
    path.join(outputDirectory, `${filePrefix}_Artist.txt`),
    track.artists.join(', ') || ''
  )
  fs.writeFile(path.join(outputDirectory, `${filePrefix}_Track.txt`), track.name || '')
  fs.writeFile(path.join(outputDirectory, `${filePrefix}_Album.txt`), album?.name || '')
  fs.writeFile(path.join(outputDirectory, `${filePrefix}_URI.txt`), track.uri || '')
  writeBlankImageToDisk()
}

const saveStateToDisk = (state: ApplicationState) => {
  if (state.isPlaying) {
    if (!state.currentTrackUri) {
      return
    }
    const track = state.trackMap[state.currentTrackUri]
    if (!track || track.uri === state.savedTrackUri) {
      return
    }

    const album = state.albumMap[track.albumUri]

    applicationStore.setState({
      savedTrackUri: track.uri
    })

    const image =
      (track.linkedFromUri && state.imageUriUrlMap[track.linkedFromUri]) ||
      state.imageUriUrlMap[track.uri] ||
      state.imageUriUrlMap[album?.uri] ||
      undefined

    if (image) {
      writeTrackImageToDisk(track.uri, image)
    } else {
      writeBlankImageToDisk()
    }

    writeDataToDisk(track, album)
  } else {
    // not playing
    if (!state.savedTrackUri) {
      return
    }

    applicationStore.setState({
      savedTrackUri: undefined
    })

    writeBlankToDisk()
  }
}

applicationStore.subscribe((state) => saveStateToDisk(state))
writeBlankToDisk()

app.whenReady().then(async () => {
  await components.whenReady()

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

  electronApp.setAppUserModelId('com.electron')
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on('spotify-logged-in', () => {
    applicationStore.setState({
      isLoggedIn: true
    })
  })

  ipcMain.on('spotify-track-data', (_event, tracks) => {
    if (!tracks || !Array.isArray(tracks)) {
      return
    }
    applicationStore.setState(
      produce<ApplicationState>((state) => {
        for (const track of tracks) {
          if (track?.uri) {
            const cleanTrack: Track = {
              uri: track.uri,
              albumUri: track.album.uri,
              name: track.name,
              artists: track.artists.map((artist) => artist.name)
            }

            state.trackMap[cleanTrack.uri] = cleanTrack

            if (track.linked_from?.uri) {
              cleanTrack.linkedFromUri = track.linked_from.uri
              state.trackMap[track.linked_from.uri] = cleanTrack
            }
          }

          if (track?.album?.uri) {
            const cleanAlbum: Album = {
              uri: track.album.uri,
              name: track.album.name
            }

            state.albumMap[cleanAlbum.uri] = cleanAlbum

            const albumArtUrl = (
              track.album.images.find((image) => image.width === 300) ?? track.album.images.at(-1)
            )?.url

            if (albumArtUrl) {
              state.imageUriUrlMap[track.album.uri] = albumArtUrl
            }
          }
        }
      })
    )
  })

  ipcMain.on('spotify-player-state', (_event, player_state) => {
    if (!player_state) {
      return
    }
    applicationStore.setState(
      produce<ApplicationState>((state) => {
        state.lastUpdatedAt = parseInt(player_state.timestamp) || 0
        state.isPlaying = !player_state.is_paused
        state.positionMs = parseInt(player_state.position_as_of_timestamp) || 0
        state.currentTrackUri = player_state.track?.uri || undefined
        if (
          player_state.track?.uri &&
          player_state.track?.metadata?.image_url?.includes('spotify:image:')
        ) {
          state.imageUriUrlMap[player_state.track.uri] =
            player_state.track.metadata.image_url.replace(
              'spotify:image:',
              'https://i.scdn.co/image/'
            )
        }
      })
    )
  })

  app.on('window-all-closed', () => {
    app.quit()
  })
})
