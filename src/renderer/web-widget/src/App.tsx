import { useRemoteApplicationStore } from "./useReadApplicationState"

export const App = () => {
  const state = useRemoteApplicationStore()

  if(!state?.isPlaying) {
    return null
  }

  return <div className="wrapper">
    <img className="cover" src={state?.currentAlbum?.image_medium}/>
    <div className="text">
    <div className="trackName">{state?.currentTrack?.name}</div>
    <div className="artists">{state?.currentTrack?.artists.map((artist) => artist.name).join(', ')}</div>
    </div>
  </div>
}