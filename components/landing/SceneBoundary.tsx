'use client'

import { Component, type ReactNode } from 'react'

/**
 * Catches anything the 3D layer throws — most often "Error creating WebGL
 * context" on a machine whose graphics driver is blocked, which browsers
 * report only when a context is actually requested — and falls back to the
 * still poster instead of taking the whole page down with it.
 */
export default class SceneBoundary extends Component<{ onFail: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch() {
    this.props.onFail()
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}
