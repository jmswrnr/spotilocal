import { shallow } from 'zustand/shallow'
import { applicationStore } from '../state'

applicationStore.subscribe(
  (state) => ({
    systemClockOffset: state.systemClockOffset,
    serverLastUpdatedAt: state.serverLastUpdatedAt
  }),
  (slice) => {
    if (!slice.serverLastUpdatedAt) {
      return
    }
    applicationStore.setState({
      lastUpdatedAt: slice.serverLastUpdatedAt + slice.systemClockOffset
    })
  },
  {
    equalityFn: shallow
  }
)
