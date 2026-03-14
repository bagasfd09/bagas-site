'use client'

import { useState, useEffect, useRef, useMemo } from 'react'

interface SlashCommand {
  id: string
  label: string
  description: string
  icon: React.ReactNode
  category: 'blocks' | 'ai'
  action: string // markdown to insert or special action id
}

interface SlashCommandMenuProps {
  query: string // text after '/'
  position: { top: number; left: number }
  onSelect: (command: SlashCommand) => void
  onClose: () => void
}

const COMMANDS: SlashCommand[] = [
  {
    id: 'heading2', label: 'Heading 2', description: 'Section heading',
    icon: <span style={{ fontFamily: 'Inter', fontSize: '14px', fontWeight: 700, color: '#756b5e' }}>H2</span>,
    category: 'blocks', action: '## ',
  },
  {
    id: 'heading3', label: 'Heading 3', description: 'Subsection heading',
    icon: <span style={{ fontFamily: 'Inter', fontSize: '14px', fontWeight: 700, color: '#756b5e' }}>H3</span>,
    category: 'blocks', action: '### ',
  },
  {
    id: 'image', label: 'Image', description: 'Upload or embed an image',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#756b5e" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 16l5-5 4 4 3-3 6 6"/><circle cx="8.5" cy="8.5" r="1.5"/></svg>,
    category: 'blocks', action: '__image__',
  },
  {
    id: 'code', label: 'Code Block', description: 'Syntax-highlighted code',
    icon: <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#756b5e', fontWeight: 500 }}>{'{ }'}</span>,
    category: 'blocks', action: '```\n\n```',
  },
  {
    id: 'quote', label: 'Blockquote', description: 'Highlighted quote',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#756b5e" strokeWidth="1.5"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z"/></svg>,
    category: 'blocks', action: '> ',
  },
  {
    id: 'list-ul', label: 'Bullet List', description: 'Unordered list',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#756b5e" strokeWidth="1.5"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>,
    category: 'blocks', action: '- ',
  },
  {
    id: 'list-ol', label: 'Numbered List', description: 'Ordered list',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#756b5e" strokeWidth="1.5"><path d="M10 6h11M10 12h11M10 18h11M3 5v3M3 17v3M3 11v1"/></svg>,
    category: 'blocks', action: '1. ',
  },
  {
    id: 'divider', label: 'Divider', description: 'Horizontal rule',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#756b5e" strokeWidth="1.5"><path d="M3 12h18"/></svg>,
    category: 'blocks', action: '---\n',
  },
  {
    id: 'ai-ask', label: "Ask Claw'd", description: 'AI-powered writing help',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b4762c" strokeWidth="1.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/></svg>,
    category: 'ai', action: '__ai_ask__',
  },
  {
    id: 'ai-continue', label: 'Continue Writing', description: 'AI generates next paragraph',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b4762c" strokeWidth="1.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>,
    category: 'ai', action: '__ai_continue__',
  },
  {
    id: 'ai-outline', label: 'Generate Outline', description: 'AI creates section outline',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b4762c" strokeWidth="1.5"><path d="M9 5h11M9 12h11M9 19h11M5 5v.01M5 12v.01M5 19v.01"/></svg>,
    category: 'ai', action: '__ai_outline__',
  },
]

export default function SlashCommandMenu({ query, position, onSelect, onClose }: SlashCommandMenuProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const menuRef = useRef<HTMLDivElement>(null)

  const filtered = useMemo(() => {
    if (!query) return COMMANDS
    const q = query.toLowerCase()
    return COMMANDS.filter(
      cmd => cmd.label.toLowerCase().includes(q) || cmd.description.toLowerCase().includes(q) || cmd.id.includes(q)
    )
  }, [query])

  // Reset active index when filter changes
  useEffect(() => {
    setActiveIndex(0)
  }, [filtered.length])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex(i => (i + 1) % filtered.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex(i => (i - 1 + filtered.length) % filtered.length)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (filtered[activeIndex]) {
          onSelect(filtered[activeIndex])
        }
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [filtered, activeIndex, onSelect, onClose])

  // Scroll active item into view
  useEffect(() => {
    const menu = menuRef.current
    if (!menu) return
    const activeEl = menu.querySelector(`[data-index="${activeIndex}"]`)
    if (activeEl) activeEl.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  if (filtered.length === 0) return null

  const blockItems = filtered.filter(c => c.category === 'blocks')
  const aiItems = filtered.filter(c => c.category === 'ai')

  return (
    <div
      ref={menuRef}
      className="pe2-slash-menu"
      style={{ top: position.top, left: position.left }}
    >
      {blockItems.length > 0 && (
        <>
          <div className="pe2-slash-category">Blocks</div>
          {blockItems.map((cmd) => {
            const globalIdx = filtered.indexOf(cmd)
            return (
              <div
                key={cmd.id}
                data-index={globalIdx}
                className={`pe2-slash-item ${globalIdx === activeIndex ? 'pe2-slash-item--active' : ''}`}
                onClick={() => onSelect(cmd)}
                onMouseEnter={() => setActiveIndex(globalIdx)}
              >
                <div className="pe2-slash-icon">{cmd.icon}</div>
                <div className="pe2-slash-text">
                  <span className="pe2-slash-label">{cmd.label}</span>
                  <span className="pe2-slash-desc">{cmd.description}</span>
                </div>
              </div>
            )
          })}
        </>
      )}
      {aiItems.length > 0 && (
        <>
          {blockItems.length > 0 && <div className="pe2-slash-divider" />}
          <div className="pe2-slash-category">AI</div>
          {aiItems.map((cmd) => {
            const globalIdx = filtered.indexOf(cmd)
            return (
              <div
                key={cmd.id}
                data-index={globalIdx}
                className={`pe2-slash-item ${globalIdx === activeIndex ? 'pe2-slash-item--active' : ''}`}
                onClick={() => onSelect(cmd)}
                onMouseEnter={() => setActiveIndex(globalIdx)}
              >
                <div className="pe2-slash-icon">{cmd.icon}</div>
                <div className="pe2-slash-text">
                  <span className="pe2-slash-label" style={{ color: '#b4762c' }}>{cmd.label}</span>
                  <span className="pe2-slash-desc">{cmd.description}</span>
                </div>
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}
