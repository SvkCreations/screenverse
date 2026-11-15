let loading = null

// Loads the YouTube IFrame Player API once. Rejects if it is blocked (ad blocker, offline...).
export function loadYouTubeApi() {
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT)
  if (loading) return loading

  loading = new Promise((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady
    const fail = () => {
      loading = null
      clearTimeout(timer)
      reject(new Error('The YouTube player could not be loaded.'))
    }
    const timer = setTimeout(fail, 10000)

    window.onYouTubeIframeAPIReady = () => {
      clearTimeout(timer)
      if (typeof previous === 'function') previous()
      resolve(window.YT)
    }

    const script = document.createElement('script')
    script.src = 'https://www.youtube.com/iframe_api'
    script.async = true
    script.onerror = fail
    document.head.appendChild(script)
  })
  return loading
}
