import { useLayoutEffect } from 'react'
import useMeasure from 'react-use-measure'
import { useRemoteApplicationStore } from './useReadApplicationState'

export const App = () => {
  const [ref, bounds] = useMeasure()
  const {
    isUpdateAvailable,
    isLoggedIn,
    emptyFilesWhenPaused,
    saveJsonFile,
    saveSmallImage,
    saveMediumImage,
    saveLargeImage,
    image
  } = useRemoteApplicationStore((state) => ({
    isUpdateAvailable: state?.isUpdateAvailable,
    isLoggedIn: state?.isLoggedIn,
    emptyFilesWhenPaused: state?.userSettings.emptyFilesWhenPaused,
    saveJsonFile: state?.userSettings.saveJsonFile,
    saveSmallImage: state?.userSettings.saveSmallImage,
    saveMediumImage: state?.userSettings.saveMediumImage,
    saveLargeImage: state?.userSettings.saveLargeImage,
    image: state?.currentAlbum?.image_small
  }))

  useLayoutEffect(() => {
    window.resizeTo(Math.ceil(bounds.width), Math.ceil(bounds.height))
  }, [bounds.width, bounds.height])

  return (
    <div className="settings" ref={ref}>
      <div className="section-title">Spotilocal v{__VERSION__}</div>
      <div className="section-area">
        <img src={image} draggable={false} className='background-image' />
        <div className="label">
          <div className="icon">
            <img src={image} draggable={false} />
          </div>
          <div className="text">Save Cover Art:</div>
        </div>
        <div className="hr" />
        <button
          className="button"
          onClick={() =>
            window.electron.ipcRenderer.send('set-user-settings', {
              saveSmallImage: !saveSmallImage
            })
          }
        >
          <div className="icon">
            {typeof saveSmallImage !== 'undefined' ? (
              <input type="checkbox" checked={saveSmallImage} readOnly />
            ) : null}
          </div>
          <div className="text">Small Image</div>
          <div className="right">64px</div>
        </button>
        <div className="hr" />
        <button
          className="button"
          onClick={() =>
            window.electron.ipcRenderer.send('set-user-settings', {
              saveMediumImage: !saveMediumImage
            })
          }
        >
          <div className="icon">
            {typeof saveMediumImage !== 'undefined' ? (
              <input type="checkbox" checked={saveMediumImage} readOnly />
            ) : null}
          </div>
          <div className="text">Medium Image</div>
          <div className="right">300px</div>
        </button>
        <div className="hr" />
        <button
          className="button"
          onClick={() =>
            window.electron.ipcRenderer.send('set-user-settings', {
              saveLargeImage: !saveLargeImage
            })
          }
        >
          <div className="icon">
            {typeof saveLargeImage !== 'undefined' ? (
              <input type="checkbox" checked={saveLargeImage} readOnly />
            ) : null}
          </div>
          <div className="text">Large Image</div>
          <div className="right">640px</div>
        </button>
      </div>
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
          <div className="text"> Empty content files when paused</div>
        </button>
      </div>
      <div className="section-area">
        <button
          className="button"
          onClick={() =>
            window.electron.ipcRenderer.send('set-user-settings', {
              saveJsonFile: !saveJsonFile
            })
          }
        >
          <div className="icon">
            {typeof saveJsonFile !== 'undefined' ? (
              <input type="checkbox" checked={saveJsonFile} readOnly />
            ) : null}
          </div>
          <div className="text"> Save JSON state file</div>
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
