import { defineWorkspace } from 'vitest/config'
import { define, shared } from './electron.vite.config'

export default defineWorkspace([
  {
    ...shared,
    define,
    test: {
      root: './src/main'
    }
  },
  {
    ...shared,
    define,
    test: {
      root: './src/preload',
      environment: 'jsdom',
      globals: true
    }
  },
  {
    ...shared,
    define,
    test: {
      root: './src/renderer',
      environment: 'jsdom',
      globals: true
    }
  },
  {
    ...shared,
    define,
    test: {
      root: './src/shared'
    }
  }
])
