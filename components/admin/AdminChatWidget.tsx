'use client'

import { useEffect, useState, useRef, useCallback, memo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { MiniClawd } from '@/components/admin/DashboardMascot'

/* ── Types ─────────────────────────────────────────────────── */

interface ChatMessage {
  id: number
  role: 'user' | 'clawd'
  text: string
}

/* ── Memoized components ───────────────────────────────────── */

const ChatMarkdown = memo(function ChatMarkdown({ text }: { text: string }) {
  if (!text) return null
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
      {text}
    </ReactMarkdown>
  )
})

const ChatMsg = memo(function ChatMsg({ msg }: { msg: ChatMessage }) {
  return (
    <div className={`adm-chat-msg adm-chat-msg--${msg.role}`}>
      {msg.role === 'clawd' && <span className="adm-chat-msg-avatar"><MiniClawd size={18} /></span>}
      <div className={`adm-chat-bubble adm-chat-bubble--${msg.role}`}>
        <ChatMarkdown text={msg.text} />
      </div>
    </div>
  )
})

/* ── Chat Widget ───────────────────────────────────────────── */

export default function AdminChatWidget() {
  const [displayName, setDisplayName] = useState("Claw'd")
  const [chatOpen, setChatOpen] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window === 'undefined') return [{ id: 0, role: 'clawd', text: "Hey! I'm Claw'd 🦀 What's up?" }]
    try {
      const saved = localStorage.getItem('mascot-chat-history')
      if (saved) {
        const parsed = JSON.parse(saved) as ChatMessage[]
        if (parsed.length > 0) return parsed
      }
    } catch { /* ignore */ }
    return [{ id: 0, role: 'clawd', text: "Hey! I'm Claw'd 🦀 What's up?" }]
  })
  const [isTyping, setIsTyping] = useState(false)
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const messagesRef = useRef<HTMLDivElement>(null)
  const msgIdRef = useRef((() => {
    if (typeof window === 'undefined') return 1
    try {
      const saved = localStorage.getItem('mascot-chat-history')
      if (saved) {
        const parsed = JSON.parse(saved) as ChatMessage[]
        return Math.max(...parsed.map(m => m.id), 0) + 1
      }
    } catch { /* ignore */ }
    return 1
  })())

  // Fetch mascot display name
  useEffect(() => {
    fetch('/api/admin/mascot')
      .then((res) => res.json())
      .then((data) => {
        if (data.displayName) setDisplayName(data.displayName)
      })
      .catch(() => {})
  }, [])

  // Persist chat history
  useEffect(() => {
    localStorage.setItem('mascot-chat-history', JSON.stringify(messages))
  }, [messages])

  // Scroll to bottom when chat is opened
  useEffect(() => {
    if (chatOpen) {
      requestAnimationFrame(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'instant' })
      })
    }
  }, [chatOpen])

  // Auto-scroll to bottom (only if user is near bottom)
  useEffect(() => {
    const el = messagesRef.current
    if (!el) return
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100
    if (isNearBottom) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isTyping])

  const handleScroll = useCallback(() => {
    const el = messagesRef.current
    if (!el) return
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100
    setShowScrollBtn(!isNearBottom)
  }, [])

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const clearChat = useCallback(() => {
    const greeting: ChatMessage = { id: 0, role: 'clawd', text: `Hey! I'm ${displayName} 🦀 What's up?` }
    setMessages([greeting])
    msgIdRef.current = 1
    localStorage.removeItem('mascot-chat-history')
  }, [displayName])

  // Emit events for mascot integration (dashboard listens)
  const emitChatEvent = useCallback((type: string) => {
    window.dispatchEvent(new CustomEvent('mascot-chat', { detail: { type } }))
  }, [])

  const handleSend = useCallback(async () => {
    const text = chatInput.trim()
    if (!text) return
    const userMsg: ChatMessage = { id: msgIdRef.current++, role: 'user', text }
    setMessages((prev) => [...prev, userMsg])
    setChatInput('')
    setIsTyping(true)

    emitChatEvent('thinking')

    const apiMessages = [...messages.filter(m => m.role === 'user' || m.role === 'clawd').map(m => ({
      role: m.role === 'user' ? 'user' as const : 'assistant' as const,
      content: m.text,
    })), { role: 'user' as const, content: text }]

    try {
      const res = await fetch('/api/admin/mascot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Connection failed' }))
        setMessages((prev) => [...prev, {
          id: msgIdRef.current++, role: 'clawd',
          text: `⚠️ ${err.error || 'Failed to connect to OpenClaw'}`,
        }])
        setIsTyping(false)
        emitChatEvent('done')
        return
      }

      const reader = res.body?.getReader()
      if (!reader) throw new Error('No response body')

      const replyId = msgIdRef.current++
      setMessages((prev) => [...prev, { id: replyId, role: 'clawd', text: '' }])
      setIsTyping(false)

      emitChatEvent('replying')

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') break

          try {
            const parsed = JSON.parse(data)
            const delta = parsed.choices?.[0]?.delta?.content
            if (delta) {
              setMessages((prev) => prev.map(m =>
                m.id === replyId ? { ...m, text: m.text + delta } : m
              ))
            }
          } catch { /* skip malformed chunks */ }
        }
      }

      emitChatEvent('done')
    } catch {
      setMessages((prev) => [...prev, {
        id: msgIdRef.current++, role: 'clawd',
        text: '⚠️ Failed to connect to OpenClaw gateway',
      }])
      setIsTyping(false)
      emitChatEvent('done')
    }
  }, [chatInput, messages, emitChatEvent])

  return (
    <div className="adm-chat-widget">
      {/* Toggle FAB */}
      {!chatOpen && (
        <button className="adm-chat-fab" onClick={() => setChatOpen(true)}>
          <span className="adm-chat-fab-emoji"><MiniClawd size={28} /></span>
        </button>
      )}

      {/* Chat panel */}
      {chatOpen && (
        <div className="adm-chat">
          <div className="adm-chat-header">
            <div className="adm-chat-header-info">
              <span className="adm-chat-avatar"><MiniClawd size={22} /></span>
              <div>
                <span className="adm-chat-name">{displayName}</span>
                <span className="adm-chat-status">
                  <span className="adm-chat-status-dot" />
                  Online
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button className="adm-chat-clear" onClick={clearChat} title="Clear chat">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M2 4h12M5.33 4V2.67a1.33 1.33 0 011.34-1.34h2.66a1.33 1.33 0 011.34 1.34V4M12.67 4v9.33a1.33 1.33 0 01-1.34 1.34H4.67a1.33 1.33 0 01-1.34-1.34V4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button className="adm-chat-close" onClick={() => setChatOpen(false)}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>

          <div className="adm-chat-messages-wrap">
            <div className="adm-chat-messages" ref={messagesRef} onScroll={handleScroll}>
              {messages.map((msg) => (
                <ChatMsg key={msg.id} msg={msg} />
              ))}
              {isTyping && (
                <div className="adm-chat-msg adm-chat-msg--clawd">
                  <span className="adm-chat-msg-avatar"><MiniClawd size={18} /></span>
                  <div className="adm-chat-bubble adm-chat-bubble--clawd adm-chat-typing">
                    <span className="adm-chat-dot" />
                    <span className="adm-chat-dot" />
                    <span className="adm-chat-dot" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            {showScrollBtn && (
              <button className="adm-chat-scroll-btn" onClick={scrollToBottom} title="Scroll to bottom">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
          </div>

          <form
            className="adm-chat-input-wrap"
            onSubmit={(e) => { e.preventDefault(); handleSend() }}
          >
            <textarea
              className="adm-chat-input"
              placeholder="Say something..."
              value={chatInput}
              onChange={(e) => {
                setChatInput(e.target.value)
                e.target.style.height = 'auto'
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
              }}
              onFocus={() => emitChatEvent('peeking')}
              onBlur={() => emitChatEvent('stop-peeking')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              rows={1}
              autoFocus
            />
            <button type="submit" className="adm-chat-send" disabled={!chatInput.trim()}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14 2L7 9M14 2l-5 12-2-5-5-2 12-5z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
