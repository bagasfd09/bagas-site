'use client'

import { useEffect, useState, useCallback } from 'react'

type OverlayPhase = 'loading' | 'streaming' | 'done'
type OverlayMode = 'rewrite' | 'asking'

interface RewriteOverlayProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  editorWrapRef: React.RefObject<HTMLDivElement | null>
  selectionStart: number
  selectionEnd: number
  originalContent: string
  phase: OverlayPhase
  mode?: OverlayMode
}

export default function RewriteOverlay({
  textareaRef,
  editorWrapRef,
  selectionStart,
  selectionEnd,
  originalContent,
  phase,
  mode = 'rewrite',
}: RewriteOverlayProps) {
  const [rect, setRect] = useState<{ top: number; height: number; fullWidth: number; offsetLeft: number } | null>(null)

  const computePosition = useCallback(() => {
    const textarea = textareaRef.current
    const editorWrap = editorWrapRef.current
    if (!textarea || !editorWrap) return

    const style = window.getComputedStyle(textarea)
    const lineHeight = parseFloat(style.lineHeight) || 22
    const paddingTop = parseFloat(style.paddingTop) || 0
    const paddingLeft = parseFloat(style.paddingLeft) || 0

    // Count lines before selection start and end
    const textBefore = originalContent.substring(0, selectionStart)
    const textSelected = originalContent.substring(selectionStart, selectionEnd)
    const linesBefore = textBefore.split('\n').length - 1
    const linesInSelection = textSelected.split('\n').length

    const scrollTop = textarea.scrollTop

    // Position relative to textarea's content area
    const topInTextarea = paddingTop + (linesBefore * lineHeight) - scrollTop
    const height = linesInSelection * lineHeight

    // Get textarea position relative to .pe-editor-content
    const textareaRect = textarea.getBoundingClientRect()
    const parentEl = textarea.parentElement
    const parentRect = (parentEl || editorWrap).getBoundingClientRect()
    const offsetTop = textareaRect.top - parentRect.top
    const offsetLeft = textareaRect.left - parentRect.left

    setRect({
      top: offsetTop + topInTextarea,
      height: Math.max(height, lineHeight),
      fullWidth: textarea.clientWidth - paddingLeft * 2,
      offsetLeft: offsetLeft + paddingLeft,
    })
  }, [textareaRef, editorWrapRef, selectionStart, selectionEnd, originalContent])

  useEffect(() => {
    computePosition()

    const textarea = textareaRef.current
    if (!textarea) return

    const handleScroll = () => computePosition()
    textarea.addEventListener('scroll', handleScroll)
    window.addEventListener('resize', handleScroll)

    return () => {
      textarea.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [computePosition, textareaRef])

  // Auto-remove after done phase
  useEffect(() => {
    if (phase === 'done') {
      const timer = setTimeout(() => setRect(null), 800)
      return () => clearTimeout(timer)
    }
  }, [phase])

  if (!rect) return null

  const isAsking = mode === 'asking'
  const phaseClass = isAsking ? 'pe-rewrite-overlay--asking' : `pe-rewrite-overlay--${phase}`

  const statusLabel = isAsking
    ? 'Claw\u2019d is thinking...'
    : phase === 'loading'
      ? 'Preparing rewrite...'
      : phase === 'streaming'
        ? 'Rewriting...'
        : 'Done!'

  return (
    <div
      className={`pe-rewrite-overlay ${phaseClass}`}
      style={{
        top: rect.top,
        left: rect.offsetLeft,
        width: rect.fullWidth,
        height: rect.height,
      }}
    >
      {/* Status badge */}
      {phase !== 'done' && (
        <div className="pe-overlay-badge">
          <span className="pe-overlay-badge-dot" />
          <span>{statusLabel}</span>
        </div>
      )}

      {/* Success checkmark on done */}
      {phase === 'done' && !isAsking && (
        <div className="pe-overlay-done">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8.5l3 3 7-7" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
      )}
    </div>
  )
}
