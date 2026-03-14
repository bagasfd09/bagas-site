'use client'

import Link from 'next/link'
import { Suspense, useEffect, useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'

interface Post {
  id: string
  title: string
  slug: string
  description?: string
  thumbnail?: string
  tags: string[]
  featured: boolean
  series?: string | null
  seriesOrder?: number | null
  createdAt: string
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function estimateReadTime(description?: string) {
  return Math.max(3, Math.ceil((description?.length || 100) / 30))
}

export default function BlogPageWrapper() {
  return (
    <Suspense>
      <BlogPage />
    </Suspense>
  )
}

function BlogPage() {
  const searchParams = useSearchParams()
  const tagFilter = searchParams.get('tag')
  const seriesFilter = searchParams.get('series')

  const [posts, setPosts] = useState<Post[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/public/posts?type=post')
      .then((r) => r.json())
      .then((data) => {
        setPosts(data.posts || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    let result = posts

    if (tagFilter) {
      result = result.filter((p) =>
        p.tags.some((t) => t.toLowerCase() === tagFilter.toLowerCase())
      )
    }

    if (seriesFilter) {
      result = result.filter((p) => p.series === seriesFilter)
    }

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)) ||
          (p.description && p.description.toLowerCase().includes(q))
      )
    }

    return result
  }, [posts, tagFilter, seriesFilter, search])

  // Featured post: first featured or first post
  const featuredPost = filtered.find((p) => p.featured) || filtered[0]
  const regularPosts = filtered.filter((p) => p !== featuredPost)

  // Tag counts for sidebar
  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    posts.forEach((p) => p.tags.forEach((t) => { counts[t] = (counts[t] || 0) + 1 }))
    return Object.entries(counts).sort((a, b) => b[1] - a[1])
  }, [posts])

  // Series
  const seriesList = useMemo(() => {
    const map = new Map<string, number>()
    posts.forEach((p) => {
      if (p.series) map.set(p.series, (map.get(p.series) || 0) + 1)
    })
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1])
  }, [posts])

  const oldestYear = useMemo(() => {
    if (posts.length === 0) return null
    return new Date(posts[posts.length - 1].createdAt).getFullYear()
  }, [posts])

  return (
    <div className="blog-layout">
      {/* Blog Sidebar */}
      <aside className="blog-sidebar">
        <Link href="/" className="blog-sidebar-back">
          &larr; bagas.dev
        </Link>

        <div className="blog-sidebar-identity">
          <h2 className="blog-sidebar-title">Stories & Ideas</h2>
          <p className="blog-sidebar-tagline">Technical articles and personal essays</p>
        </div>

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

        {tagCounts.length > 0 && (
          <div className="blog-sidebar-section">
            <span className="blog-sidebar-label">Topics</span>
            <div className="blog-topics-list">
              {tagFilter && (
                <Link href="/blog" className="blog-topic-chip blog-topic-chip--active">
                  {tagFilter} &times;
                </Link>
              )}
              {tagCounts
                .filter(([tag]) => tag !== tagFilter)
                .slice(0, 12)
                .map(([tag, count]) => (
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

        {seriesList.length > 0 && (
          <div className="blog-sidebar-section">
            <span className="blog-sidebar-label">Series</span>
            <div className="blog-series-list">
              {seriesList.map(([name, count]) => (
                <Link
                  key={name}
                  href={seriesFilter === name ? '/blog' : `/blog?series=${encodeURIComponent(name)}`}
                  className={`blog-series-card ${seriesFilter === name ? 'blog-series-card--active' : ''}`}
                >
                  <span className="blog-series-name">{name}</span>
                  <span className="blog-series-count">{count} parts</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="blog-sidebar-stats">
          {posts.length} posts{oldestYear ? ` · Since ${oldestYear}` : ''}
        </div>
      </aside>

      {/* Main content */}
      <main className="blog-main">
        <div className="blog-content">
          {/* Header */}
          <div className="blog-header">
            <h1 className="blog-page-title">Blog</h1>
            {(tagFilter || seriesFilter) && (
              <p className="blog-filter-label">
                {tagFilter && <>Filtered by tag: <strong>{tagFilter}</strong></>}
                {seriesFilter && <>Series: <strong>{seriesFilter}</strong></>}
                {' '}
                <Link href="/blog" className="blog-filter-clear">Clear</Link>
              </p>
            )}
          </div>

          {/* Mobile search */}
          <div className="blog-mobile-search">
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
          </div>

          {loading ? (
            <div className="blog-loading">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="blog-skeleton-row">
                  <div className="blog-skeleton" style={{ width: '60%', height: '20px' }} />
                  <div className="blog-skeleton" style={{ width: '40%', height: '14px', marginTop: '8px' }} />
                  <div className="blog-skeleton" style={{ width: '25%', height: '12px', marginTop: '6px' }} />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="blog-empty">
              {search ? `No posts matching "${search}".` : 'No posts yet.'}
            </p>
          ) : (
            <>
              {/* Featured post hero */}
              {featuredPost && (
                <Link href={`/blog/${featuredPost.slug}`} className="blog-featured-card">
                  {featuredPost.thumbnail && (
                    <div className="blog-featured-thumb">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={featuredPost.thumbnail} alt={featuredPost.title} />
                    </div>
                  )}
                  <div className="blog-featured-content">
                    {featuredPost.featured && <span className="blog-featured-badge">Featured</span>}
                    <h2 className="blog-featured-title">{featuredPost.title}</h2>
                    {featuredPost.description && (
                      <p className="blog-featured-desc">{featuredPost.description}</p>
                    )}
                    <div className="blog-featured-meta">
                      <time>{formatDate(featuredPost.createdAt)}</time>
                      <span className="blog-meta-dot">·</span>
                      <span>{estimateReadTime(featuredPost.description)} min read</span>
                    </div>
                  </div>
                </Link>
              )}

              {/* Regular posts */}
              <div className="blog-post-list">
                {regularPosts.map((post) => (
                  <Link key={post.id} href={`/blog/${post.slug}`} className="blog-post-row">
                    <div className="blog-post-row-content">
                      <h3 className="blog-post-row-title">{post.title}</h3>
                      {post.description && (
                        <p className="blog-post-row-desc">{post.description}</p>
                      )}
                      <div className="blog-post-row-meta">
                        <time>{formatDate(post.createdAt)}</time>
                        <span className="blog-meta-dot">·</span>
                        <span>{estimateReadTime(post.description)} min read</span>
                        {post.tags.length > 0 && (
                          <>
                            <span className="blog-meta-dot">·</span>
                            <span className="blog-post-row-tags">
                              {post.tags.slice(0, 2).map((tag) => (
                                <span key={tag} className="blog-post-row-tag">{tag}</span>
                              ))}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    {post.thumbnail && (
                      <div className="blog-post-row-thumb">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={post.thumbnail} alt="" />
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
