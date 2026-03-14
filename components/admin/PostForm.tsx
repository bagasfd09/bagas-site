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
import {
  EditorStatusBar,
  FloatingToolbar,
  SlashCommandMenu,
  SettingsDrawer,
  EditorCheatsheet,
  useAutosave,
  useKeyboardShortcuts,
} from './editor'
import './editor/editor-v2.css'

interface Post {
  id?: string
  title: string
  slug: string
  content: string
  description: string
  thumbnail: string
  icon: string
  tags: string[]
  category: string
  type: string
  published: boolean
  featured: boolean
  series?: string
  seriesOrder?: number | null
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
    thumbnail: post?.thumbnail || '',
    icon: post?.icon || '',
    tags: post?.tags || [],
    category: post?.category || (isNote ? 'note' : 'technical'),
    type: post?.type || type,
    published: post?.published ?? false,
    featured: post?.featured ?? false,
    series: post?.series || '',
    seriesOrder: post?.seriesOrder ?? null,
  })

  const [slugManual, setSlugManual] = useState(!!post?.slug)
  const [editSlug, setEditSlug] = useState(false)
  const [existingSeries, setExistingSeries] = useState<string[]>([])

  // UI state
  const [previewMode, setPreviewMode] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [aiSidebarOpen, setAiSidebarOpen] = useState(true)

  // Slash command
  const [slashActive, setSlashActive] = useState(false)
  const [slashQuery, setSlashQuery] = useState('')
  const [slashPos, setSlashPos] = useState({ top: 0, left: 0 })
  const slashStartRef = useRef<number>(-1)

  // Cursor tracking for status bar
  const [cursorLine, setCursorLine] = useState(1)
  const [cursorCol, setCursorCol] = useState(1)

  useEffect(() => {
    if (!isNote) {
      fetch('/api/admin/posts?limit=200&type=post')
        .then(r => r.json())
        .then(data => {
          const series = Array.from(new Set<string>(
            (data.posts || [])
              .map((p: { series?: string }) => p.series)
              .filter(Boolean)
          ))
          setExistingSeries(series.sort())
        })
        .catch(() => {})
    }
  }, [isNote])

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
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const editorWrapRef = useRef<HTMLDivElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const contentColumnRef = useRef<HTMLDivElement>(null)

  // Rewrite state
  const [rewrite, setRewrite] = useState<RewriteState | null>(null)
  const [showRewritePrompt, setShowRewritePrompt] = useState(false)
  const [undoStack, setUndoStack] = useState<string[]>([])
  const rewriteAbortRef = useRef<AbortController | null>(null)

  // Asking overlay
  const [askingRange, setAskingRange] = useState<{ start: number; end: number } | null>(null)
  const [previewSelRect, setPreviewSelRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null)

  // Image upload
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cursorPosRef = useRef<number>(0)
  const [uploading, setUploading] = useState(false)
  const pendingImagesRef = useRef<Map<string, File>>(new Map())

  const abortRef = useRef<AbortController | null>(null)
  const msgEndRef = useRef<HTMLDivElement>(null)
  const chatInputRef = useRef<HTMLTextAreaElement>(null)

  // ─── AUTOSAVE ──────────────────────────────────────────────
  const { saveStatus, lastSavedAt } = useAutosave({
    postId: post?.id,
    data: {
      title: form.title,
      content: form.content,
      description: form.description,
      thumbnail: form.thumbnail,
      tags: form.tags,
      category: form.category,
      series: form.series || '',
      seriesOrder: form.seriesOrder ?? null,
      published: form.published,
      featured: form.featured,
    },
  })

  // ─── AUTO SLUG ──────────────────────────────────────────────
  useEffect(() => {
    if (!slugManual && form.title) {
      setForm((f) => ({ ...f, slug: slugify(form.title) }))
    }
  }, [form.title, slugManual])

  // ─── MASCOT ──────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => setFrame(f => f + 1), 300)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    fetch('/api/admin/mascot')
      .then(r => r.json())
      .then(d => { if (d.background) setBackground(d.background) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, streamingText])

  // ─── UNDO HANDLER ──────────────────────────────────────────
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

  // ─── TEXT SELECTION ────────────────────────────────────────
  const handleTextSelect = useCallback(() => {
    if (rewrite?.active) return
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd

    // Update cursor position for status bar
    const textBefore = textarea.value.substring(0, start)
    const lines = textBefore.split('\n')
    setCursorLine(lines.length)
    setCursorCol(lines[lines.length - 1].length + 1)

    if (start === end) {
      setShowTooltip(false)
      setSelectedText('')
      setSelectionRange(null)
      return
    }

    const text = textarea.value.substring(start, end).trim()
    if (text.length < 5) {
      setShowTooltip(false)
      return
    }

    setSelectedText(text)
    setSelectionRange({ start, end })
    setShowTooltip(true)
  }, [rewrite])

  // Preview text selection
  const handlePreviewSelect = useCallback(() => {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed || !previewRef.current) {
      setShowTooltip(false)
      setSelectedText('')
      setSelectionRange(null)
      return
    }

    const text = selection.toString().trim()
    if (text.length < 5) { setShowTooltip(false); return }

    const rawContent = form.content
    const idx = rawContent.indexOf(text)
    if (idx !== -1) {
      setSelectionRange({ start: idx, end: idx + text.length })
    } else {
      const searchKey = text.substring(0, 30)
      const fuzzyIdx = rawContent.indexOf(searchKey)
      if (fuzzyIdx !== -1) {
        const endKey = text.substring(Math.max(0, text.length - 30))
        const endIdx = rawContent.indexOf(endKey, fuzzyIdx)
        setSelectionRange({ start: fuzzyIdx, end: endIdx !== -1 ? endIdx + endKey.length : fuzzyIdx + text.length })
      } else {
        setSelectionRange(null)
      }
    }

    setSelectedText(text)
    setPreviewSelRect(null)
    setShowTooltip(true)
  }, [form.content])

  // Hide tooltip on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (showTooltip && !(e.target as HTMLElement).closest('.pe2-floating-toolbar') && !(e.target as HTMLElement).closest('.pe-rewrite-prompt')) {
        setShowTooltip(false)
        setShowRewritePrompt(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showTooltip])

  // ─── STREAM RESPONSE ──────────────────────────────────────
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

  // ─── STREAM REWRITE ────────────────────────────────────────
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
      { role: 'user', content: `Original text:\n"${originalText}"\n\nInstruction: ${instruction}` },
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

  const cancelRewrite = useCallback(() => {
    if (rewriteAbortRef.current) {
      rewriteAbortRef.current.abort()
      rewriteAbortRef.current = null
    }
  }, [])

  const handleRewriteClick = useCallback(() => {
    if (!selectionRange) return
    setShowTooltip(false)
    setShowRewritePrompt(true)
  }, [selectionRange])

  const handleRewriteSubmit = useCallback((instruction: string) => {
    if (!selectionRange) return
    setShowRewritePrompt(false)
    if (previewMode) setPreviewMode(false)
    setTimeout(() => {
      streamRewrite(instruction, selectionRange.start, selectionRange.end)
    }, previewMode ? 100 : 0)
  }, [selectionRange, streamRewrite, previewMode])

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

  // ─── SEND MESSAGE ──────────────────────────────────────────
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
      // Include more content context (up to 2000 chars)
      form.content ? `Full post content (first 2000 chars):\n${form.content.substring(0, 2000)}` : '',
    ].filter(Boolean).join('\n')

    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({
        role: m.role,
        content: m.reference ? `[Reference from post]:\n"${m.reference}"\n\n${m.text}` : m.text,
      })),
      { role: 'user', content: reference ? `[Reference from post]:\n"${reference}"\n\n${userText}` : userText },
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
      chatInputRef.current?.focus()
    }
  }, [isStreaming, messages, form.title, form.description, form.tags, form.content, selectionRange, streamResponse])

  const handleAskAboutSelection = useCallback(() => {
    if (!selectedText) return
    setShowTooltip(false)
    const userMsg: ChatMsg = { role: 'user', text: '', reference: selectedText }
    setMessages(prev => [...prev, userMsg])
    setSelectedText('')
    setTimeout(() => chatInputRef.current?.focus(), 100)
  }, [selectedText])

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

  const handleQuickAction = useCallback((action: string) => {
    const contentSnippet = form.content.substring(0, 2000)
    const prompts: Record<string, string> = {
      'improve': `Review and suggest improvements for this content:\n"${contentSnippet}..."`,
      'summarize': `Write a concise summary/excerpt for this blog post based on: "${contentSnippet}..."`,
      'grammar': `Check for grammar and style issues in this content:\n"${contentSnippet}..."`,
      'seo': `Generate an SEO-optimized meta description and suggest title improvements for a post titled "${form.title}" about: ${form.description || contentSnippet.substring(0, 200)}`,
      'outline': `Generate a section outline for a blog post titled "${form.title}". Return the outline as markdown headings (## and ###).`,
    }
    sendMessage(prompts[action] || action)
  }, [form.content, form.title, form.description, sendMessage])

  // ─── FORMATTING ────────────────────────────────────────────
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

  // ─── IMAGE HANDLING ────────────────────────────────────────
  const stageImage = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) { setToast({ message: 'Only image files are allowed', type: 'error' }); return }
    if (file.size > 10 * 1024 * 1024) { setToast({ message: 'Image must be under 10MB', type: 'error' }); return }

    const blobUrl = URL.createObjectURL(file)
    pendingImagesRef.current.set(blobUrl, file)

    const alt = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
    const markdown = `![${alt}](${blobUrl})`
    const pos = cursorPosRef.current
    const before = form.content.substring(0, pos)
    const after = form.content.substring(pos)
    const separator = before.endsWith('\n') || before === '' ? '' : '\n\n'
    setForm(f => ({ ...f, content: before + separator + markdown + '\n' + after }))
    setToast({ message: 'Image added! Will upload on save.', type: 'success' })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [form.content])

  const uploadPendingImages = useCallback(async (content: string): Promise<string> => {
    const pending = pendingImagesRef.current
    if (pending.size === 0) return content

    const toUpload = Array.from(pending.entries()).filter(([blobUrl]) => content.includes(blobUrl))
    if (toUpload.length === 0) {
      Array.from(pending.keys()).forEach(url => URL.revokeObjectURL(url))
      pending.clear()
      return content
    }

    let updated = content
    for (const [blobUrl, file] of toUpload) {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', 'lxqdss4t')
      formData.append('folder', 'blog')

      const res = await fetch('https://api.cloudinary.com/v1_1/dpust3pte/image/upload', { method: 'POST', body: formData })
      if (!res.ok) throw new Error(`Failed to upload image: ${file.name}`)
      const data = await res.json()
      updated = updated.split(blobUrl).join(data.secure_url as string)
      URL.revokeObjectURL(blobUrl)
      pending.delete(blobUrl)
    }

    Array.from(pending.keys()).forEach(url => URL.revokeObjectURL(url))
    pending.clear()
    return updated
  }, [])

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        const textarea = textareaRef.current
        cursorPosRef.current = textarea ? textarea.selectionStart : form.content.length
        const file = item.getAsFile()
        if (file) stageImage(file)
        return
      }
    }
  }, [stageImage, form.content])

  const handleDrop = useCallback((e: React.DragEvent) => {
    const file = e.dataTransfer?.files?.[0]
    if (file && file.type.startsWith('image/')) {
      e.preventDefault()
      const textarea = textareaRef.current
      cursorPosRef.current = textarea ? textarea.selectionStart : form.content.length
      stageImage(file)
    }
  }, [stageImage, form.content])

  // ─── SLASH COMMANDS ────────────────────────────────────────
  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (rewrite?.active) return
    const value = e.target.value
    setForm(f => ({ ...f, content: value }))

    // Detect slash command
    const textarea = e.target
    const pos = textarea.selectionStart
    const textBefore = value.substring(0, pos)
    const lastNewline = textBefore.lastIndexOf('\n')
    const lineStart = lastNewline + 1
    const lineText = textBefore.substring(lineStart)

    if (lineText.startsWith('/')) {
      const query = lineText.substring(1)
      slashStartRef.current = lineStart
      setSlashQuery(query)
      setSlashActive(true)

      // Position the menu
      const lines = textBefore.split('\n').length
      const lineHeight = parseFloat(getComputedStyle(textarea).lineHeight) || 28
      const scrollTop = textarea.scrollTop
      const paddingTop = parseFloat(getComputedStyle(textarea).paddingTop) || 0
      setSlashPos({
        top: paddingTop + lines * lineHeight - scrollTop + 4,
        left: 0,
      })
    } else {
      if (slashActive) {
        setSlashActive(false)
        slashStartRef.current = -1
      }
    }
  }, [rewrite, slashActive])

  const handleSlashSelect = useCallback((command: { action: string }) => {
    setSlashActive(false)
    const textarea = textareaRef.current
    if (!textarea) return

    const start = slashStartRef.current
    if (start < 0) return

    const pos = textarea.selectionStart
    const before = form.content.substring(0, start)
    const after = form.content.substring(pos)

    if (command.action === '__image__') {
      cursorPosRef.current = start
      fileInputRef.current?.click()
      setForm(f => ({ ...f, content: before + after }))
    } else if (command.action === '__ai_ask__') {
      setForm(f => ({ ...f, content: before + after }))
      setTimeout(() => chatInputRef.current?.focus(), 100)
    } else if (command.action === '__ai_continue__') {
      setForm(f => ({ ...f, content: before + after }))
      handleQuickAction('improve')
    } else if (command.action === '__ai_outline__') {
      setForm(f => ({ ...f, content: before + after }))
      handleQuickAction('outline')
    } else {
      // Insert markdown
      const newContent = before + command.action + after
      setForm(f => ({ ...f, content: newContent }))
      setTimeout(() => {
        textarea.focus()
        const newPos = start + command.action.length
        textarea.setSelectionRange(newPos, newPos)
      }, 0)
    }
  }, [form.content, handleQuickAction])

  // ─── KEYBOARD SHORTCUTS ────────────────────────────────────
  useKeyboardShortcuts({
    textareaRef,
    onFormat: insertMarkdown,
    onSlashCommand: () => {},
    onAIInline: handleAskAboutSelection,
    onSettingsToggle: () => setSettingsOpen(o => !o),
    onSave: () => {}, // autosave handles this
    enabled: !slashActive,
  })

  // ─── SUBMIT ────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      let finalContent = form.content
      if (pendingImagesRef.current.size > 0) {
        setUploading(true)
        setToast({ message: 'Uploading images...', type: 'success' })
        finalContent = await uploadPendingImages(form.content)
        setForm(f => ({ ...f, content: finalContent }))
        setUploading(false)
      }

      const url = post?.id
        ? `/api/admin/${isNote ? 'notes' : 'posts'}/${post.id}`
        : `/api/admin/${isNote ? 'notes' : 'posts'}`
      const method = post?.id ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, content: finalContent }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to save')
      }
      setToast({ message: `${isNote ? 'Note' : 'Post'} saved successfully`, type: 'success' })
      setTimeout(() => { router.push(`/admin/${isNote ? 'notes' : 'posts'}`); router.refresh() }, 800)
    } catch (err) {
      setToast({ message: String(err instanceof Error ? err.message : err), type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  // ─── RENDER MESSAGES ───────────────────────────────────────
  const renderMessageContent = useCallback((msg: ChatMsg) => {
    if (!msg.text) return null
    const segments = parseMessageSegments(msg.text)
    const hasSuggestions = hasSuggestBlocks(msg.text)

    if (!hasSuggestions) {
      return <div className="pe2-msg-bubble">{msg.text}</div>
    }

    return (
      <>
        {segments.map((seg, j) => {
          if (seg.type === 'text') {
            return <div key={j} className="pe2-msg-bubble">{seg.content}</div>
          }
          return (
            <div key={j} className="pe2-suggest-card">
              <div className="pe2-suggest-label">Suggested text</div>
              <p className="pe2-suggest-text">{seg.content}</p>
              <div className="pe2-suggest-actions">
                <button type="button" className="pe2-suggest-apply" onClick={() => handleApplyToEditor(seg.content)} disabled={!!rewrite?.active}>
                  Apply
                </button>
                <button type="button" className="pe2-suggest-dismiss">Dismiss</button>
              </div>
            </div>
          )
        })}
      </>
    )
  }, [handleApplyToEditor, rewrite])

  const mascotState = isStreaming || rewrite?.active ? 'writing' : messages.length > 0 ? 'presenting' : 'idle'
  const showAskingOverlay = isStreaming && askingRange && !rewrite?.active

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="pe2-page">
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}

      {/* ─── TOP BAR ──────────────────────────────────────── */}
      <div className="pe2-topbar">
        <div className="pe2-topbar-left">
          <Link href={`/admin/${isNote ? 'notes' : 'posts'}`} className="pe2-topbar-back">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 4l-4 4 4 4" strokeLinecap="round" strokeLinejoin="round"/></svg>
            {isNote ? 'Notes' : 'Posts'}
          </Link>
          <span className="pe2-topbar-sep">/</span>
          <span className="pe2-topbar-current">{post?.id ? 'Edit' : 'New'} {isNote ? 'Note' : 'Post'}</span>
        </div>

        <div className="pe2-topbar-actions">
          {rewrite?.active && (
            <button type="button" onClick={cancelRewrite} className="pe2-topbar-btn" style={{ color: '#e53935', borderColor: 'rgba(229,57,53,0.3)' }}>
              Cancel Rewrite
            </button>
          )}
          <button
            type="button"
            className={`pe2-topbar-btn ${previewMode ? 'pe2-topbar-btn--active' : ''}`}
            onClick={() => setPreviewMode(!previewMode)}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"/><circle cx="8" cy="8" r="2"/></svg>
            Preview
          </button>
          <button
            type="button"
            className={`pe2-topbar-btn ${settingsOpen ? 'pe2-topbar-btn--active' : ''}`}
            onClick={() => setSettingsOpen(!settingsOpen)}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="1"/><circle cx="13" cy="8" r="1"/><circle cx="3" cy="8" r="1"/></svg>
            Settings
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !!rewrite?.active}
            className="pe2-topbar-publish"
          >
            {uploading ? 'Uploading...' : loading ? 'Saving...' : post?.id ? 'Save' : form.published ? 'Publish' : 'Save Draft'}
          </button>
        </div>
      </div>

      {/* ─── BODY ─────────────────────────────────────────── */}
      <div className="pe2-body">
        {/* ─── WRITING CANVAS ──────────────────────────────── */}
        <div className="pe2-canvas">
          <div className="pe2-scroll-area">
            <div className="pe2-content-column" ref={contentColumnRef}>
              {/* Title */}
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                className="pe2-title-input"
                placeholder={isNote ? 'Note title' : 'Post title'}
              />

              {/* Slug row */}
              <div className="pe2-slug-row">
                {editSlug ? (
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => { setSlugManual(true); setForm(f => ({ ...f, slug: e.target.value })) }}
                    onBlur={() => setEditSlug(false)}
                    className="pe2-slug-input"
                    autoFocus
                  />
                ) : (
                  <>
                    <span className="pe2-slug-text">/{isNote ? 'notes' : 'blog'}/{form.slug || '...'}</span>
                    <button type="button" className="pe2-slug-edit" onClick={() => setEditSlug(true)}>Edit</button>
                  </>
                )}
                {!form.published && <span className="pe2-draft-badge">DRAFT</span>}
              </div>

              {/* Description (posts only) */}
              {!isNote && (
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                  className="pe2-desc-input"
                  placeholder="Short description for preview cards and SEO..."
                />
              )}

              {/* Editor / Preview */}
              <div ref={editorWrapRef} style={{ position: 'relative', flex: 1 }}>
                {previewMode ? (
                  <div className="pe2-preview" ref={previewRef} onMouseUp={handlePreviewSelect}>
                    {form.content.trim() ? (
                      <MarkdownRenderer content={form.content} className="article-body" allowBlobUrls />
                    ) : (
                      <p className="pe2-preview-empty">Nothing to preview yet.</p>
                    )}
                  </div>
                ) : (
                  <>
                    <textarea
                      ref={textareaRef}
                      required
                      value={form.content}
                      onChange={handleContentChange}
                      onMouseUp={handleTextSelect}
                      onKeyUp={handleTextSelect}
                      onPaste={handlePaste}
                      onDrop={handleDrop}
                      onDragOver={(e) => { if (e.dataTransfer?.types?.includes('Files')) e.preventDefault() }}
                      className={`pe2-textarea${rewrite?.active ? ' pe2-textarea--rewriting' : ''}`}
                      readOnly={!!rewrite?.active}
                      placeholder="Start writing, or press / for commands..."
                    />

                    {/* Floating toolbar on selection */}
                    <FloatingToolbar
                      editorRef={textareaRef}
                      containerRef={contentColumnRef}
                      onFormat={insertMarkdown}
                      onAIClick={handleAskAboutSelection}
                      visible={showTooltip && !showRewritePrompt && !rewrite?.active}
                    />

                    {/* Slash command menu */}
                    {slashActive && (
                      <SlashCommandMenu
                        query={slashQuery}
                        position={slashPos}
                        onSelect={handleSlashSelect}
                        onClose={() => setSlashActive(false)}
                      />
                    )}

                    {/* Rewrite overlay */}
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

                    {/* Asking overlay */}
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

                    {/* Rewrite prompt */}
                    {showRewritePrompt && selectionRange && (
                      <RewritePrompt
                        position={{ top: 0, left: 0 }}
                        onSubmit={handleRewriteSubmit}
                        onCancel={() => setShowRewritePrompt(false)}
                      />
                    )}
                  </>
                )}
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => { const file = e.target.files?.[0]; if (file) stageImage(file) }}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          {/* Status Bar */}
          <EditorStatusBar
            content={form.content}
            saveStatus={saveStatus}
            lastSavedAt={lastSavedAt}
            cursorLine={cursorLine}
            cursorCol={cursorCol}
          />
        </div>

        {/* ─── AI SIDEBAR ─────────────────────────────────── */}
        <aside className={`pe2-ai-sidebar ${!aiSidebarOpen ? 'pe2-ai-sidebar--collapsed' : ''}`}>
          {/* Header */}
          <div className="pe2-ai-header">
            <div className="pe2-ai-identity">
              <div className="pe2-ai-avatar">🦀</div>
              <span className="pe2-ai-name">Claw&apos;d</span>
              <div className="pe2-ai-dot" />
            </div>
            <button type="button" className="pe2-ai-toggle" onClick={() => setAiSidebarOpen(false)} title="Collapse sidebar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M13 17l5-5-5-5M6 17l5-5-5-5"/></svg>
            </button>
          </div>

          {/* Mascot */}
          <div style={{ padding: '8px 16px', borderBottom: '1px solid rgba(59,50,37,0.06)' }}>
            <div style={{ height: '80px', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
              <div style={{ position: 'absolute', inset: 0 }}>
                {background === 'space' ? <SpaceBackground /> : background === 'garden' ? <GardenBackground /> : <OfficeBackground />}
              </div>
              <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)' }}>
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
          </div>

          {/* Quick Actions */}
          <div className="pe2-quick-actions">
            <span className="pe2-section-label">Quick Actions</span>
            <div className="pe2-action-chips">
              <button type="button" className="pe2-action-chip" onClick={() => handleQuickAction('improve')}>Improve Writing</button>
              <button type="button" className="pe2-action-chip" onClick={() => handleQuickAction('summarize')}>Summarize</button>
              <button type="button" className="pe2-action-chip" onClick={() => handleQuickAction('grammar')}>Fix Grammar</button>
              <button type="button" className="pe2-action-chip" onClick={() => handleQuickAction('seo')}>Generate SEO</button>
              <button type="button" className="pe2-action-chip" onClick={() => handleQuickAction('outline')}>Outline from Title</button>
            </div>
          </div>

          {/* Conversation */}
          <div className="pe2-convo">
            <div className="pe2-messages">
              {messages.length === 0 && !streamingText && (
                <div className="pe2-empty-msg">
                  <p style={{ marginBottom: '8px' }}>How to use Claw&apos;d:</p>
                  <p>1. <strong>Select text</strong> in the editor → click AI in the floating toolbar</p>
                  <p>2. Use a <strong>Quick Action</strong> above for whole-post help</p>
                  <p>3. Or just <strong>type a question</strong> below!</p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`pe2-msg pe2-msg--${msg.role}`}>
                  {msg.reference && (
                    <div className="pe2-reference-card">
                      <div className="pe2-reference-label">Selected Reference</div>
                      <p className="pe2-reference-text">{msg.reference.substring(0, 200)}{msg.reference.length > 200 ? '...' : ''}</p>
                    </div>
                  )}
                  {msg.role === 'assistant' ? renderMessageContent(msg) : (
                    msg.text && <div className="pe2-msg-bubble">{msg.text}</div>
                  )}
                </div>
              ))}
              {streamingText && (
                <div className="pe2-msg pe2-msg--assistant">
                  <div className="pe2-msg-bubble">{streamingText}<span className="pe2-cursor">▊</span></div>
                </div>
              )}
              <div ref={msgEndRef} />
            </div>
          </div>

          {/* Chat Input */}
          <div className="pe2-chat-input">
            <div className="pe2-chat-input-row">
              <textarea
                ref={chatInputRef}
                className="pe2-chat-textarea"
                placeholder="Ask Claw'd anything..."
                value={replyInput}
                onChange={e => setReplyInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply() }
                }}
                disabled={isStreaming}
                rows={1}
              />
              <button type="button" className="pe2-chat-send" onClick={handleReply} disabled={isStreaming || !replyInput.trim()}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M14 2L7 9M14 2l-5 12-2-5-5-2z"/></svg>
              </button>
            </div>
            <div className="pe2-chat-hint">
              <span>Tip: Select text then press</span>
              <span className="pe2-kbd">Ctrl+K</span>
              <span>for inline AI</span>
            </div>
          </div>
        </aside>
      </div>

      {/* ─── SETTINGS DRAWER ──────────────────────────────── */}
      <SettingsDrawer
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        isNote={isNote}
        slug={form.slug}
        description={form.description}
        thumbnail={form.thumbnail}
        tags={form.tags}
        category={form.category}
        series={form.series || ''}
        seriesOrder={form.seriesOrder ?? null}
        published={form.published}
        featured={form.featured}
        existingSeries={existingSeries}
        onSlugChange={(slug) => { setSlugManual(true); setForm(f => ({ ...f, slug })) }}
        onDescriptionChange={(description) => setForm(f => ({ ...f, description }))}
        onThumbnailChange={(thumbnail) => setForm(f => ({ ...f, thumbnail }))}
        onTagsChange={(tags) => setForm(f => ({ ...f, tags }))}
        onCategoryChange={(category) => setForm(f => ({ ...f, category }))}
        onSeriesChange={(series) => setForm(f => ({ ...f, series }))}
        onSeriesOrderChange={(seriesOrder) => setForm(f => ({ ...f, seriesOrder }))}
        onPublishedChange={(published) => setForm(f => ({ ...f, published }))}
        onFeaturedChange={(featured) => setForm(f => ({ ...f, featured }))}
      />

      {/* Help / Cheatsheet */}
      <EditorCheatsheet />
    </div>
  )
}
