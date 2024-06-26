import { useEffect } from 'react'
import useMeasure from 'react-use-measure'

export const App = () => {
  const [ref, bounds] = useMeasure()

  useEffect(() => {
    window.electron.ipcRenderer.send('resize-window', bounds.width, bounds.height)
  }, [bounds.width, bounds.height])

  return (
    <div className="settings" ref={ref}>
      <div className="section-title">Spotilocal v{__VERSION__}</div>
      <div className="section-area">
        <button className="button" onClick={() => window.electron.ipcRenderer.send('get-update')}>
          Update
        </button>
        <div className="hr" />
        <button className="button" onClick={() => window.electron.ipcRenderer.send('logout')}>
          Logout
        </button>
        <div className="hr" />
        <button className="button" onClick={() => window.electron.ipcRenderer.send('quit')}>
          Exit
        </button>
      </div>
    </div>
  )
}
