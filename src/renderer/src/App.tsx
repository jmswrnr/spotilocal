import { useEffect } from 'react'
import useMeasure from 'react-use-measure'
import { useRemoteApplicationStore } from './useReadApplicationState'

export const App = () => {
  const [ref, bounds] = useMeasure()
  const { isUpdateAvailable, isLoggedIn } = useRemoteApplicationStore((state) => ({
    isUpdateAvailable: state?.isUpdateAvailable,
    isLoggedIn: state?.isLoggedIn
  }))

  useEffect(() => {
    window.electron.ipcRenderer.send('resize-window', bounds.width, bounds.height)
  }, [bounds.width, bounds.height])

  return (
    <div className="settings" ref={ref}>
      <div className="section-title">Spotilocal v{__VERSION__}</div>
      <div className="section-area">
        {isUpdateAvailable ? (
          <button className="button" onClick={() => window.electron.ipcRenderer.send('get-update')}>
            Update available!
          </button>
        ) : (
          <button className="button" disabled>
            Up to date!
          </button>
        )}
        <div className="hr" />
        {isLoggedIn ? (
          <button className="button" onClick={() => window.electron.ipcRenderer.send('logout')}>
            Logout
          </button>
        ) : (
          <button className="button" onClick={() => window.electron.ipcRenderer.send('login')}>
            Login
          </button>
        )}
        <div className="hr" />
        <button className="button" onClick={() => window.electron.ipcRenderer.send('quit')}>
          Exit
        </button>
      </div>
    </div>
  )
}
