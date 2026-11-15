import { useState } from 'react'
import GuidedDiscovery from '../components/GuidedDiscovery.jsx'
import AIChat from '../components/AIChat.jsx'
import styles from './AICinema.module.css'

export default function AICinema() {
  const [tab, setTab] = useState('guided')

  return (
    <main className={styles.page}>
      <header className={styles.head}>
        <span className={styles.kicker}>Powered by Gemini</span>
        <h1>AI CINEMA <span>— Find Your Next Story</span></h1>
        <p>Tell us your mood, taste and genre, or just ask. Every recommendation is verified against a real movie database.</p>
      </header>

      <div className={styles.tabs} role="tablist">
        <button role="tab" aria-selected={tab === 'guided'} className={tab === 'guided' ? styles.on : ''} onClick={() => setTab('guided')}>
          Mood &amp; taste
        </button>
        <button role="tab" aria-selected={tab === 'chat'} className={tab === 'chat' ? styles.on : ''} onClick={() => setTab('chat')}>
          Ask in your own words
        </button>
      </div>

      <div className={styles.panel}>
        {tab === 'guided' ? <GuidedDiscovery /> : <AIChat />}
      </div>
    </main>
  )
}
