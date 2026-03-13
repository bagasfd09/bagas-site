'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { slugify } from '@/lib/utils'
import Toast from './Toast'
import { PixelSprite, OfficeBackground } from '@/components/admin/DashboardMascot'
import { SpaceBackground, GardenBackground } from '@/components/admin/MascotSprites'
import RewriteOverlay from './RewriteOverlay'
import RewritePrompt from './RewritePrompt'
import MarkdownRenderer from '@/components/public/MarkdownRenderer'

interface Post {
  id?: string
  title: string
  slug: string
  content: string
  description: string
  icon: string
  tags: string[]
  category: string
  type: string
  published: boolean
  featured: boolean
}

interface PostFormProps {
  post?: Post
  type?: 'post' | 'note'
}

interface ChatMsg {
  role: 'user' | 'assistant'
  text: string
  reference?: string
}

interface RewriteState {
  active: boolean
  selectionStart: number
  selectionEnd: number
  originalText: string
  originalContent: string
  phase: 'loading' | 'streaming' | 'done'
  streamedSoFar: string
}

// Parse AI message for <suggest> blocks
type MsgSegment = { type: 'text'; content: string } | { type: 'suggest'; content: string }

function parseMessageSegments(text: string): MsgSegment[] {
  const segments: MsgSegment[] = []
  const regex = /<suggest>([\s\S]*?)<\/suggest>/g
  let lastIndex = 0
  let match

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: text.slice(lastIndex, match.index).trim() })
    }
    segments.push({ type: 'suggest', content: match[1].trim() })
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    const remaining = text.slice(lastIndex).trim()
    if (remaining) segments.push({ type: 'text', content: remaining })
  }

  // If no suggest tags found, return the whole text as-is
  if (segments.length === 0) {
    segments.push({ type: 'text', content: text })
  }

  return segments
}

function hasSuggestBlocks(text: string): boolean {
  return /<suggest>[\s\S]*?<\/suggest>/.test(text)
}

export default function PostForm({ post, type = 'post' }: PostFormProps) {
  const router = useRouter()
  const isNote = type === 'note'
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const [form, setForm] = useState<Post>({
    title: post?.title || '',
    slug: post?.slug || '',
    content: post?.content || '',
    description: post?.description || '',
    icon: post?.icon || '',
    tags: post?.tags || [],
    category: post?.category || (isNote ? 'note' : 'technical'),
    type: post?.type || type,
    published: post?.published ?? false,
    featured: post?.featured ?? false,
  })

  const [tagsInput, setTagsInput] = useState((post?.tags || []).join(', '))
  const [slugManual, setSlugManual] = useState(!!post?.slug)
  const [editSlug, setEditSlug] = useState(false)

  // Mascot state
  const [frame, setFrame] = useState(0)
  const [background, setBackground] = useState<string>('office')
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [replyInput, setReplyInput] = useState('')
  const [streamingText, setStreamingText] = useState('')

  // Text selection
  const [selectedText, setSelectedText] = useState('')
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null)
  const [showTooltip, setShowTooltip] = useState(false)
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 })
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const editorWrapRef = useRef<HTMLDivElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  // Rewrite state
  const [rewrite, setRewrite] = useState<RewriteState | null>(null)
  const [showRewritePrompt, setShowRewritePrompt] = useState(false)
  const [undoStack, setUndoStack] = useState<string[]>([])
  const rewriteAbortRef = useRef<AbortController | null>(null)

  // Preview mode
  const [previewMode, setPreviewMode] = useState(false)

  // "Asking" overlay: shows shimmer on referenced text while AI thinks
  const [askingRange, setAskingRange] = useState<{ start: number; end: number } | null>(null)
  // Preview selection rect for overlay positioning in preview mode
  const [previewSelRect, setPreviewSelRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null)

  // Image upload
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const abortRef = useRef<AbortController | null>(null)
  const msgEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto slug
  useEffect(() => {
    if (!slugManual && form.title) {
      setForm((f) => ({ ...f, slug: slugify(form.title) }))
    }
  }, [form.title, slugManual])

  // Animate mascot
  useEffect(() => {
    const interval = setInterval(() => setFrame(f => f + 1), 300)
    return () => clearInterval(interval)
  }, [])

  // Fetch mascot settings
  useEffect(() => {
    fetch('/api/admin/mascot')
      .then(r => r.json())
      .then(d => { if (d.background) setBackground(d.background) })
      .catch(() => {})
  }, [])

  // Auto-scroll messages
  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, streamingText])

  // Ctrl+Z undo handler for rewrite
  useEffect(() => {
    const handleUndo = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && undoStack.length > 0 && !rewrite?.active) {
        e.preventDefault()
        const prev = undoStack[undoStack.length - 1]
        setUndoStack(s => s.slice(0, -1))
        setForm(f => ({ ...f, content: prev }))
        setToast({ message: 'Rewrite undone', type: 'success' })
      }
    }
    document.addEventListener('keydown', handleUndo)
    return () => document.removeEventListener('keydown', handleUndo)
  }, [undoStack, rewrite])

  function handleTagsChange(value: string) {
    setTagsInput(value)
    const tags = value.split(',').map((t) => t.trim()).filter(Boolean)
    setForm((f) => ({ ...f, tags }))
  }

  // Text selection handler
  const handleTextSelect = useCallback(() => {
    if (rewrite?.active) return

    const textarea = textareaRef.current
    const editorWrap = editorWrapRef.current
    if (!textarea || !editorWrap) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    if (start === end) {
      setShowTooltip(false)
      setSelectedText('')
      setSelectionRange(null)
      return
    }

    const text = textarea.value.substring(start, end).trim()
    if (text.length < 5) {
      setShowTooltip(false)
      setSelectedText('')
      setSelectionRange(null)
      return
    }

    setSelectedText(text)
    setSelectionRange({ start, end })

    const textareaRect = textarea.getBoundingClientRect()
    const textBefore = textarea.value.substring(0, start)
    const linesBefore = textBefore.split('\n').length
    const lineHeight = 22
    const scrollTop = textarea.scrollTop

    const top = (linesBefore * lineHeight) - scrollTop - 40
    const left = Math.min(textareaRect.width / 2, 200)

    setTooltipPos({ top: Math.max(0, top), left })
    setShowTooltip(true)
  }, [rewrite])

  // Preview text selection handler
  const handlePreviewSelect = useCallback(() => {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed || !previewRef.current) {
      setShowTooltip(false)
      setSelectedText('')
      setSelectionRange(null)
      return
    }

    const text = selection.toString().trim()
    if (text.length < 5) {
      setShowTooltip(false)
      setSelectedText('')
      setSelectionRange(null)
      return
    }

    // Find this text in the raw markdown to get selection range
    // Use a normalized search: strip markdown formatting chars for matching
    const rawContent = form.content
    const idx = rawContent.indexOf(text)
    if (idx !== -1) {
      setSelectionRange({ start: idx, end: idx + text.length })
    } else {
      // Fuzzy: the rendered text might differ from raw markdown
      // Try finding a substring match (first 30 chars of selection)
      const searchKey = text.substring(0, 30)
      const fuzzyIdx = rawContent.indexOf(searchKey)
      if (fuzzyIdx !== -1) {
        // Find the end by searching for the last ~30 chars
        const endKey = text.substring(Math.max(0, text.length - 30))
        const endIdx = rawContent.indexOf(endKey, fuzzyIdx)
        if (endIdx !== -1) {
          setSelectionRange({ start: fuzzyIdx, end: endIdx + endKey.length })
        } else {
          setSelectionRange({ start: fuzzyIdx, end: fuzzyIdx + text.length })
        }
      } else {
        // Can't map back — still allow Ask (but not Rewrite into editor)
        setSelectionRange(null)
      }
    }

    setSelectedText(text)

    // Position tooltip near selection
    const range = selection.getRangeAt(0)
    const rect = range.getBoundingClientRect()
    const previewRect = previewRef.current.getBoundingClientRect()
    const editorContent = previewRef.current.parentElement
    const parentRect = editorContent ? editorContent.getBoundingClientRect() : previewRect

    const scrollTop = previewRef.current.scrollTop
    const relTop = rect.top - parentRect.top + scrollTop
    const relLeft = rect.left - parentRect.left

    setTooltipPos({
      top: relTop - 40,
      left: Math.min(relLeft + rect.width / 2, parentRect.width - 200),
    })

    // Save selection rect for asking overlay in preview mode
    setPreviewSelRect({
      top: relTop,
      left: relLeft,
      width: rect.width,
      height: rect.height,
    })

    setShowTooltip(true)
  }, [form.content])

  // Hide tooltip on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (showTooltip && !(e.target as HTMLElement).closest('.pe-tooltip') && !(e.target as HTMLElement).closest('.pe-rewrite-prompt')) {
        setShowTooltip(false)
        setShowRewritePrompt(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showTooltip])

  // Stream response from OpenClaw (with optional onDelta callback)
  const streamResponse = useCallback(async (
    apiMessages: { role: string; content: string }[],
    signal: AbortSignal,
    onDelta?: (delta: string, accumulated: string) => void,
  ) => {
    const res = await fetch('/api/admin/mascot/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: apiMessages }),
      signal,
    })

    if (!res.ok) throw new Error('OpenClaw error')
    const reader = res.body?.getReader()
    if (!reader) throw new Error('No stream')

    const decoder = new TextDecoder()
    let accumulated = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value, { stream: true })
      for (const line of chunk.split('\n')) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6).trim()
        if (data === '[DONE]') continue
        try {
          const parsed = JSON.parse(data)
          const delta = parsed.choices?.[0]?.delta?.content
          if (delta) {
            accumulated += delta
            if (onDelta) {
              onDelta(delta, accumulated)
            } else {
              setStreamingText(accumulated)
            }
          }
        } catch { /* skip */ }
      }
    }
    return accumulated
  }, [])

  // Stream rewrite: replaces selected text progressively
  const streamRewrite = useCallback(async (instruction: string, selStart: number, selEnd: number) => {
    if (rewrite?.active || isStreaming) return

    const originalContent = form.content
    const originalText = originalContent.substring(selStart, selEnd)

    setUndoStack(prev => [...prev.slice(-9), originalContent])

    setRewrite({
      active: true,
      selectionStart: selStart,
      selectionEnd: selEnd,
      originalText,
      originalContent,
      phase: 'loading',
      streamedSoFar: '',
    })

    const controller = new AbortController()
    rewriteAbortRef.current = controller

    const systemPrompt = [
      'You are a text rewriting assistant. Return ONLY the rewritten text.',
      'No explanations, no markdown fences wrapping the output.',
      'Match the original formatting style (markdown if the original uses it).',
      'Respond in the same language as the content.',
      form.title ? `Post title: "${form.title}"` : '',
    ].filter(Boolean).join('\n')

    const apiMessages = [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `Original text:\n"${originalText}"\n\nInstruction: ${instruction}`,
      },
    ]

    try {
      await new Promise(r => setTimeout(r, 100))
      setRewrite(prev => prev ? { ...prev, phase: 'streaming' } : null)

      const result = await streamResponse(apiMessages, controller.signal, (_delta, accumulated) => {
        const before = originalContent.substring(0, selStart)
        const after = originalContent.substring(selEnd)
        setForm(f => ({ ...f, content: before + accumulated + after }))
        setRewrite(prev => prev ? { ...prev, streamedSoFar: accumulated } : null)
      })

      if (result) {
        const before = originalContent.substring(0, selStart)
        const after = originalContent.substring(selEnd)
        setForm(f => ({ ...f, content: before + result + after }))
        setRewrite(prev => prev ? { ...prev, phase: 'done', streamedSoFar: result } : null)

        setMessages(prev => [...prev,
          { role: 'user', text: `Rewrite: "${originalText.substring(0, 80)}${originalText.length > 80 ? '...' : ''}" → ${instruction}` },
          { role: 'assistant', text: `Rewrote the selected text. Result:\n"${result.substring(0, 200)}${result.length > 200 ? '...' : ''}"` },
        ])

        setTimeout(() => setRewrite(null), 600)
        setToast({ message: 'Text rewritten! Ctrl+Z to undo', type: 'success' })
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        setForm(f => ({ ...f, content: originalContent }))
        setUndoStack(prev => prev.slice(0, -1))
        setToast({ message: 'Rewrite cancelled', type: 'success' })
      } else {
        setForm(f => ({ ...f, content: originalContent }))
        setUndoStack(prev => prev.slice(0, -1))
        setToast({ message: 'Rewrite failed', type: 'error' })
      }
      setRewrite(null)
    }
  }, [rewrite, isStreaming, form.content, form.title, streamResponse])

  // Cancel rewrite
  const cancelRewrite = useCallback(() => {
    if (rewriteAbortRef.current) {
      rewriteAbortRef.current.abort()
      rewriteAbortRef.current = null
    }
  }, [])

  // Handle "Rewrite with Claw'd" button
  const handleRewriteClick = useCallback(() => {
    if (!selectionRange) return
    setShowTooltip(false)
    setShowRewritePrompt(true)
  }, [selectionRange])

  // Handle rewrite prompt submission
  const handleRewriteSubmit = useCallback((instruction: string) => {
    if (!selectionRange) return
    setShowRewritePrompt(false)
    // Switch to Write mode so user sees the rewrite animation
    if (previewMode) setPreviewMode(false)
    // Small delay to let textarea render before starting rewrite
    setTimeout(() => {
      streamRewrite(instruction, selectionRange.start, selectionRange.end)
    }, previewMode ? 100 : 0)
  }, [selectionRange, streamRewrite, previewMode])

  // Handle "Apply to Editor" — only applies the <suggest> block content
  const handleApplyToEditor = useCallback((suggestText: string) => {
    if (rewrite?.active) return

    if (selectionRange) {
      const before = form.content.substring(0, selectionRange.start)
      const after = form.content.substring(selectionRange.end)
      setUndoStack(prev => [...prev.slice(-9), form.content])
      setForm(f => ({ ...f, content: before + suggestText + after }))
      setSelectionRange(null)
      setToast({ message: 'Applied to editor! Ctrl+Z to undo', type: 'success' })
    } else {
      const textarea = textareaRef.current
      const pos = textarea ? textarea.selectionStart : form.content.length
      const before = form.content.substring(0, pos)
      const after = form.content.substring(pos)
      const separator = before.endsWith('\n') || before === '' ? '' : '\n\n'
      setUndoStack(prev => [...prev.slice(-9), form.content])
      setForm(f => ({ ...f, content: before + separator + suggestText + after }))
      setToast({ message: 'Text inserted! Ctrl+Z to undo', type: 'success' })
    }
  }, [rewrite, selectionRange, form.content])

  // Send message to Claw'd
  const sendMessage = useCallback(async (userText: string, reference?: string) => {
    if (isStreaming) return

    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller

    const userMsg: ChatMsg = { role: 'user', text: userText, reference }
    setMessages(prev => [...prev, userMsg])
    setReplyInput('')
    setIsStreaming(true)
    setStreamingText('')

    // If there's a reference with a selection range, show asking overlay
    if (reference && selectionRange) {
      setAskingRange({ ...selectionRange })
    }

    const systemPrompt = [
      'You are a writing assistant for a blog post editor.',
      'Respond in the same language as the content.',
      'Keep your explanation concise (2-4 sentences).',
      'When you suggest specific replacement text for the referenced content, wrap ONLY the replacement text in <suggest>...</suggest> tags.',
      'Your explanation should be outside the tags. You may include multiple <suggest> blocks for different options.',
      'If you are giving general advice without a concrete text replacement, do not use <suggest> tags.',
      form.title ? `Post title: "${form.title}"` : '',
      form.description ? `Description: ${form.description}` : '',
      form.tags.length ? `Tags: ${form.tags.join(', ')}` : '',
    ].filter(Boolean).join('\n')

    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({
        role: m.role,
        content: m.reference
          ? `[Reference from post]:\n"${m.reference}"\n\n${m.text}`
          : m.text,
      })),
      {
        role: 'user',
        content: reference
          ? `[Reference from post]:\n"${reference}"\n\n${userText}`
          : userText,
      },
    ]

    try {
      const result = await streamResponse(apiMessages, controller.signal)
      if (result) {
        setMessages(prev => [...prev, { role: 'assistant', text: result }])
        setStreamingText('')
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return
      setMessages(prev => [...prev, { role: 'assistant', text: 'Failed to get response.' }])
      setStreamingText('')
    } finally {
      setIsStreaming(false)
      setAskingRange(null)
      setPreviewSelRect(null)
      inputRef.current?.focus()
    }
  }, [isStreaming, messages, form.title, form.description, form.tags, selectionRange, streamResponse])

  // Handle "Ask Claw'd about this"
  const handleAskAboutSelection = useCallback(() => {
    if (!selectedText) return
    setShowTooltip(false)

    const userMsg: ChatMsg = { role: 'user', text: '', reference: selectedText }
    setMessages(prev => [...prev, userMsg])
    setSelectedText('')

    setTimeout(() => inputRef.current?.focus(), 100)
  }, [selectedText])

  // Handle reply
  const handleReply = useCallback(() => {
    const text = replyInput.trim()
    if (!text) return

    const lastMsg = messages[messages.length - 1]
    if (lastMsg?.role === 'user' && lastMsg.text === '' && lastMsg.reference) {
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = { ...lastMsg, text }
        return updated
      })
      setReplyInput('')

      const ref = lastMsg.reference
      setMessages(prev => prev.slice(0, -1))
      sendMessage(text, ref)
    } else {
      sendMessage(text)
    }
  }, [replyInput, messages, sendMessage])

  // Quick actions
  const handleQuickAction = useCallback((action: string) => {
    const contentSnippet = form.content.substring(0, 500)
    const prompts: Record<string, string> = {
      'improve': `Review and suggest improvements for this content:\n"${contentSnippet}..."`,
      'summarize': `Write a concise summary/excerpt for this blog post based on: "${contentSnippet}..."`,
      'grammar': `Check for grammar and style issues in this content:\n"${contentSnippet}..."`,
      'seo': `Generate an SEO-optimized meta description and suggest title improvements for a post titled "${form.title}" about: ${form.description || contentSnippet.substring(0, 200)}`,
    }
    sendMessage(prompts[action] || action)
  }, [form.content, form.title, form.description, sendMessage])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleReply()
    }
  }, [handleReply])

  // Toolbar actions
  const insertMarkdown = useCallback((prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = form.content
    const selected = text.substring(start, end)
    const newText = text.substring(0, start) + prefix + selected + suffix + text.substring(end)
    setForm(f => ({ ...f, content: newText }))
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + prefix.length, end + prefix.length)
    }, 0)
  }, [form.content])

  // Image upload to Cloudinary
  const uploadImage = useCallback(async (file: File) => {
    if (uploading) return
    if (!file.type.startsWith('image/')) {
      setToast({ message: 'Only image files are allowed', type: 'error' })
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setToast({ message: 'Image must be under 10MB', type: 'error' })
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', 'lxqdss4t')
    formData.append('folder', 'blog')

    try {
      const res = await fetch('https://api.cloudinary.com/v1_1/dpust3pte/image/upload', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) throw new Error('Upload failed')
      const data = await res.json()
      const url = data.secure_url as string
      const alt = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
      const markdown = `![${alt}](${url})`

      // Insert at cursor position
      const textarea = textareaRef.current
      const pos = textarea ? textarea.selectionStart : form.content.length
      const before = form.content.substring(0, pos)
      const after = form.content.substring(pos)
      const separator = before.endsWith('\n') || before === '' ? '' : '\n\n'
      setForm(f => ({ ...f, content: before + separator + markdown + '\n' + after }))
      setToast({ message: 'Image uploaded!', type: 'success' })
    } catch {
      setToast({ message: 'Failed to upload image', type: 'error' })
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }, [uploading, form.content])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadImage(file)
  }, [uploadImage])

  // Paste image handler
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        const file = item.getAsFile()
        if (file) uploadImage(file)
        return
      }
    }
  }, [uploadImage])

  // Drop image handler
  const handleDrop = useCallback((e: React.DragEvent) => {
    const file = e.dataTransfer?.files?.[0]
    if (file && file.type.startsWith('image/')) {
      e.preventDefault()
      uploadImage(file)
    }
  }, [uploadImage])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (e.dataTransfer?.types?.includes('Files')) {
      e.preventDefault()
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const url = post?.id
        ? `/api/admin/${isNote ? 'notes' : 'posts'}/${post.id}`
        : `/api/admin/${isNote ? 'notes' : 'posts'}`
      const method = post?.id ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to save')
      }
      setToast({ message: `${isNote ? 'Note' : 'Post'} saved successfully`, type: 'success' })
      setTimeout(() => {
        router.push(`/admin/${isNote ? 'notes' : 'posts'}`)
        router.refresh()
      }, 800)
    } catch (err) {
      setToast({ message: String(err instanceof Error ? err.message : err), type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  // Render a single message with parsed <suggest> blocks
  const renderMessageContent = useCallback((msg: ChatMsg) => {
    if (!msg.text) return null

    const segments = parseMessageSegments(msg.text)
    const hasSuggestions = hasSuggestBlocks(msg.text)

    if (!hasSuggestions) {
      return <p className="pe-msg-text">{msg.text}</p>
    }

    return (
      <div className="pe-msg-parsed">
        {segments.map((seg, j) => {
          if (seg.type === 'text') {
            return <p key={j} className="pe-msg-text">{seg.content}</p>
          }
          return (
            <div key={j} className="pe-suggest-block">
              <div className="pe-suggest-header">
                <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M11 2l3 3-9 9H2v-3z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <span>Suggested text</span>
              </div>
              <p className="pe-suggest-text">{seg.content}</p>
              <button
                type="button"
                className="pe-msg-apply-btn"
                onClick={() => handleApplyToEditor(seg.content)}
                disabled={!!rewrite?.active}
              >
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M11 2l3 3-9 9H2v-3z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Apply to Editor
              </button>
            </div>
          )
        })}
      </div>
    )
  }, [handleApplyToEditor, rewrite])

  const mascotState = isStreaming || rewrite?.active ? 'writing' : messages.length > 0 ? 'presenting' : 'idle'
  const hasReferenceWaiting = messages.length > 0 && messages[messages.length - 1]?.role === 'user' && messages[messages.length - 1]?.text === '' && messages[messages.length - 1]?.reference

  // Determine if we should show asking overlay (shimmer on referenced text while AI thinks)
  const showAskingOverlay = isStreaming && askingRange && !rewrite?.active

  return (
    <div className="pe-page">
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}

      {/* Header */}
      <div className="pe-header">
        <div className="pe-breadcrumb">
          <Link href={`/admin/${isNote ? 'notes' : 'posts'}`} className="pe-breadcrumb-link">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 4l-4 4 4 4" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Back to {isNote ? 'Notes' : 'Posts'}
          </Link>
          <span className="pe-breadcrumb-sep">/</span>
          <span className="pe-breadcrumb-current">{post?.id ? 'Edit Post' : 'New Post'}</span>
        </div>
        <div className="pe-header-actions">
          {rewrite?.active && (
            <button type="button" onClick={cancelRewrite} className="admin-btn admin-btn-secondary" style={{ color: 'var(--admin-error)' }}>
              Cancel Rewrite
            </button>
          )}
          <button type="button" onClick={() => router.back()} className="admin-btn admin-btn-secondary">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading || !!rewrite?.active} className="admin-btn admin-btn-primary">
            {loading ? 'Saving...' : post?.id ? 'Save Changes' : 'Create'}
          </button>
        </div>
      </div>

      {/* Main layout */}
      <form onSubmit={handleSubmit} className="pe-layout">
        {/* Left: Editor */}
        <div className="pe-editor-area">
          {/* Title */}
          <div className="pe-title-field">
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="pe-title-input"
              placeholder={isNote ? 'Note title' : 'Post title'}
            />
            <div className="pe-slug-row">
              {editSlug ? (
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => { setSlugManual(true); setForm((f) => ({ ...f, slug: e.target.value })) }}
                  onBlur={() => setEditSlug(false)}
                  className="pe-slug-input"
                  autoFocus
                />
              ) : (
                <>
                  <span className="pe-slug-text">/{isNote ? 'notes' : 'blog'}/{form.slug || '...'}</span>
                  <button type="button" className="pe-slug-edit" onClick={() => setEditSlug(true)}>Edit slug</button>
                </>
              )}
            </div>
          </div>

          {/* Description (posts only) */}
          {!isNote && (
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="pe-desc-input"
              placeholder="Short description for preview cards..."
            />
          )}

          {/* Markdown Editor */}
          <div className="pe-editor-card" ref={editorWrapRef}>
            {/* Toolbar */}
            <div className="pe-toolbar">
              <div className="pe-toolbar-group">
                {!previewMode && (
                  <>
                    <button type="button" className="pe-toolbar-btn" onClick={() => insertMarkdown('**', '**')} title="Bold"><strong>B</strong></button>
                    <button type="button" className="pe-toolbar-btn" onClick={() => insertMarkdown('*', '*')} title="Italic"><em>I</em></button>
                    <button type="button" className="pe-toolbar-btn" onClick={() => insertMarkdown('~~', '~~')} title="Strikethrough"><s>S</s></button>
                    <div className="pe-toolbar-sep" />
                    <button type="button" className="pe-toolbar-btn" onClick={() => insertMarkdown('# ')} title="Heading 1">H1</button>
                    <button type="button" className="pe-toolbar-btn" onClick={() => insertMarkdown('## ')} title="Heading 2">H2</button>
                    <div className="pe-toolbar-sep" />
                    <button type="button" className="pe-toolbar-btn" onClick={() => insertMarkdown('- ')} title="List">
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h10M4 8h7M4 12h9"/></svg>
                    </button>
                    <button type="button" className="pe-toolbar-btn" onClick={() => insertMarkdown('```\n', '\n```')} title="Code block">
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 4L1 8l4 4M11 4l4 4-4 4"/></svg>
                    </button>
                    <div className="pe-toolbar-sep" />
                    <button
                      type="button"
                      className="pe-toolbar-btn"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      title="Upload image"
                    >
                      {uploading ? (
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="pe-spin">
                          <path d="M8 1v3M8 12v3M1 8h3M12 8h3" strokeLinecap="round"/>
                        </svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <rect x="1.5" y="2.5" width="13" height="11" rx="1.5"/>
                          <circle cx="5" cy="6" r="1.5"/>
                          <path d="M1.5 11l3.5-3.5L8 10.5l2.5-3L14.5 13" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      style={{ display: 'none' }}
                    />
                  </>
                )}
                {rewrite?.active && (
                  <span style={{ fontSize: '0.6875rem', color: 'var(--admin-accent)', fontWeight: 500, marginLeft: 4 }}>
                    {rewrite.phase === 'loading' ? 'Preparing rewrite...' : rewrite.phase === 'streaming' ? 'Rewriting...' : 'Done!'}
                  </span>
                )}
              </div>

              {/* Write / Preview tabs */}
              <div className="pe-tab-group">
                <button
                  type="button"
                  className={`pe-tab-btn${!previewMode ? ' pe-tab-btn--active' : ''}`}
                  onClick={() => setPreviewMode(false)}
                >
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M11 2l3 3-9 9H2v-3z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Write
                </button>
                <button
                  type="button"
                  className={`pe-tab-btn${previewMode ? ' pe-tab-btn--active' : ''}`}
                  onClick={() => { setPreviewMode(true); setShowTooltip(false); setShowRewritePrompt(false) }}
                >
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"/><circle cx="8" cy="8" r="2"/></svg>
                  Preview
                </button>
              </div>
            </div>

            {/* Editor content area */}
            <div className="pe-editor-content">
              {previewMode ? (
                /* Preview pane */
                <div className="pe-preview" ref={previewRef} onMouseUp={handlePreviewSelect}>
                  {form.content.trim() ? (
                    <MarkdownRenderer content={form.content} />
                  ) : (
                    <p className="pe-preview-empty">Nothing to preview yet. Switch to Write and add some content.</p>
                  )}

                  {/* Asking overlay in preview mode */}
                  {showAskingOverlay && previewSelRect && (
                    <div
                      className="pe-rewrite-overlay pe-rewrite-overlay--asking"
                      style={{
                        top: previewSelRect.top,
                        left: previewSelRect.left,
                        width: previewSelRect.width,
                        height: previewSelRect.height,
                      }}
                    >
                      <div className="pe-overlay-badge">
                        <span className="pe-overlay-badge-dot" />
                        <span>Claw&rsquo;d is thinking...</span>
                      </div>
                    </div>
                  )}

                  {/* Tooltip in preview mode */}
                  {showTooltip && selectedText && !showRewritePrompt && (
                    <div
                      className="pe-tooltip"
                      style={{ top: tooltipPos.top, left: Math.max(0, tooltipPos.left) }}
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      <button
                        type="button"
                        className="pe-tooltip-btn"
                        onClick={handleAskAboutSelection}
                      >
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 1a7 7 0 100 14A7 7 0 008 1z"/><path d="M6 8l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        Ask Claw&apos;d
                      </button>
                      {selectionRange && (
                        <>
                          <div className="pe-tooltip-sep" />
                          <button
                            type="button"
                            className="pe-tooltip-btn"
                            onClick={handleRewriteClick}
                          >
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M11 2l3 3-9 9H2v-3z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            Rewrite
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {/* Rewrite prompt in preview mode */}
                  {showRewritePrompt && selectionRange && (
                    <RewritePrompt
                      position={{ top: tooltipPos.top + 36, left: Math.max(0, tooltipPos.left) }}
                      onSubmit={handleRewriteSubmit}
                      onCancel={() => setShowRewritePrompt(false)}
                    />
                  )}
                </div>
              ) : (
                <>
                  <textarea
                    ref={textareaRef}
                    required
                    value={form.content}
                    onChange={(e) => {
                      if (!rewrite?.active) {
                        setForm((f) => ({ ...f, content: e.target.value }))
                      }
                    }}
                    onMouseUp={handleTextSelect}
                    onKeyUp={handleTextSelect}
                    onPaste={handlePaste}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    className={`pe-textarea${rewrite?.active ? ' pe-textarea--rewriting' : ''}`}
                    readOnly={!!rewrite?.active}
                    placeholder="# Title&#10;&#10;Write your content in Markdown..."
                  />

                  {/* Rewrite overlay (during direct rewrite) */}
                  {rewrite?.active && (
                    <RewriteOverlay
                      textareaRef={textareaRef}
                      editorWrapRef={editorWrapRef}
                      selectionStart={rewrite.selectionStart}
                      selectionEnd={rewrite.selectionEnd}
                      originalContent={rewrite.originalContent}
                      phase={rewrite.phase}
                    />
                  )}

                  {/* Asking overlay (subtle highlight on referenced text while AI thinks) */}
                  {showAskingOverlay && askingRange && (
                    <RewriteOverlay
                      textareaRef={textareaRef}
                      editorWrapRef={editorWrapRef}
                      selectionStart={askingRange.start}
                      selectionEnd={askingRange.end}
                      originalContent={form.content}
                      phase="loading"
                      mode="asking"
                    />
                  )}

                  {/* Selection tooltip */}
                  {showTooltip && !rewrite?.active && (
                    <div
                      className="pe-tooltip"
                      style={{ top: tooltipPos.top, left: tooltipPos.left }}
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      <button
                        type="button"
                        className="pe-tooltip-btn"
                        onClick={handleAskAboutSelection}
                      >
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 1a7 7 0 100 14A7 7 0 008 1z"/><path d="M6 8l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        Ask Claw&apos;d
                      </button>
                      <div className="pe-tooltip-sep" />
                      <button
                        type="button"
                        className="pe-tooltip-btn"
                        onClick={handleRewriteClick}
                      >
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M11 2l3 3-9 9H2v-3z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        Rewrite
                      </button>
                    </div>
                  )}

                  {/* Rewrite prompt */}
                  {showRewritePrompt && selectionRange && (
                    <RewritePrompt
                      position={{ top: tooltipPos.top + 36, left: tooltipPos.left }}
                      onSubmit={handleRewriteSubmit}
                      onCancel={() => setShowRewritePrompt(false)}
                    />
                  )}
                </>
              )}
            </div>
          </div>

          {/* Metadata bar */}
          <div className="pe-metadata">
            <div className="pe-meta-group">
              <span className="pe-meta-label">Tags</span>
              <div className="pe-tags">
                {form.tags.map((tag, i) => (
                  <span key={i} className="pe-tag">
                    {tag}
                    <button type="button" className="pe-tag-remove" onClick={() => {
                      const newTags = form.tags.filter((_, j) => j !== i)
                      setForm(f => ({ ...f, tags: newTags }))
                      setTagsInput(newTags.join(', '))
                    }}>&times;</button>
                  </span>
                ))}
                <input
                  type="text"
                  className="pe-tag-input"
                  placeholder="+ Add tag"
                  value={tagsInput.includes(',') ? '' : tagsInput}
                  onChange={(e) => handleTagsChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      const val = (e.target as HTMLInputElement).value.trim()
                      if (val && !form.tags.includes(val)) {
                        const newTags = [...form.tags, val]
                        setForm(f => ({ ...f, tags: newTags }))
                        setTagsInput(newTags.join(', '))
                      }
                      ;(e.target as HTMLInputElement).value = ''
                    }
                  }}
                />
              </div>
            </div>

            {!isNote && (
              <>
                <div className="pe-meta-sep" />
                <div className="pe-meta-group">
                  <span className="pe-meta-label">Category</span>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    className="pe-category-select"
                  >
                    <option value="technical">Technical</option>
                    <option value="personal">Personal</option>
                  </select>
                </div>
              </>
            )}

            <div className="pe-meta-sep" />

            <div className="pe-toggles">
              <label className="pe-toggle">
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
                />
                <span className={`pe-toggle-track ${form.published ? 'pe-toggle-track--on' : ''}`}>
                  <span className="pe-toggle-thumb" />
                </span>
                Published
              </label>
              {!isNote && (
                <label className="pe-toggle">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
                  />
                  <span className={`pe-toggle-track ${form.featured ? 'pe-toggle-track--on pe-toggle-track--gold' : ''}`}>
                    <span className="pe-toggle-thumb" />
                  </span>
                  Featured
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Right: AI Assistant */}
        <div className="pe-assistant">
          {/* Mascot scene */}
          <div className="pe-mascot-scene">
            <div className="adm-office-bg">
              {background === 'space' ? <SpaceBackground /> : background === 'garden' ? <GardenBackground /> : <OfficeBackground />}
            </div>
            <div className="pe-mascot-sprite">
              <PixelSprite
                state={mascotState}
                frame={frame}
                karatePhase="ready"
                presentPhase={messages.length > 0 ? 'point-1' : 'walk'}
                coffeePhase="walk"
                callingPhase="wave-1"
              />
            </div>
          </div>

          {/* Name + Status */}
          <div className="pe-mascot-info">
            <div className="pe-mascot-name-row">
              <span className="pe-mascot-name">Claw&apos;d</span>
              <div className="pe-mascot-status">
                <span className="pe-mascot-dot" />
                <span>{isStreaming ? 'Thinking...' : rewrite?.active ? 'Rewriting...' : 'Writing Assistant'}</span>
              </div>
            </div>
            <span className="pe-mascot-role">Helps you write better content</span>
          </div>

          {/* Quick Actions */}
          <div className="pe-quick-actions">
            <span className="pe-section-label">Quick Actions</span>
            <div className="pe-action-chips">
              <button type="button" className="pe-action-chip" onClick={() => handleQuickAction('improve')}>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 4h12M4 8h8M6 12h4"/></svg>
                Improve Writing
              </button>
              <button type="button" className="pe-action-chip" onClick={() => handleQuickAction('summarize')}>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h8M4 8h5M4 12h7"/></svg>
                Summarize
              </button>
              <button type="button" className="pe-action-chip" onClick={() => handleQuickAction('grammar')}>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 12l3-8 3 8M5 10h4"/></svg>
                Fix Grammar
              </button>
              <button type="button" className="pe-action-chip" onClick={() => handleQuickAction('seo')}>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="7" cy="7" r="4"/><path d="M10 10l3 3"/></svg>
                Generate SEO
              </button>
            </div>
          </div>

          {/* Conversation */}
          <div className="pe-convo-area">
            <span className="pe-section-label">Conversation</span>
            <div className="pe-messages">
              {messages.length === 0 && !streamingText && (
                <p className="pe-empty-msg">Select text or use quick actions to start a conversation with Claw&apos;d.</p>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`pe-msg pe-msg--${msg.role}`}>
                  {msg.reference && (
                    <div className="pe-reference-card">
                      <div className="pe-reference-label">
                        <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor"><path d="M3 3h4v4H3zM9 3h4v4H9zM3 9h4v4H3z"/></svg>
                        Selected Reference
                      </div>
                      <p className="pe-reference-text">{msg.reference}</p>
                    </div>
                  )}
                  {msg.role === 'assistant' ? renderMessageContent(msg) : (
                    msg.text && <p className="pe-msg-text">{msg.text}</p>
                  )}
                </div>
              ))}
              {streamingText && (
                <div className="pe-msg pe-msg--assistant">
                  <p className="pe-msg-text">{streamingText}<span className="pe-cursor">▊</span></p>
                </div>
              )}
              <div ref={msgEndRef} />
            </div>
          </div>

          {/* Reply input */}
          <div className="pe-reply">
            <input
              ref={inputRef}
              type="text"
              className="pe-reply-input"
              placeholder={hasReferenceWaiting ? 'Type your question about the selection...' : "Ask Claw'd anything..."}
              value={replyInput}
              onChange={e => setReplyInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isStreaming}
            />
            <button
              type="button"
              className="pe-reply-btn"
              onClick={handleReply}
              disabled={isStreaming || !replyInput.trim()}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M14 2L7 9M14 2l-5 12-2-5-5-2z"/></svg>
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
