import { useEffect, useCallback } from 'react'

interface KeyboardShortcutsOptions {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  onFormat: (prefix: string, suffix?: string) => void
  onSlashCommand: () => void
  onAIInline: () => void
  onSettingsToggle: () => void
  onSave: () => void
  enabled?: boolean
}

export function useKeyboardShortcuts({
  textareaRef,
  onFormat,
  onSlashCommand,
  onAIInline,
  onSettingsToggle,
  onSave,
  enabled = true,
}: KeyboardShortcutsOptions) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return

    const textarea = textareaRef.current
    const isCtrl = e.ctrlKey || e.metaKey
    const isShift = e.shiftKey
    const target = e.target as HTMLElement

    // Only handle shortcuts when focused on textarea or body
    const isEditorFocused = target === textarea || target.tagName === 'BODY'
    if (!isEditorFocused && isCtrl) {
      // Allow global shortcuts like Ctrl+S, Ctrl+Shift+M even outside textarea
      if (e.key === 's') {
        e.preventDefault()
        onSave()
        return
      }
      if (isShift && e.key.toLowerCase() === 'm') {
        e.preventDefault()
        onSettingsToggle()
        return
      }
      return
    }

    if (!textarea) return

    // Ctrl+B — Bold
    if (isCtrl && !isShift && e.key === 'b') {
      e.preventDefault()
      onFormat('**', '**')
      return
    }

    // Ctrl+I — Italic
    if (isCtrl && !isShift && e.key === 'i') {
      e.preventDefault()
      onFormat('*', '*')
      return
    }

    // Ctrl+E — Inline code
    if (isCtrl && !isShift && e.key === 'e') {
      e.preventDefault()
      onFormat('`', '`')
      return
    }

    // Ctrl+K — Link (when text selected) or AI inline (Ctrl+Shift+K)
    if (isCtrl && e.key === 'k') {
      e.preventDefault()
      if (isShift) {
        onAIInline()
      } else {
        // If text is selected, wrap in link. Otherwise trigger AI inline.
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        if (start !== end) {
          onFormat('[', '](url)')
        } else {
          onAIInline()
        }
      }
      return
    }

    // Ctrl+Shift+1 — Heading 1
    if (isCtrl && isShift && e.key === '!') {
      e.preventDefault()
      onFormat('# ')
      return
    }

    // Ctrl+Shift+2 — Heading 2
    if (isCtrl && isShift && e.key === '@') {
      e.preventDefault()
      onFormat('## ')
      return
    }

    // Ctrl+Shift+3 — Heading 3
    if (isCtrl && isShift && e.key === '#') {
      e.preventDefault()
      onFormat('### ')
      return
    }

    // Ctrl+Shift+7 — Ordered list
    if (isCtrl && isShift && e.key === '&') {
      e.preventDefault()
      onFormat('1. ')
      return
    }

    // Ctrl+Shift+8 — Bullet list
    if (isCtrl && isShift && e.key === '*') {
      e.preventDefault()
      onFormat('- ')
      return
    }

    // Ctrl+Shift+9 — Blockquote
    if (isCtrl && isShift && e.key === '(') {
      e.preventDefault()
      onFormat('> ')
      return
    }

    // Ctrl+S — Save
    if (isCtrl && !isShift && e.key === 's') {
      e.preventDefault()
      onSave()
      return
    }

    // Ctrl+Shift+M — Settings toggle
    if (isCtrl && isShift && e.key.toLowerCase() === 'm') {
      e.preventDefault()
      onSettingsToggle()
      return
    }

    // Tab — Insert 2 spaces (don't leave textarea)
    if (e.key === 'Tab' && !isCtrl && target === textarea) {
      e.preventDefault()
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const content = textarea.value
      const newContent = content.substring(0, start) + '  ' + content.substring(end)
      // We can't directly set textarea value in React controlled component,
      // so we dispatch an input event. The parent should handle this via onFormat or direct state update.
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype, 'value'
      )?.set
      nativeInputValueSetter?.call(textarea, newContent)
      textarea.dispatchEvent(new Event('input', { bubbles: true }))
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2
      }, 0)
      return
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, textareaRef, onFormat, onAIInline, onSettingsToggle, onSave])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}
