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

/**
 * Measures the pixel position of a text range inside a textarea by creating
 * a hidden mirror div that replicates the textarea's styling and content.
 * This correctly handles word-wrapped proportional fonts.
 */
function measureTextareaRange(
  textarea: HTMLTextAreaElement,
  start: number,
  end: number,
): { top: number; height: number } | null {
  const style = window.getComputedStyle(textarea)
  const mirror = document.createElement('div')

  // Copy all relevant styles
  const props = [
    'fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'letterSpacing',
    'lineHeight', 'textTransform', 'wordSpacing', 'textIndent',
    'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
    'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
    'boxSizing', 'whiteSpace', 'wordWrap', 'overflowWrap', 'wordBreak',
  ] as const

  mirror.style.position = 'absolute'
  mirror.style.visibility = 'hidden'
  mirror.style.top = '0'
  mirror.style.left = '0'
  mirror.style.width = `${textarea.clientWidth}px`
  mirror.style.overflow = 'hidden'

  for (const prop of props) {
    (mirror.style as unknown as Record<string, string>)[prop] = style[prop]
  }

  // Build content: text before selection + marker + selected text + marker
  const content = textarea.value
  const beforeText = content.substring(0, start)
  const selectedText = content.substring(start, end)

  // Create text nodes and marker spans
  const beforeNode = document.createTextNode(beforeText)
  const startMarker = document.createElement('span')
  startMarker.id = '_overlay_start'
  startMarker.textContent = '\u200b' // zero-width space
  const selectedNode = document.createTextNode(selectedText)
  const endMarker = document.createElement('span')
  endMarker.id = '_overlay_end'
  endMarker.textContent = '\u200b'
  const afterNode = document.createTextNode(content.substring(end))

  mirror.appendChild(beforeNode)
  mirror.appendChild(startMarker)
  mirror.appendChild(selectedNode)
  mirror.appendChild(endMarker)
  mirror.appendChild(afterNode)

  document.body.appendChild(mirror)

  const startRect = startMarker.getBoundingClientRect()
  const endRect = endMarker.getBoundingClientRect()
  const mirrorRect = mirror.getBoundingClientRect()

  const top = startRect.top - mirrorRect.top
  const bottom = endRect.bottom - mirrorRect.top
  const height = bottom - top

  document.body.removeChild(mirror)

  return { top, height: Math.max(height, parseFloat(style.lineHeight) || 28) }
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

    const measured = measureTextareaRange(textarea, selectionStart, selectionEnd)
    if (!measured) return

    const style = window.getComputedStyle(textarea)
    const paddingLeft = parseFloat(style.paddingLeft) || 0
    const scrollTop = textarea.scrollTop

    // Get textarea position relative to parent wrapper
    const textareaRect = textarea.getBoundingClientRect()
    const parentEl = textarea.parentElement
    const parentRect = (parentEl || editorWrap).getBoundingClientRect()
    const offsetTop = textareaRect.top - parentRect.top
    const offsetLeft = textareaRect.left - parentRect.left

    setRect({
      top: offsetTop + measured.top - scrollTop,
      height: measured.height,
      fullWidth: textarea.clientWidth - paddingLeft * 2,
      offsetLeft: offsetLeft + paddingLeft,
    })
  }, [textareaRef, editorWrapRef, selectionStart, selectionEnd])

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
      {phase !== 'done' && (
        <div className="pe-overlay-badge">
          <span className="pe-overlay-badge-dot" />
          <span>{statusLabel}</span>
        </div>
      )}

      {phase === 'done' && !isAsking && (
        <div className="pe-overlay-done">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8.5l3 3 7-7" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
      )}
    </div>
  )
}
