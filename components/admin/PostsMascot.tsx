'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { PixelSprite, OfficeBackground } from '@/components/admin/DashboardMascot'
import { SpaceBackground, GardenBackground } from '@/components/admin/MascotSprites'

interface PostInsight {
  id: string
  title: string
  slug: string
  published: boolean
  featured: boolean
  description?: string
  category?: string
  createdAt: string
  views?: number
  trend?: number
}

interface PostAnalytics {
  views: number
  uniqueVisitors: number
  wordCount: number
  avgReadMin: number
}

interface GlobalStats {
  totalViews: number
  totalUniqueVisitors: number
  totalPosts: number
}

interface ChatMsg {
  role: 'user' | 'assistant'
  text: string
}

interface Props {
  analyzingPost: PostInsight | null
  onAnalysisDone: () => void
}

export default function PostsMascot({ analyzingPost, onAnalysisDone }: Props) {
  const [frame, setFrame] = useState(0)
  const [background, setBackground] = useState<string>('office')
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null)
  const [currentAnalytics, setCurrentAnalytics] = useState<PostAnalytics | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [replyInput, setReplyInput] = useState('')
  const [analyticsCache, setAnalyticsCache] = useState<Record<string, PostAnalytics>>({})

  // Conversation per post slug
  const [conversations, setConversations] = useState<Record<string, ChatMsg[]>>({})
  const [streamingText, setStreamingText] = useState('')

  const abortRef = useRef<AbortController | null>(null)
  const lastAnalyzedSlug = useRef<string | null>(null)
  const insightEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const isAnalyzed = !!analyzingPost
  const currentConvo = analyzingPost ? (conversations[analyzingPost.slug] || []) : []

  // Fetch mascot settings (background)
  useEffect(() => {
    fetch('/api/admin/mascot')
      .then(r => r.json())
      .then(d => { if (d.background) setBackground(d.background) })
      .catch(() => {})
  }, [])

  // Animate mascot
  useEffect(() => {
    const interval = setInterval(() => setFrame(f => f + 1), 300)
    return () => clearInterval(interval)
  }, [])

  // Fetch global stats once on mount
  useEffect(() => {
    async function fetchGlobal() {
      try {
        const res = await fetch('/api/admin/analytics/post-views?global=true')
        if (res.ok) {
          const data = await res.json()
          setGlobalStats({
            totalViews: data.totalViews ?? 0,
            totalUniqueVisitors: data.totalUniqueVisitors ?? 0,
            totalPosts: data.totalPosts ?? 0,
          })
        }
      } catch { /* ignore */ }
    }
    fetchGlobal()
  }, [])

  // Fetch per-post analytics
  const fetchAnalytics = useCallback(async (slug: string): Promise<PostAnalytics> => {
    if (analyticsCache[slug]) return analyticsCache[slug]
    try {
      const res = await fetch(`/api/admin/analytics/post-views?slug=${encodeURIComponent(slug)}`)
      if (res.ok) {
        const data = await res.json()
        const analytics: PostAnalytics = {
          views: data.views ?? 0,
          uniqueVisitors: data.uniqueVisitors ?? 0,
          wordCount: data.wordCount ?? 0,
          avgReadMin: data.avgReadMin ?? 1,
        }
        setAnalyticsCache(prev => ({ ...prev, [slug]: analytics }))
        return analytics
      }
    } catch { /* ignore */ }
    return { views: 0, uniqueVisitors: 0, wordCount: 0, avgReadMin: 1 }
  }, [analyticsCache])

  // Reset when no analyzing post
  useEffect(() => {
    if (!analyzingPost) {
      setCurrentAnalytics(null)
      setStreamingText('')
      setReplyInput('')
    }
  }, [analyzingPost])

  // Auto-scroll insight area when new content appears
  useEffect(() => {
    insightEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentConvo.length, streamingText])

  // Build the system context prompt for the post
  const buildSystemContext = useCallback((post: PostInsight, analytics: PostAnalytics) => {
    return [
      `You are analyzing a blog post. Keep responses concise (2-3 sentences). Respond in the same language as the post title.`,
      `Post title: "${post.title}"`,
      `Slug: /blog/${post.slug}`,
      `Status: ${post.published ? 'Published' : 'Draft'}`,
      post.featured ? 'Featured: Yes (pinned on homepage)' : '',
      `Category: ${post.category || 'uncategorized'}`,
      post.description ? `Description: ${post.description}` : '',
      `Created: ${post.createdAt}`,
      `Total Page Views: ${analytics.views}`,
      `Unique Visitors: ${analytics.uniqueVisitors}`,
      `Word Count: ${analytics.wordCount}`,
      `Estimated Avg Read Time: ~${analytics.avgReadMin} min (NOTE: estimated from word count at 200 wpm, NOT real reading duration)`,
    ].filter(Boolean).join('\n')
  }, [])

  // Stream a response from OpenClaw
  const streamResponse = useCallback(async (
    post: PostInsight,
    messages: { role: string; content: string }[],
    signal: AbortSignal,
  ) => {
    const res = await fetch('/api/admin/mascot/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
      signal,
    })

    if (!res.ok) {
      throw new Error('OpenClaw error')
    }

    const reader = res.body?.getReader()
    if (!reader) throw new Error('No stream')

    const decoder = new TextDecoder()
    let accumulated = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n')

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6).trim()
        if (data === '[DONE]') continue

        try {
          const parsed = JSON.parse(data)
          const delta = parsed.choices?.[0]?.delta?.content
          if (delta) {
            accumulated += delta
            setStreamingText(accumulated)
          }
        } catch { /* skip */ }
      }
    }

    return accumulated
  }, [])

  // Initial analysis when analyzingPost changes
  useEffect(() => {
    if (!analyzingPost) return

    const slug = analyzingPost.slug

    // If we already have a conversation for this post, just show it
    if (conversations[slug]?.length) {
      fetchAnalytics(slug).then(a => setCurrentAnalytics(a))
      return
    }

    if (abortRef.current) abortRef.current.abort()

    lastAnalyzedSlug.current = slug
    const controller = new AbortController()
    abortRef.current = controller

    const runAnalysis = async () => {
      const analytics = await fetchAnalytics(slug)
      setCurrentAnalytics(analytics)
      if (lastAnalyzedSlug.current !== slug) return

      setIsStreaming(true)
      setStreamingText('')

      const systemContext = buildSystemContext(analyzingPost, analytics)
      const messages = [
        { role: 'system', content: systemContext },
        { role: 'user', content: 'Analyze this blog post — give insights on performance, content quality, and actionable suggestions.' },
      ]

      try {
        const result = await streamResponse(analyzingPost, messages, controller.signal)

        if (lastAnalyzedSlug.current === slug && result) {
          setConversations(prev => ({
            ...prev,
            [slug]: [{ role: 'assistant', text: result }],
          }))
          setStreamingText('')
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return
        setConversations(prev => ({
          ...prev,
          [slug]: [{ role: 'assistant', text: 'Could not get AI insight — check OpenClaw configuration.' }],
        }))
        setStreamingText('')
      } finally {
        if (lastAnalyzedSlug.current === slug) {
          setIsStreaming(false)
        }
      }
    }

    runAnalysis()
    return () => { controller.abort() }
  }, [analyzingPost?.id])

  // Send follow-up reply
  const handleReply = useCallback(async () => {
    if (!analyzingPost || !replyInput.trim() || isStreaming) return

    const slug = analyzingPost.slug
    const userMsg = replyInput.trim()
    setReplyInput('')

    // Add user message to conversation
    const updatedConvo = [...(conversations[slug] || []), { role: 'user' as const, text: userMsg }]
    setConversations(prev => ({ ...prev, [slug]: updatedConvo }))

    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setIsStreaming(true)
    setStreamingText('')

    const analytics = currentAnalytics || await fetchAnalytics(slug)
    const systemContext = buildSystemContext(analyzingPost, analytics)

    // Build full message history for context
    const messages = [
      { role: 'system', content: systemContext },
      // Initial analysis prompt
      { role: 'user', content: 'Analyze this blog post — give insights on performance, content quality, and actionable suggestions.' },
      // Full conversation history
      ...updatedConvo.map(m => ({ role: m.role, content: m.text })),
    ]

    try {
      const result = await streamResponse(analyzingPost, messages, controller.signal)

      if (result) {
        setConversations(prev => ({
          ...prev,
          [slug]: [...(prev[slug] || []), { role: 'user', text: userMsg }, { role: 'assistant', text: result }],
        }))
        setStreamingText('')
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return
      setConversations(prev => ({
        ...prev,
        [slug]: [...(prev[slug] || []), { role: 'user', text: userMsg }, { role: 'assistant', text: 'Failed to get response.' }],
      }))
      setStreamingText('')
    } finally {
      setIsStreaming(false)
      inputRef.current?.focus()
    }
  }, [analyzingPost, replyInput, isStreaming, conversations, currentAnalytics, fetchAnalytics, buildSystemContext, streamResponse])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleReply()
    }
  }, [handleReply])

  const mascotState = isStreaming ? 'writing' : analyzingPost ? 'presenting' : 'idle'

  return (
    <div className="posts-intel-panel">
      {/* Mascot Scene */}
      <div className="posts-intel-mascot">
        <div className="adm-office-bg">
          {background === 'space' ? <SpaceBackground /> : background === 'garden' ? <GardenBackground /> : <OfficeBackground />}
        </div>
        <div className="posts-mascot-avatar">
          <PixelSprite
            state={mascotState}
            frame={frame}
            karatePhase="ready"
            presentPhase={analyzingPost ? 'point-1' : 'walk'}
            coffeePhase="walk"
            callingPhase="wave-1"
          />
        </div>
      </div>

      {/* Name + Status */}
      <div className="posts-intel-title-area">
        <div className="posts-intel-name-row">
          <span className="posts-mascot-name">Claw&apos;d</span>
          <div className="posts-mascot-status">
            <span className="posts-mascot-dot" />
            <span>{isStreaming ? 'Thinking...' : analyzingPost ? 'Analyzing' : 'Active'}</span>
          </div>
        </div>
        <span className="posts-mascot-role">Post Intelligence</span>
      </div>

      {/* Analyzing post title */}
      {analyzingPost && (
        <div className="posts-intel-target">
          <span className="posts-intel-target-title">
            {analyzingPost.title}
            {analyzingPost.featured && (
              <svg width="10" height="10" viewBox="0 0 16 16" fill="#c4953a" stroke="none" style={{ marginLeft: 4, verticalAlign: 'middle' }}><path d="M8 1l2.2 4.6L15 6.3l-3.5 3.4.8 4.9L8 12.3 3.7 14.6l.8-4.9L1 6.3l4.8-.7z"/></svg>
            )}
          </span>
          <span className="posts-intel-target-slug">/blog/{analyzingPost.slug}</span>
        </div>
      )}

      {/* Stats */}
      <div className="posts-mascot-stats">
        {isAnalyzed && currentAnalytics ? (
          <>
            <div className="posts-mascot-stat">
              <span className="posts-mascot-stat-label">Views</span>
              <div className="posts-mascot-stat-value">
                <span className="posts-mascot-stat-number">{currentAnalytics.views.toLocaleString()}</span>
                {currentAnalytics.views > 50 && (
                  <span className="posts-mascot-stat-trend posts-mascot-stat-trend--up">Popular</span>
                )}
              </div>
            </div>
            <div className="posts-mascot-stat">
              <span className="posts-mascot-stat-label">Avg Read</span>
              <div className="posts-mascot-stat-value">
                <span className="posts-mascot-stat-number">~{currentAnalytics.avgReadMin} min</span>
                <span className="posts-mascot-stat-trend">{currentAnalytics.wordCount.toLocaleString()} words</span>
              </div>
            </div>
            <div className="posts-mascot-stat">
              <span className="posts-mascot-stat-label">Visitors</span>
              <div className="posts-mascot-stat-value">
                <span className="posts-mascot-stat-number">{currentAnalytics.uniqueVisitors.toLocaleString()}</span>
                {currentAnalytics.views > 0 && currentAnalytics.uniqueVisitors > 0 && (
                  <span className="posts-mascot-stat-trend">
                    {Math.round((currentAnalytics.uniqueVisitors / currentAnalytics.views) * 100)}% unique
                  </span>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="posts-mascot-stat">
              <span className="posts-mascot-stat-label">Total Views</span>
              <div className="posts-mascot-stat-value">
                <span className="posts-mascot-stat-number">
                  {globalStats ? globalStats.totalViews.toLocaleString() : '—'}
                </span>
              </div>
            </div>
            <div className="posts-mascot-stat">
              <span className="posts-mascot-stat-label">Visitors</span>
              <div className="posts-mascot-stat-value">
                <span className="posts-mascot-stat-number">
                  {globalStats ? globalStats.totalUniqueVisitors.toLocaleString() : '—'}
                </span>
              </div>
            </div>
            <div className="posts-mascot-stat">
              <span className="posts-mascot-stat-label">Posts</span>
              <div className="posts-mascot-stat-value">
                <span className="posts-mascot-stat-number">
                  {globalStats ? globalStats.totalPosts.toLocaleString() : '—'}
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Conversation */}
      <div className="posts-intel-convo-area">
        <span className="posts-mascot-insight-label">
          {isStreaming ? 'AI Insight (streaming...)' : 'AI Insight'}
        </span>
        <div className="posts-mascot-convo">
          {currentConvo.length === 0 && !isStreaming && !streamingText && (
            <p className="posts-mascot-insight-text">
              Click the Analyze button on any post to get AI insights!
            </p>
          )}
          {currentConvo.map((msg, i) => (
            <div key={i} className={`posts-mascot-msg posts-mascot-msg--${msg.role}`}>
              <p className="posts-mascot-msg-text">{msg.text}</p>
            </div>
          ))}
          {streamingText && (
            <div className="posts-mascot-msg posts-mascot-msg--assistant">
              <p className="posts-mascot-msg-text">
                {streamingText}
                <span className="posts-mascot-cursor">▊</span>
              </p>
            </div>
          )}
          <div ref={insightEndRef} />
        </div>
      </div>

      {/* Reply input */}
      {isAnalyzed && currentConvo.length > 0 && (
        <div className="posts-mascot-reply">
          <input
            ref={inputRef}
            type="text"
            className="posts-mascot-reply-input"
            placeholder="Ask a follow-up..."
            value={replyInput}
            onChange={e => setReplyInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
          />
          <button
            className="posts-mascot-reply-btn"
            onClick={handleReply}
            disabled={isStreaming || !replyInput.trim()}
            title="Send"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2L7 9M14 2l-5 12-2-5-5-2z"/></svg>
          </button>
        </div>
      )}
    </div>
  )
}
