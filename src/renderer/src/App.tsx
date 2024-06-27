import { useLayoutEffect } from 'react'
import useMeasure from 'react-use-measure'
import { useRemoteApplicationStore } from './useReadApplicationState'

export const App = () => {
  const [ref, bounds] = useMeasure()
  const { isUpdateAvailable, isLoggedIn, emptyFilesWhenPaused } = useRemoteApplicationStore(
    (state) => ({
      isUpdateAvailable: state?.isUpdateAvailable,
      isLoggedIn: state?.isLoggedIn,
      emptyFilesWhenPaused: state?.userSettings.emptyFilesWhenPaused
    })
  )

  useLayoutEffect(() => {
    window.resizeTo(Math.ceil(bounds.width), Math.ceil(bounds.height))
  }, [bounds.width, bounds.height])

  return (
    <div className="settings" ref={ref}>
      <div className="section-title">Spotilocal v{__VERSION__}</div>
      <div className="section-area">
        <button
          className="button"
          onClick={() =>
            window.electron.ipcRenderer.send('set-user-settings', {
              emptyFilesWhenPaused: !emptyFilesWhenPaused
            })
          }
        >
          <div className="icon">
            {typeof emptyFilesWhenPaused !== 'undefined' ? (
              <input type="checkbox" checked={emptyFilesWhenPaused} readOnly />
            ) : null}
          </div>
          <div className="text"> Empty files when paused</div>
        </button>
      </div>
      <div className="section-area">
        {isUpdateAvailable ? (
          <button className="button" onClick={() => window.electron.ipcRenderer.send('get-update')}>
            <div className="icon"></div>
            <div className="text">Update available!</div>
          </button>
        ) : (
          <button className="button" disabled>
            <div className="icon"></div>
            <div className="text">Up to date!</div>
          </button>
        )}
        <div className="hr" />
        {isLoggedIn ? (
          <button className="button" onClick={() => window.electron.ipcRenderer.send('logout')}>
            <div className="icon"></div>
            <div className="text">Logout</div>
          </button>
        ) : (
          <button className="button" onClick={() => window.electron.ipcRenderer.send('login')}>
            <div className="icon"></div>
            <div className="text">Login</div>
          </button>
        )}
        <div className="hr" />
        <button className="button" onClick={() => window.electron.ipcRenderer.send('quit')}>
          <div className="icon"></div>
          <div className="text">Exit</div>
        </button>
      </div>
    </div>
  )
}
