import { spotiTest } from '../test/custom-test'

import { beforeEach, describe, expect, vi } from 'vitest'

beforeEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
})

describe('Spotify System Clock Offset', () => {
  spotiTest('Set lastUpdatedAt', async () => {
    await import('./index')
    const { applicationStore } = await import('../state')
    let state = applicationStore.getState()
    expect(state.systemClockOffset).toStrictEqual(0)
    expect(state.lastUpdatedAt).toStrictEqual(undefined)
    expect(state.serverLastUpdatedAt).toStrictEqual(undefined)

    applicationStore.setState({
      serverLastUpdatedAt: 1123
    })
    state = applicationStore.getState()
    expect(state.lastUpdatedAt).toStrictEqual(1123)
    
    applicationStore.setState({
      systemClockOffset: -1000
    })
    state = applicationStore.getState()
    expect(state.lastUpdatedAt).toStrictEqual(123)
  })
})
