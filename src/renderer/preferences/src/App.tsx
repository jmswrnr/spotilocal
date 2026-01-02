import { ReactNode, useEffect, useLayoutEffect, useState } from 'react'
import useMeasure from 'react-use-measure'
import { useRemoteApplicationStore } from './useReadApplicationState'

const CopyButton = ({ children, copyText }: { children: ReactNode; copyText: string }) => {
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    if (copied) {
      setTimeout(() => {
        setCopied(false)
      }, 2000)
    }
  }, [copied])
  return (
    <button
      className={'item' + (copied ? ' copied' : '')}
      onClick={() => {
        setCopied(true)
        navigator.clipboard.writeText(copyText)
      }}
    >
      <div className="icon"></div>
      <div className="text"> {copied ? 'Copied' : children}</div>
    </button>
  )
}

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
    image,
    enableWebWidget,
    webWidgetPort,
    webWidgetPortError,
    enableHistory,
    isDevMode,
    dev_showSpotifyPlayer,
  } = useRemoteApplicationStore((state) => ({
    isUpdateAvailable: state?.isUpdateAvailable,
    isLoggedIn: state?.isLoggedIn,
    emptyFilesWhenPaused: state?.userSettings.emptyFilesWhenPaused,
    saveJsonFile: state?.userSettings.saveJsonFile,
    saveSmallImage: state?.userSettings.saveSmallImage,
    saveMediumImage: state?.userSettings.saveMediumImage,
    saveLargeImage: state?.userSettings.saveLargeImage,
    image: state?.currentAlbum?.image_small,
    enableWebWidget: state?.userSettings.enableWebWidget,
    webWidgetPort: state?.userSettings.webWidgetPort,
    webWidgetPortError: state?.webWidgetPortError,
    enableHistory: state?.userSettings.enableHistory,
    isDevMode: state?.isDevMode,
    dev_showSpotifyPlayer: state?.userSettings.dev_showSpotifyPlayer,
  }))

  useLayoutEffect(() => {
    window.resizeTo(Math.ceil(bounds.width), Math.ceil(bounds.height))
  }, [bounds.width, bounds.height])

  return (
    <div className="settings" ref={ref}>
      <div className="section-title">Spotilocal v{__VERSION__}</div>
      <div className="section-area">
        {image ? <img src={image} draggable={false} className="background-image" /> : null}
        <div className="label">
          <div className="icon">{image ? <img src={image} draggable={false} /> : null}</div>
          <div className="text">Save Cover Art:</div>
        </div>
        <div className="hr" />
        <button
          className="item"
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
          <div className="text">Small image</div>
          <div className="right">64px</div>
        </button>
        <div className="hr" />
        <button
          className="item"
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
          <div className="text">Medium image</div>
          <div className="right">300px</div>
        </button>
        <div className="hr" />
        <button
          className="item"
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
          <div className="text">Large image</div>
          <div className="right">640px</div>
        </button>
      </div>
      <div className="section-area">
        <button
          className="item"
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
          className="item"
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
        <div className="hr" />
        <button
          className="item"
          onClick={() =>
            window.electron.ipcRenderer.send('set-user-settings', {
              enableHistory: !enableHistory
            })
          }
        >
          <div className="icon">
            {typeof enableHistory !== 'undefined' ? (
              <input type="checkbox" checked={enableHistory} readOnly />
            ) : null}
          </div>
          <div className="text"> Save track history</div>
        </button>
      </div>
      <div className="section-area">
        <button
          className="item"
          onClick={() =>
            window.electron.ipcRenderer.send('set-user-settings', {
              enableWebWidget: !enableWebWidget
            })
          }
        >
          <div className="icon">
            {typeof enableWebWidget !== 'undefined' ? (
              <input type="checkbox" checked={enableWebWidget} readOnly />
            ) : null}
          </div>
          <div className="text"> Enable web widget</div>
        </button>
        {enableWebWidget ? (
          <>
            <div className="hr" />
            <div className={'item' + (webWidgetPortError ? ' error' : '')}>
              <div className="icon">{webWidgetPortError ? '⚠️' : ''}</div>
              <div className="text"> Port number</div>
              <div className="right">
                <input
                  type="number"
                  value={webWidgetPort && webWidgetPort > 0 ? webWidgetPort : ''}
                  style={{
                    width: '4rem'
                  }}
                  onChange={(e) => {
                    const value = Number(e.target.value)
                    if (isNaN(value) || value > 65535) {
                      return
                    }
                    window.electron.ipcRenderer.send('set-user-settings', {
                      webWidgetPort: value
                    })
                  }}
                />
              </div>
            </div>
            <div className="hr" />
            <CopyButton copyText={`http://localhost:${webWidgetPort}/web-widget/`}>
              Copy URL
            </CopyButton>
          </>
        ) : null}
      </div>
      {isDevMode ? (
        <div className="section-area">
          <button className="item" disabled>
            <div className="icon"></div>
            <div className="text">Dev Tools</div>
          </button>
          
        <button
          className="item"
          onClick={() =>
            window.electron.ipcRenderer.send('set-user-settings', {
              dev_showSpotifyPlayer: !dev_showSpotifyPlayer
            })
          }
        >
          <div className="icon">
            <input type="checkbox" checked={dev_showSpotifyPlayer ?? false} readOnly />
          </div>
          <div className="text"> Show Spotify Player</div>
        </button>
        </div>
      ) : null}
      <div className="section-area">
        {isUpdateAvailable ? (
          <button className="item" onClick={() => window.electron.ipcRenderer.send('get-update')}>
            <div className="icon"></div>
            <div className="text">Update available!</div>
          </button>
        ) : (
          <button className="item" disabled>
            <div className="icon"></div>
            <div className="text">Up to date!</div>
          </button>
        )}
        <div className="hr" />
        {isLoggedIn ? (
          <button className="item" onClick={() => window.electron.ipcRenderer.send('logout')}>
            <div className="icon"></div>
            <div className="text">Logout</div>
          </button>
        ) : (
          <button className="item" onClick={() => window.electron.ipcRenderer.send('login')}>
            <div className="icon"></div>
            <div className="text">Login</div>
          </button>
        )}
        <div className="hr" />
        <button className="item" onClick={() => window.electron.ipcRenderer.send('quit')}>
          <div className="icon"></div>
          <div className="text">Exit</div>
        </button>
      </div>
    </div>
  )
}
