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

interface Props {
  analyzingPost: PostInsight | null
  onAnalysisDone: () => void
}

export default function PostsMascot({ analyzingPost, onAnalysisDone }: Props) {
  const [frame, setFrame] = useState(0)
  const [background, setBackground] = useState<string>('office')
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null)
  const [currentAnalytics, setCurrentAnalytics] = useState<PostAnalytics | null>(null)
  const [insight, setInsight] = useState('Click the Analyze button on any post to get AI insights!')
  const [isStreaming, setIsStreaming] = useState(false)
  const [insightCache, setInsightCache] = useState<Record<string, string>>({})
  const [analyticsCache, setAnalyticsCache] = useState<Record<string, PostAnalytics>>({})
  const abortRef = useRef<AbortController | null>(null)
  const lastAnalyzedSlug = useRef<string | null>(null)

  // Are we showing per-post data (after Analyze clicked)?
  const isAnalyzed = !!analyzingPost

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

  // Reset to global view when no analyzing post
  useEffect(() => {
    if (!analyzingPost) {
      setCurrentAnalytics(null)
      if (!isStreaming) {
        setInsight('Click the Analyze button on any post to get AI insights!')
      }
    }
  }, [analyzingPost])

  // Stream AI insight when analyzingPost changes (button click)
  useEffect(() => {
    if (!analyzingPost) return

    const slug = analyzingPost.slug

    // If cached, use cached version
    if (insightCache[slug]) {
      fetchAnalytics(slug).then(a => setCurrentAnalytics(a))
      setInsight(insightCache[slug])
      return
    }

    // Abort any in-flight request
    if (abortRef.current) {
      abortRef.current.abort()
    }

    lastAnalyzedSlug.current = slug
    const controller = new AbortController()
    abortRef.current = controller

    const runAnalysis = async () => {
      const analytics = await fetchAnalytics(slug)
      setCurrentAnalytics(analytics)

      if (lastAnalyzedSlug.current !== slug) return

      setIsStreaming(true)
      setInsight('')

      const prompt = [
        `Analyze this blog post briefly (2-3 sentences max):`,
        `Title: "${analyzingPost.title}"`,
        `Slug: /blog/${analyzingPost.slug}`,
        `Status: ${analyzingPost.published ? 'Published' : 'Draft'}`,
        analyzingPost.featured ? 'Featured: Yes (pinned on homepage)' : '',
        `Category: ${analyzingPost.category || 'uncategorized'}`,
        analyzingPost.description ? `Description: ${analyzingPost.description}` : '',
        `Created: ${analyzingPost.createdAt}`,
        `Total Page Views: ${analytics.views}`,
        `Unique Visitors: ${analytics.uniqueVisitors}`,
        `Word Count: ${analytics.wordCount}`,
        `Estimated Avg Read Time: ~${analytics.avgReadMin} min (NOTE: this is estimated from word count at 200 wpm, NOT measured from actual user reading duration — do not present this as real user behavior data)`,
        '',
        'Give a short, helpful insight about this post — performance tips, content suggestions, or observations. Be concise and actionable. Respond in the same language as the post title.',
      ].filter(Boolean).join('\n')

      try {
        const res = await fetch('/api/admin/mascot/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', content: prompt }],
          }),
          signal: controller.signal,
        })

        if (!res.ok) {
          setInsight('Could not get AI insight — check OpenClaw configuration.')
          setIsStreaming(false)
          onAnalysisDone()
          return
        }

        const reader = res.body?.getReader()
        if (!reader) {
          setInsight('Stream unavailable.')
          setIsStreaming(false)
          onAnalysisDone()
          return
        }

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
                setInsight(accumulated)
              }
            } catch { /* skip */ }
          }
        }

        if (accumulated && lastAnalyzedSlug.current === slug) {
          setInsightCache(prev => ({ ...prev, [slug]: accumulated }))
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return
        setInsight('Failed to connect to AI agent.')
      } finally {
        if (lastAnalyzedSlug.current === slug) {
          setIsStreaming(false)
        }
      }
    }

    runAnalysis()

    return () => { controller.abort() }
  }, [analyzingPost?.id])

  const mascotState = isStreaming ? 'writing' : analyzingPost ? 'presenting' : 'idle'

  return (
    <div className="posts-mascot-section">
      {/* Left: Mascot Visual */}
      <div className="posts-mascot-visual">
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
        <div className="posts-mascot-info">
          <span className="posts-mascot-name">Claw&apos;d</span>
          <span className="posts-mascot-role">Post Assistant</span>
        </div>
        <div className="posts-mascot-status">
          <span className="posts-mascot-dot" />
          <span>{isStreaming ? 'Thinking...' : analyzingPost ? 'Analyzing' : 'Active'}</span>
        </div>
      </div>

      {/* Right: Response Panel */}
      <div className="posts-mascot-response">
        {/* Header */}
        <div className="posts-mascot-response-header">
          <div className="posts-mascot-response-title">
            {analyzingPost ? (
              <>
                <span className="posts-mascot-post-title">{analyzingPost.title}</span>
                {analyzingPost.featured && (
                  <span className="posts-mascot-featured-badge">
                    <svg width="10" height="10" viewBox="0 0 16 16" fill="#c4953a" stroke="none"><path d="M8 1l2.2 4.6L15 6.3l-3.5 3.4.8 4.9L8 12.3 3.7 14.6l.8-4.9L1 6.3l4.8-.7z"/></svg>
                    Featured
                  </span>
                )}
              </>
            ) : (
              <span className="posts-mascot-post-title">Post Intelligence</span>
            )}
          </div>
          <span className="posts-mascot-hint">
            {analyzingPost ? `/blog/${analyzingPost.slug}` : 'All posts overview'}
          </span>
        </div>

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
                <span className="posts-mascot-stat-label">Unique Visitors</span>
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
                  <span className="posts-mascot-stat-trend">all posts</span>
                </div>
              </div>
              <div className="posts-mascot-stat">
                <span className="posts-mascot-stat-label">Unique Visitors</span>
                <div className="posts-mascot-stat-value">
                  <span className="posts-mascot-stat-number">
                    {globalStats ? globalStats.totalUniqueVisitors.toLocaleString() : '—'}
                  </span>
                  <span className="posts-mascot-stat-trend">all posts</span>
                </div>
              </div>
              <div className="posts-mascot-stat">
                <span className="posts-mascot-stat-label">Total Posts</span>
                <div className="posts-mascot-stat-value">
                  <span className="posts-mascot-stat-number">
                    {globalStats ? globalStats.totalPosts.toLocaleString() : '—'}
                  </span>
                  <span className="posts-mascot-stat-trend">published</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Insight */}
        <div className="posts-mascot-insight">
          <span className="posts-mascot-insight-label">
            {isStreaming ? 'AI Insight (streaming...)' : 'AI Insight'}
          </span>
          <p className="posts-mascot-insight-text">
            {insight}
            {isStreaming && <span className="posts-mascot-cursor">▊</span>}
          </p>
        </div>
      </div>
    </div>
  )
}
