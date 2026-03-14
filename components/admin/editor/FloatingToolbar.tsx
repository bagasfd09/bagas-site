'use client'

import { useEffect, useRef, useState } from 'react'

interface FloatingToolbarProps {
  editorRef: React.RefObject<HTMLTextAreaElement | null>
  containerRef: React.RefObject<HTMLDivElement | null>
  onFormat: (prefix: string, suffix?: string) => void
  onAIClick: () => void
  visible: boolean
}

export default function FloatingToolbar({ editorRef, containerRef, onFormat, onAIClick, visible }: FloatingToolbarProps) {
  const toolbarRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ top: 0, left: 0 })

  useEffect(() => {
    if (!visible || !editorRef.current || !containerRef.current) return

    const textarea = editorRef.current
    const container = containerRef.current
    const containerRect = container.getBoundingClientRect()

    // Calculate position based on selection in textarea
    const start = textarea.selectionStart
    const textBefore = textarea.value.substring(0, start)
    const linesBefore = textBefore.split('\n').length
    const lineHeight = parseFloat(getComputedStyle(textarea).lineHeight) || 28
    const scrollTop = textarea.scrollTop
    const paddingTop = parseFloat(getComputedStyle(textarea).paddingTop) || 0

    const top = paddingTop + (linesBefore - 1) * lineHeight - scrollTop - 44
    const toolbarWidth = toolbarRef.current?.offsetWidth || 380
    const left = Math.max(0, Math.min(
      (containerRect.width - toolbarWidth) / 2,
      containerRect.width - toolbarWidth - 16
    ))

    setPosition({ top: Math.max(0, top), left })
  }, [visible, editorRef, containerRef])

  if (!visible) return null

  return (
    <div
      ref={toolbarRef}
      className="pe2-floating-toolbar"
      style={{ top: position.top, left: position.left }}
      onMouseDown={(e) => e.preventDefault()}
    >
      <button type="button" className="pe2-ft-btn" onClick={() => onFormat('**', '**')} title="Bold (Ctrl+B)">
        <strong style={{ fontSize: '13px' }}>B</strong>
      </button>
      <button type="button" className="pe2-ft-btn" onClick={() => onFormat('*', '*')} title="Italic (Ctrl+I)">
        <em style={{ fontSize: '13px' }}>I</em>
      </button>
      <button type="button" className="pe2-ft-btn" onClick={() => onFormat('~~', '~~')} title="Strikethrough">
        <s style={{ fontSize: '13px' }}>S</s>
      </button>
      <span className="pe2-ft-sep" />
      <button type="button" className="pe2-ft-btn" onClick={() => onFormat('## ')} title="Heading 2">
        <span style={{ fontSize: '11px', fontWeight: 600 }}>H2</span>
      </button>
      <button type="button" className="pe2-ft-btn" onClick={() => onFormat('### ')} title="Heading 3">
        <span style={{ fontSize: '11px', fontWeight: 600 }}>H3</span>
      </button>
      <span className="pe2-ft-sep" />
      <button type="button" className="pe2-ft-btn" onClick={() => onFormat('[', '](url)')} title="Link (Ctrl+K)">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
        </svg>
      </button>
      <button type="button" className="pe2-ft-btn" onClick={() => onFormat('`', '`')} title="Inline Code (Ctrl+E)">
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px' }}>{'{ }'}</span>
      </button>
      <button type="button" className="pe2-ft-btn" onClick={() => onFormat('> ')} title="Blockquote">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z" />
        </svg>
      </button>
      <span className="pe2-ft-sep" />
      <button type="button" className="pe2-ft-ai-btn" onClick={onAIClick} title="AI Edit (Ctrl+Shift+K)">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
        <span>AI</span>
      </button>
    </div>
  )
}
