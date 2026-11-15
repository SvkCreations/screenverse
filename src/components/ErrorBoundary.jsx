import { Component } from 'react'

// React only supports error boundaries as classes; this is the one exception in the app.
export default class ErrorBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error) {
    console.error('UI error:', error)
  }

  render() {
    if (this.state.failed) {
      return (
        <div style={{ padding: '120px 24px', textAlign: 'center' }}>
          <h2 style={{ color: 'var(--gold)', marginBottom: 12 }}>Something went wrong</h2>
          <button onClick={() => window.location.reload()} style={{ padding: '10px 18px' }}>
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
