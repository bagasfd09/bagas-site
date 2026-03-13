'use client'

import { useEffect, useState, useCallback } from 'react'

interface RewriteOverlayProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  editorWrapRef: React.RefObject<HTMLDivElement | null>
  selectionStart: number
  selectionEnd: number
  originalContent: string
  phase: 'loading' | 'streaming' | 'done'
}

export default function RewriteOverlay({
  textareaRef,
  editorWrapRef,
  selectionStart,
  selectionEnd,
  originalContent,
  phase,
}: RewriteOverlayProps) {
  const [rect, setRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null)

  const computePosition = useCallback(() => {
    const textarea = textareaRef.current
    const editorWrap = editorWrapRef.current
    if (!textarea || !editorWrap) return

    // Mirror div technique: create a hidden div that mirrors the textarea
    const mirror = document.createElement('div')
    const style = window.getComputedStyle(textarea)

    mirror.style.cssText = `
      position: absolute;
      visibility: hidden;
      white-space: pre-wrap;
      word-wrap: break-word;
      overflow: hidden;
      font-family: ${style.fontFamily};
      font-size: ${style.fontSize};
      line-height: ${style.lineHeight};
      padding: ${style.padding};
      border: ${style.border};
      width: ${textarea.clientWidth}px;
      tab-size: ${style.tabSize};
      letter-spacing: ${style.letterSpacing};
    `
    document.body.appendChild(mirror)

    // Build content with a span wrapping the selection
    const textBefore = originalContent.substring(0, selectionStart)
    const textSelected = originalContent.substring(selectionStart, selectionEnd)

    const beforeNode = document.createTextNode(textBefore)
    const span = document.createElement('span')
    span.textContent = textSelected || '\u00a0'
    const afterNode = document.createTextNode(originalContent.substring(selectionEnd))

    mirror.appendChild(beforeNode)
    mirror.appendChild(span)
    mirror.appendChild(afterNode)

    const spanRect = span.getBoundingClientRect()
    const mirrorRect = mirror.getBoundingClientRect()

    const relTop = spanRect.top - mirrorRect.top - textarea.scrollTop
    const relLeft = spanRect.left - mirrorRect.left

    // Get textarea position relative to editor content container
    const editorContent = textarea.parentElement
    const textareaRect = textarea.getBoundingClientRect()
    const parentRect = (editorContent || editorWrap).getBoundingClientRect()
    const offsetTop = textareaRect.top - parentRect.top
    const offsetLeft = textareaRect.left - parentRect.left

    setRect({
      top: offsetTop + relTop,
      left: offsetLeft + relLeft,
      width: Math.min(spanRect.width, textarea.clientWidth - relLeft - 16),
      height: spanRect.height,
    })

    document.body.removeChild(mirror)
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
      const timer = setTimeout(() => setRect(null), 500)
      return () => clearTimeout(timer)
    }
  }, [phase])

  if (!rect) return null

  return (
    <div
      className={`pe-rewrite-overlay pe-rewrite-overlay--${phase}`}
      style={{
        top: rect.top,
        left: rect.left,
        width: Math.max(rect.width, 40),
        height: Math.max(rect.height, 20),
      }}
    />
  )
}
