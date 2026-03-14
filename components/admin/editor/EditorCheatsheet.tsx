'use client'

import { useState, useEffect } from 'react'

const STORAGE_KEY = 'editor-cheatsheet-dismissed'

const shortcuts = [
  { keys: 'Ctrl+B', desc: 'Bold text' },
  { keys: 'Ctrl+I', desc: 'Italic text' },
  { keys: 'Ctrl+E', desc: 'Inline code' },
  { keys: 'Ctrl+K', desc: 'Insert link (with selection) or AI edit' },
  { keys: 'Ctrl+Shift+M', desc: 'Open/close settings drawer' },
  { keys: 'Tab', desc: 'Indent (2 spaces)' },
]

const markdownTips = [
  { syntax: '## Heading', desc: 'Section heading (H2)' },
  { syntax: '### Subheading', desc: 'Subsection (H3)' },
  { syntax: '**bold**', desc: 'Bold text' },
  { syntax: '*italic*', desc: 'Italic text' },
  { syntax: '`code`', desc: 'Inline code' },
  { syntax: '```lang', desc: 'Code block (js, ts, go, py...)' },
  { syntax: '> quote', desc: 'Blockquote' },
  { syntax: '- item', desc: 'Bullet list' },
  { syntax: '1. item', desc: 'Numbered list' },
  { syntax: '![alt](url)', desc: 'Image' },
  { syntax: '[text](url)', desc: 'Link' },
  { syntax: '---', desc: 'Horizontal divider' },
]

const features = [
  { icon: '/', desc: 'Type / on a new line for quick commands (headings, images, code, AI)' },
  { icon: '✦', desc: 'Select text to see the floating toolbar with formatting + AI' },
  { icon: '🦀', desc: 'Ask Claw\'d anything in the sidebar — writing tips, rewrites, SEO' },
  { icon: '📋', desc: 'Paste or drag images directly into the editor' },
  { icon: '💾', desc: 'Your work auto-saves — no need to manually save' },
]

export default function EditorCheatsheet() {
  const [visible, setVisible] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(STORAGE_KEY)
      if (!dismissed) setShowOnboarding(true)
    } catch { /* ignore */ }
  }, [])

  const dismissOnboarding = () => {
    setShowOnboarding(false)
    try { localStorage.setItem(STORAGE_KEY, 'true') } catch { /* ignore */ }
  }

  return (
    <>
      {/* First-time onboarding banner */}
      {showOnboarding && (
        <div className="pe2-onboarding">
          <div className="pe2-onboarding-content">
            <div className="pe2-onboarding-icon">✨</div>
            <div className="pe2-onboarding-text">
              <strong>Welcome to the new editor!</strong>
              <span>Type <kbd>/</kbd> for commands, select text for toolbar, press <kbd>Ctrl+Shift+M</kbd> for settings, or click <kbd>?</kbd> anytime for help.</span>
            </div>
          </div>
          <button type="button" onClick={dismissOnboarding} className="pe2-onboarding-dismiss">Got it</button>
        </div>
      )}

      {/* Help button (always visible) */}
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        className="pe2-help-btn"
        title="Editor shortcuts & tips"
        aria-label="Editor help"
      >
        ?
      </button>

      {/* Cheatsheet panel */}
      {visible && (
        <>
          <div className="pe2-cheatsheet-overlay" onClick={() => setVisible(false)} />
          <div className="pe2-cheatsheet">
            <div className="pe2-cheatsheet-header">
              <span className="pe2-cheatsheet-title">Editor Cheatsheet</span>
              <button type="button" onClick={() => setVisible(false)} className="pe2-cheatsheet-close">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="pe2-cheatsheet-body">
              {/* Features */}
              <div className="pe2-cheatsheet-section">
                <span className="pe2-cheatsheet-label">Features</span>
                <div className="pe2-cheatsheet-features">
                  {features.map((f, i) => (
                    <div key={i} className="pe2-cheatsheet-feature">
                      <span className="pe2-cheatsheet-feature-icon">{f.icon}</span>
                      <span className="pe2-cheatsheet-feature-desc">{f.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Keyboard shortcuts */}
              <div className="pe2-cheatsheet-section">
                <span className="pe2-cheatsheet-label">Keyboard Shortcuts</span>
                <div className="pe2-cheatsheet-grid">
                  {shortcuts.map((s, i) => (
                    <div key={i} className="pe2-cheatsheet-row">
                      <kbd className="pe2-cheatsheet-kbd">{s.keys}</kbd>
                      <span className="pe2-cheatsheet-desc">{s.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Markdown syntax */}
              <div className="pe2-cheatsheet-section">
                <span className="pe2-cheatsheet-label">Markdown Syntax</span>
                <div className="pe2-cheatsheet-grid">
                  {markdownTips.map((t, i) => (
                    <div key={i} className="pe2-cheatsheet-row">
                      <code className="pe2-cheatsheet-code">{t.syntax}</code>
                      <span className="pe2-cheatsheet-desc">{t.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
