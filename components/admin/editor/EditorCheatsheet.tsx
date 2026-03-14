'use client'

import { useState, useEffect } from 'react'

const STORAGE_KEY = 'editor-cheatsheet-dismissed'

const shortcuts = [
  { keys: 'Ctrl+B', desc: 'Bold text' },
  { keys: 'Ctrl+I', desc: 'Italic text' },
  { keys: 'Ctrl+E', desc: 'Inline code' },
  { keys: 'Ctrl+K', desc: 'Insert link / AI edit' },
  { keys: 'Ctrl+Shift+M', desc: 'Settings drawer' },
  { keys: 'Tab', desc: 'Indent (2 spaces)' },
]

// Markdown tips with JSX rendered preview
const markdownTips: { syntax: string; preview: React.ReactNode }[] = [
  {
    syntax: '## Heading',
    preview: <span style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: '16px', fontWeight: 700, color: '#2e2e2e' }}>Heading</span>,
  },
  {
    syntax: '### Subheading',
    preview: <span style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: '14px', fontWeight: 600, color: '#2e2e2e' }}>Subheading</span>,
  },
  {
    syntax: '**bold**',
    preview: <span style={{ fontWeight: 700, color: '#2e2e2e' }}>bold</span>,
  },
  {
    syntax: '*italic*',
    preview: <span style={{ fontStyle: 'italic', color: '#2e2e2e' }}>italic</span>,
  },
  {
    syntax: '~~strike~~',
    preview: <span style={{ textDecoration: 'line-through', color: '#999' }}>strike</span>,
  },
  {
    syntax: '`code`',
    preview: (
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', background: 'rgba(59,50,37,0.06)', padding: '1px 5px', borderRadius: '3px', color: '#b4762c' }}>code</span>
    ),
  },
  {
    syntax: '```js\ncode\n```',
    preview: (
      <div style={{ background: '#1e1e1e', borderRadius: '4px', padding: '6px 10px', fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: '#d4d4d4', lineHeight: 1.5 }}>
        <span style={{ color: '#569cd6' }}>const</span> x = <span style={{ color: '#ce9178' }}>&quot;hello&quot;</span>
      </div>
    ),
  },
  {
    syntax: '> quote',
    preview: (
      <div style={{ borderLeft: '3px solid #b4762c', paddingLeft: '8px', fontStyle: 'italic', color: '#756b5e', fontSize: '12px' }}>
        A wise quote here
      </div>
    ),
  },
  {
    syntax: '- item',
    preview: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '12px', color: '#2e2e2e' }}>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#2e2e2e', flexShrink: 0 }} />
          <span>First item</span>
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#2e2e2e', flexShrink: 0 }} />
          <span>Second item</span>
        </div>
      </div>
    ),
  },
  {
    syntax: '1. item',
    preview: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '12px', color: '#2e2e2e' }}>
        <div style={{ display: 'flex', gap: '6px' }}><span style={{ color: '#756b5e', minWidth: '14px' }}>1.</span><span>First step</span></div>
        <div style={{ display: 'flex', gap: '6px' }}><span style={{ color: '#756b5e', minWidth: '14px' }}>2.</span><span>Second step</span></div>
      </div>
    ),
  },
  {
    syntax: '[text](url)',
    preview: <span style={{ color: '#8b5a1b', textDecoration: 'underline', textUnderlineOffset: '2px', fontSize: '12px' }}>a link like this</span>,
  },
  {
    syntax: '![alt](url)',
    preview: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#756b5e' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b0a99e" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
        <span>Embedded image</span>
      </div>
    ),
  },
  {
    syntax: '---',
    preview: <div style={{ width: '100%', height: '1px', background: 'rgba(59,50,37,0.15)', margin: '4px 0' }} />,
  },
]

// Features with hover preview descriptions
const features: { icon: React.ReactNode; label: string; desc: string; preview: React.ReactNode }[] = [
  {
    icon: <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: '#b4762c', fontSize: '14px' }}>/</span>,
    label: 'Slash Commands',
    desc: 'Type / on a new line',
    preview: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '4px 8px', borderRadius: '6px', background: 'rgba(180,118,44,0.08)' }}>
          <span style={{ fontWeight: 700, fontSize: '12px', color: '#756b5e' }}>H2</span>
          <span style={{ fontSize: '11px', color: '#3b3225' }}>Heading</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '4px 8px', borderRadius: '6px' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#756b5e" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/></svg>
          <span style={{ fontSize: '11px', color: '#3b3225' }}>Image</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '4px 8px', borderRadius: '6px' }}>
          <span style={{ fontFamily: "'JetBrains Mono'", fontSize: '10px', color: '#756b5e' }}>{'{}'}</span>
          <span style={{ fontSize: '11px', color: '#3b3225' }}>Code Block</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '4px 8px', borderRadius: '6px' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#b4762c" strokeWidth="1.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/></svg>
          <span style={{ fontSize: '11px', color: '#b4762c' }}>Ask AI</span>
        </div>
      </div>
    ),
  },
  {
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b4762c" strokeWidth="1.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
    ),
    label: 'Floating Toolbar',
    desc: 'Select text to format',
    preview: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px', background: '#2e2e2e', borderRadius: '6px', padding: '4px 6px', width: 'fit-content' }}>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: '11px', padding: '2px 5px' }}>B</span>
        <span style={{ color: '#fff', fontStyle: 'italic', fontSize: '11px', padding: '2px 5px' }}>I</span>
        <span style={{ color: '#fff', fontSize: '10px', fontWeight: 600, padding: '2px 5px' }}>H2</span>
        <span style={{ width: '1px', height: '12px', background: 'rgba(255,255,255,0.2)' }} />
        <span style={{ color: '#fff', fontSize: '10px', padding: '2px 5px' }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/></svg>
        </span>
        <span style={{ background: 'rgba(180,118,44,0.8)', borderRadius: '3px', padding: '2px 6px', color: '#fff', fontSize: '9px', fontWeight: 600 }}>AI</span>
      </div>
    ),
  },
  {
    icon: <span style={{ fontSize: '14px' }}>🦀</span>,
    label: "Claw'd AI",
    desc: 'Chat sidebar for writing help',
    preview: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ background: '#fdf6e3', borderRadius: '8px', borderTopLeftRadius: '3px', padding: '6px 10px', fontSize: '11px', color: '#3b3225', maxWidth: '180px' }}>
          Try making the intro more engaging with a hook!
        </div>
        <div style={{ borderLeft: '2px solid #b4762c', borderRadius: '0 6px 6px 0', padding: '4px 8px', background: '#fff', fontSize: '10px' }}>
          <div style={{ color: '#b4762c', fontWeight: 600, fontSize: '9px', marginBottom: '2px' }}>SUGGESTED</div>
          <div style={{ color: '#3b3225' }}>Ever wondered why...</div>
        </div>
      </div>
    ),
  },
  {
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b4762c" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
    ),
    label: 'Image Upload',
    desc: 'Paste, drag, or use / command',
    preview: (
      <div style={{ border: '2px dashed rgba(59,50,37,0.15)', borderRadius: '6px', padding: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b0a99e" strokeWidth="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
        <span style={{ fontSize: '10px', color: '#b0a99e' }}>Drop image here</span>
      </div>
    ),
  },
  {
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b4762c" strokeWidth="1.5"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/></svg>
    ),
    label: 'Auto-save',
    desc: 'Saves automatically as you type',
    preview: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', background: '#faf9f7', borderRadius: '6px', width: 'fit-content' }}>
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4caf50' }} />
        <span style={{ fontSize: '11px', color: '#999' }}>Saved 2s ago</span>
      </div>
    ),
  },
]

interface EditorCheatsheetProps {
  open: boolean
  onClose: () => void
}

export default function EditorCheatsheet({ open, onClose }: EditorCheatsheetProps) {
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null)

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
              <span>Type <kbd>/</kbd> for commands, select text for toolbar, press <kbd>Ctrl+Shift+M</kbd> for settings, or click <strong>Help</strong> in the status bar for tips.</span>
            </div>
          </div>
          <button type="button" onClick={dismissOnboarding} className="pe2-onboarding-dismiss">Got it</button>
        </div>
      )}

      {/* Cheatsheet panel */}
      {open && (
        <>
          <div className="pe2-cheatsheet-overlay" onClick={onClose} />
          <div className="pe2-cheatsheet">
            <div className="pe2-cheatsheet-header">
              <span className="pe2-cheatsheet-title">Editor Cheatsheet</span>
              <button type="button" onClick={onClose} className="pe2-cheatsheet-close">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="pe2-cheatsheet-body">
              {/* Features — Option B: hover to preview */}
              <div className="pe2-cheatsheet-section">
                <span className="pe2-cheatsheet-label">Features</span>
                <div className="pe2-cs-features">
                  {features.map((f, i) => (
                    <div
                      key={i}
                      className="pe2-cs-feature-row"
                      onMouseEnter={() => setHoveredFeature(i)}
                      onMouseLeave={() => setHoveredFeature(null)}
                    >
                      <div className="pe2-cs-feature-icon">{f.icon}</div>
                      <div className="pe2-cs-feature-text">
                        <span className="pe2-cs-feature-label">{f.label}</span>
                        <span className="pe2-cs-feature-desc">{f.desc}</span>
                      </div>
                      {/* Hover preview tooltip */}
                      {hoveredFeature === i && (
                        <div className="pe2-cs-feature-preview">
                          {f.preview}
                        </div>
                      )}
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

              {/* Markdown syntax — Option C: split view with live preview */}
              <div className="pe2-cheatsheet-section">
                <span className="pe2-cheatsheet-label">Markdown Syntax</span>
                <div className="pe2-cs-md-grid">
                  {markdownTips.map((t, i) => (
                    <div key={i} className="pe2-cs-md-row">
                      <code className="pe2-cs-md-syntax">{t.syntax}</code>
                      <div className="pe2-cs-md-arrow">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#b0a99e" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                      </div>
                      <div className="pe2-cs-md-preview">{t.preview}</div>
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
