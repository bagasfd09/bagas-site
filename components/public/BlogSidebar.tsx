'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import TOCScrollSync, { TOCHeading } from './TOCScrollSync'

interface BlogPost {
  slug: string
  title: string
  tags: string[]
  series?: string | null
  createdAt: string
}

interface BlogSidebarProps {
  posts: BlogPost[]
  currentSlug?: string
  headings?: TOCHeading[]
  isArticle?: boolean
}

export default function BlogSidebar({ posts, currentSlug, headings, isArticle }: BlogSidebarProps) {
  const [search, setSearch] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)

  // Compute tag counts
  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    posts.forEach((p) => p.tags.forEach((t) => { counts[t] = (counts[t] || 0) + 1 }))
    return Object.entries(counts).sort((a, b) => b[1] - a[1])
  }, [posts])

  // Compute unique series
  const seriesList = useMemo(() => {
    const map = new Map<string, number>()
    posts.forEach((p) => {
      if (p.series) map.set(p.series, (map.get(p.series) || 0) + 1)
    })
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1])
  }, [posts])

  // Stats
  const years = useMemo(() => {
    if (posts.length === 0) return 0
    return new Date(posts[posts.length - 1].createdAt).getFullYear()
  }, [posts])

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="blog-sidebar-mobile-toggle md:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle blog menu"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {mobileOpen ? (
            <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
          ) : (
            <><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></>
          )}
        </svg>
      </button>

      <aside className={`blog-sidebar ${mobileOpen ? 'blog-sidebar--open' : ''}`}>
        {/* Back to site */}
        <Link href="/" className="blog-sidebar-back">
          &larr; bagas.dev
        </Link>

        {/* Identity */}
        <div className="blog-sidebar-identity">
          <h2 className="blog-sidebar-title">Stories & Ideas</h2>
          <p className="blog-sidebar-tagline">Technical articles and personal essays</p>
        </div>

        {/* Search */}
        <div className="blog-sidebar-search-wrap">
          <svg className="blog-sidebar-search-icon" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="7" cy="7" r="5.5" />
            <path d="M11 11l3.5 3.5" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Search posts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="blog-sidebar-search"
          />
        </div>

        {/* On article pages: show TOC instead of topics */}
        {isArticle && headings && headings.length > 0 ? (
          <TOCScrollSync headings={headings} />
        ) : (
          <>
            {/* Topics */}
            {tagCounts.length > 0 && (
              <div className="blog-sidebar-section">
                <span className="blog-sidebar-label">Topics</span>
                <div className="blog-topics-list">
                  {tagCounts.slice(0, 12).map(([tag, count]) => (
                    <Link
                      key={tag}
                      href={`/blog?tag=${encodeURIComponent(tag)}`}
                      className="blog-topic-chip"
                    >
                      {tag} <span className="blog-topic-count">{count}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Series */}
            {seriesList.length > 0 && (
              <div className="blog-sidebar-section">
                <span className="blog-sidebar-label">Series</span>
                <div className="blog-series-list">
                  {seriesList.map(([name, count]) => (
                    <Link
                      key={name}
                      href={`/blog?series=${encodeURIComponent(name)}`}
                      className="blog-series-card"
                    >
                      <span className="blog-series-name">{name}</span>
                      <span className="blog-series-count">{count} parts</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Article tags on article pages */}
        {isArticle && currentSlug && (
          <div className="blog-sidebar-section">
            <span className="blog-sidebar-label">Tags</span>
            <div className="blog-topics-list">
              {posts.find(p => p.slug === currentSlug)?.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/blog?tag=${encodeURIComponent(tag)}`}
                  className="blog-topic-chip"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Stats footer */}
        <div className="blog-sidebar-stats">
          {posts.length} posts{years ? ` · Since ${years}` : ''}
        </div>
      </aside>

      {/* Overlay for mobile */}
      {mobileOpen && (
        <div className="blog-sidebar-overlay" onClick={() => setMobileOpen(false)} />
      )}
    </>
  )
}
