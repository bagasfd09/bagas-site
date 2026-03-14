'use client'

import { useMemo } from 'react'

interface EditorStatusBarProps {
  content: string
  saveStatus: 'saved' | 'saving' | 'unsaved' | 'error'
  lastSavedAt: Date | null
  cursorLine?: number
  cursorCol?: number
  onHelpClick?: () => void
}

export default function EditorStatusBar({ content, saveStatus, lastSavedAt, cursorLine, cursorCol, onHelpClick }: EditorStatusBarProps) {
  const wordCount = useMemo(() => {
    return content.replace(/[#*`\[\]()>-]/g, ' ').split(/\s+/).filter(Boolean).length
  }, [content])

  const readTime = useMemo(() => {
    return Math.max(1, Math.ceil(wordCount / 220))
  }, [wordCount])

  const saveLabel = useMemo(() => {
    if (saveStatus === 'saving') return 'Saving...'
    if (saveStatus === 'error') return 'Save failed'
    if (saveStatus === 'unsaved') return 'Unsaved changes'
    if (!lastSavedAt) return 'Saved'
    const seconds = Math.round((Date.now() - lastSavedAt.getTime()) / 1000)
    if (seconds < 5) return 'Saved just now'
    if (seconds < 60) return `Saved ${seconds}s ago`
    return `Saved ${Math.round(seconds / 60)}m ago`
  }, [saveStatus, lastSavedAt])

  const statusDotColor = saveStatus === 'saved' ? '#4caf50' : saveStatus === 'saving' ? '#f9a825' : saveStatus === 'error' ? '#e53935' : '#f9a825'

  return (
    <div className="pe2-status-bar">
      <div className="pe2-status-left">
        <span className="pe2-status-item">{wordCount} words</span>
        <span className="pe2-status-item">{readTime} min read</span>
      </div>
      <div className="pe2-status-center">
        <div className="pe2-save-indicator" style={{ '--dot-color': statusDotColor } as React.CSSProperties}>
          <span className="pe2-save-dot" />
          <span className="pe2-save-label">{saveLabel}</span>
        </div>
      </div>
      <div className="pe2-status-right">
        {cursorLine != null && cursorCol != null && (
          <span className="pe2-status-item">Ln {cursorLine}, Col {cursorCol}</span>
        )}
        <span className="pe2-status-item">Markdown</span>
        {onHelpClick && (
          <button type="button" onClick={onHelpClick} className="pe2-status-help" title="Editor shortcuts & tips">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
              <path d="M12 17h.01" />
            </svg>
            <span>Help</span>
          </button>
        )}
      </div>
    </div>
  )
}
