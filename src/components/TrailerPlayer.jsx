import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { Volume2, VolumeX, Pause, Play, Maximize, Minimize } from 'lucide-react'
import { loadYouTubeApi } from '../utils/youtubeApi.js'
import styles from './TrailerPlayer.module.css'

const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// Muted autoplaying YouTube trailer with our own controls. The poster stays visible underneath,
// so if the video can't load, the UI simply keeps showing the poster.
// Changing `youtubeId` swaps the video inside the same player (no flash).
const TrailerPlayer = forwardRef(function TrailerPlayer(
  { youtubeId, poster, title, cover = false, paused = false, onFail, controlsClassName = '' },
  ref
) {
  const boxRef = useRef(null)
  const wrapRef = useRef(null)
  const playerRef = useRef(null)
  const readyRef = useRef(false)
  const idRef = useRef(youtubeId)
  const onFailRef = useRef(onFail)
  onFailRef.current = onFail

  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(true)
  const [userPaused, setUserPaused] = useState(prefersReducedMotion) // reduced motion: no autoplay
  const [failed, setFailed] = useState(false)
  const [full, setFull] = useState(false)
  const [posterBroken, setPosterBroken] = useState(false)

  const userPausedRef = useRef(userPaused)
  userPausedRef.current = userPaused
  const pausedRef = useRef(paused)
  pausedRef.current = paused

  // Create the player once
  useEffect(() => {
    let destroyed = false
    let player = null
    const initialId = idRef.current

    loadYouTubeApi()
      .then((YT) => {
        if (destroyed || !wrapRef.current) return
        const el = document.createElement('div')
        wrapRef.current.appendChild(el)
        player = new YT.Player(el, {
          videoId: initialId,
          host: 'https://www.youtube-nocookie.com',
          playerVars: {
            autoplay: userPausedRef.current || pausedRef.current ? 0 : 1,
            mute: 1,
            controls: 0,
            disablekb: 1,
            fs: 0,
            iv_load_policy: 3,
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: (e) => {
              if (destroyed) return
              readyRef.current = true
              e.target.mute()
              if (idRef.current !== initialId) {
                // the title changed while the player was starting up
                if (userPausedRef.current || pausedRef.current) e.target.cueVideoById(idRef.current)
                else e.target.loadVideoById(idRef.current)
              } else if (!userPausedRef.current && !pausedRef.current) {
                e.target.playVideo()
              }
            },
            onStateChange: (e) => {
              if (destroyed) return
              const S = window.YT.PlayerState
              if (e.data === S.PLAYING) setPlaying(true)
              else if (e.data === S.PAUSED) setPlaying(false)
              else if (e.data === S.ENDED) {
                e.target.seekTo(0, true)
                e.target.playVideo()
              }
            },
            // removed, private, or embedding not allowed
            onError: () => {
              if (destroyed) return
              setFailed(true)
              onFailRef.current?.()
            },
          },
        })
        playerRef.current = player
      })
      .catch(() => {
        if (destroyed) return
        setFailed(true)
        onFailRef.current?.()
      })

    return () => {
      destroyed = true
      readyRef.current = false
      try {
        player?.destroy()
      } catch {
        // ignore
      }
      playerRef.current = null
      if (wrapRef.current) wrapRef.current.innerHTML = ''
    }
  }, [])

  // A different trailer was requested: swap it inside the same player
  useEffect(() => {
    if (idRef.current === youtubeId) return
    idRef.current = youtubeId
    setPlaying(false)
    setFailed(false)
    setMuted(true)
    const p = playerRef.current
    if (p && readyRef.current && youtubeId) {
      p.mute()
      if (userPausedRef.current || pausedRef.current) p.cueVideoById(youtubeId)
      else p.loadVideoById(youtubeId)
    }
  }, [youtubeId])

  // Pause while off-screen / another preview is open
  useEffect(() => {
    const p = playerRef.current
    if (!p || !readyRef.current) return
    if (paused) p.pauseVideo()
    else if (!userPausedRef.current) p.playVideo()
  }, [paused])

  useEffect(() => {
    const onChange = () => setFull(document.fullscreenElement === boxRef.current)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  function toggleMute() {
    const p = playerRef.current
    if (!p || !readyRef.current) return
    if (muted) {
      p.unMute()
      p.setVolume(100)
      setMuted(false)
    } else {
      p.mute()
      setMuted(true)
    }
  }

  function togglePlay() {
    const p = playerRef.current
    if (!p || !readyRef.current) return
    if (userPaused) {
      setUserPaused(false)
      p.playVideo()
    } else {
      setUserPaused(true)
      p.pauseVideo()
    }
  }

  function toggleFullscreen() {
    const el = boxRef.current
    if (!el) return
    if (document.fullscreenElement) document.exitFullscreen?.()
    else (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el)
  }

  // Used by "Watch trailer" buttons: restart with sound (needs a user click)
  useImperativeHandle(ref, () => ({
    playWithSound() {
      const p = playerRef.current
      if (!p || !readyRef.current) return
      p.seekTo(0, true)
      p.unMute()
      p.setVolume(100)
      p.playVideo()
      setMuted(false)
      setUserPaused(false)
    },
  }))

  const canFullscreen = Boolean(document.fullscreenEnabled || document.webkitFullscreenEnabled)

  return (
    <div ref={boxRef} className={`${styles.box} ${cover ? styles.cover : ''} ${full ? styles.full : ''}`}>
      {poster && !posterBroken && (
        <img className={styles.poster} src={poster} alt="" onError={() => setPosterBroken(true)} />
      )}
      {!failed && <div ref={wrapRef} className={`${styles.video} ${playing ? styles.show : ''}`} aria-hidden="true" />}
      {failed && !cover && <span className={styles.unavailable}>Trailer unavailable</span>}

      {!failed && (
        <div className={`${styles.controls} ${controlsClassName}`} role="group" aria-label={`Trailer controls for ${title}`}>
          <button onClick={togglePlay} aria-label={userPaused ? 'Play trailer' : 'Pause trailer'}>
            {userPaused ? <Play size={18} fill="currentColor" /> : <Pause size={18} fill="currentColor" />}
          </button>
          <button onClick={toggleMute} aria-label={muted ? 'Turn sound on' : 'Mute trailer'} aria-pressed={!muted}>
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          {canFullscreen && (
            <button onClick={toggleFullscreen} aria-label={full ? 'Exit full screen' : 'Full screen'}>
              {full ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>
          )}
        </div>
      )}
    </div>
  )
})

export default TrailerPlayer
