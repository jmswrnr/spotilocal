import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'

import { version } from './package.json'

const __PLAYER_HOSTNAME__ = 'open.spotify.com'
const __PLAYER_URL__ = `https://${__PLAYER_HOSTNAME__}/`
const __LOGIN_URL__ = `https://accounts.spotify.com/login?continue=${encodeURIComponent(
  __PLAYER_URL__
)}`
const __WEBSOCKET_HOSTNAME_PARTIAL__ = 'dealer.*\\.spotify\\.com'

export const define = {
  __VERSION__: JSON.stringify(version),
  __PLAYER_HOSTNAME__: JSON.stringify(__PLAYER_HOSTNAME__),
  __PLAYER_URL__: JSON.stringify(__PLAYER_URL__),
  __LOGIN_URL__: JSON.stringify(__LOGIN_URL__),
  __WEBSOCKET_HOSTNAME_PARTIAL__: JSON.stringify(__WEBSOCKET_HOSTNAME_PARTIAL__)
}

export const shared = {
  resolve: {
    alias: {
      '@shared': resolve('src/shared')
    }
  }
}

export default defineConfig({
  main: {
    ...shared,
    define,
  },
  preload: {
    ...shared,
    define,
    build: {
      // @ts-ignore
      rollupOptions: {
        input: {
          spotify: resolve(__dirname, 'src/preload/spotify/index.ts'),
          settings: resolve(__dirname, 'src/preload/settings/index.ts')
        }
      },
      isolatedEntries: true
    }
  },
  renderer: {
    ...shared,
    define,
    build: {
      // @ts-ignore
      minify: 'esbuild',
      rollupOptions: {
        input: {
          preferences: resolve(__dirname, 'src/renderer/preferences/index.html'),
          'web-widget': resolve(__dirname, 'src/renderer/web-widget/index.html')
        }
      },
      isolatedEntries: true
    },
    plugins: [react()]
  }
})
