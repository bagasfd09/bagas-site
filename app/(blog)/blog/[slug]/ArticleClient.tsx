'use client'

import Link from 'next/link'
import { useMemo, useCallback } from 'react'
import ReadingProgressBar from '@/components/public/ReadingProgressBar'
import BackToTop from '@/components/public/BackToTop'
import BlogMobileTOC from '@/components/public/BlogMobileTOC'
import TOCScrollSync, { extractHeadings } from '@/components/public/TOCScrollSync'

interface ArticlePost {
  title: string
  slug: string
  content: string
  description: string
  thumbnail?: string | null
  tags: string[]
  series?: string | null
  createdAt: string
  updatedAt: string
}

interface NavPost {
  title: string
  slug: string
}

interface ReadNextPost {
  title: string
  slug: string
  description?: string | null
  thumbnail?: string | null
}

interface SidebarPost {
  slug: string
  title: string
  tags: string[]
  series?: string | null
  createdAt: string
}

interface ArticleClientProps {
  post: ArticlePost
  readTime: number
  prevPost: NavPost | null
  nextPost: NavPost | null
  readNextPost: ReadNextPost | null
  seriesPosts: { title: string; slug: string; seriesOrder: number | null }[]
  allPosts: SidebarPost[]
  children: React.ReactNode
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function ArticleClient({
  post,
  readTime,
  prevPost,
  nextPost,
  readNextPost,
  seriesPosts,
  allPosts,
  children,
}: ArticleClientProps) {
  const headings = useMemo(() => extractHeadings(post.content), [post.content])

  // Tag counts for sidebar
  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    allPosts.forEach((p) => p.tags.forEach((t) => { counts[t] = (counts[t] || 0) + 1 }))
    return Object.entries(counts).sort((a, b) => b[1] - a[1])
  }, [allPosts])

  const oldestYear = useMemo(() => {
    if (allPosts.length === 0) return null
    return new Date(allPosts[allPosts.length - 1].createdAt).getFullYear()
  }, [allPosts])

  const handleShare = useCallback(async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title: post.title, url })
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(url)
    }
  }, [post.title])

  return (
    <div className="blog-layout">
      <ReadingProgressBar />

      {/* Blog Sidebar */}
      <aside className="blog-sidebar">
        <Link href="/" className="blog-sidebar-back">
          &larr; bagas.dev
        </Link>

        <div className="blog-sidebar-identity">
          <h2 className="blog-sidebar-title">Stories & Ideas</h2>
          <p className="blog-sidebar-tagline">Technical articles and personal essays</p>
        </div>

        {/* TOC for this article */}
        {headings.length > 0 && (
          <TOCScrollSync headings={headings} />
        )}

        {/* Tags for this post */}
        {post.tags.length > 0 && (
          <div className="blog-sidebar-section">
            <span className="blog-sidebar-label">Tags</span>
            <div className="blog-topics-list">
              {post.tags.map((tag) => (
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

        <div className="blog-sidebar-stats">
          {allPosts.length} posts{oldestYear ? ` · Since ${oldestYear}` : ''}
        </div>
      </aside>

      {/* Article main */}
      <main className="blog-main">
        <article className="article-page">
          <div className="article-header">
            <Link href="/blog" className="article-back">
              &larr; Back to Blog
            </Link>
            <h1 className="article-title">{post.title}</h1>
            <div className="article-meta">
              <time dateTime={post.createdAt}>
                {formatDate(post.createdAt)}
              </time>
              <span className="blog-meta-dot">·</span>
              <span>{readTime} min read</span>
              <button onClick={handleShare} className="article-share-btn" aria-label="Share article" title="Share">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
                  <polyline points="16 6 12 2 8 6" />
                  <line x1="12" y1="2" x2="12" y2="15" />
                </svg>
              </button>
            </div>
          </div>

          {/* Hero image */}
          {post.thumbnail && (
            <div className="article-hero-image">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={post.thumbnail} alt={post.title} />
            </div>
          )}

          {/* Mobile TOC */}
          <BlogMobileTOC headings={headings} />

          {/* JSON-LD + Article body (MarkdownRenderer) */}
          {children}

          {/* Series navigation */}
          {seriesPosts.length > 1 && (
            <div className="article-series-nav">
              <span className="article-series-label">Series: {post.series}</span>
              <ol className="article-series-list">
                {seriesPosts.map((sp) => (
                  <li key={sp.slug} className={sp.slug === post.slug ? 'article-series-current' : ''}>
                    {sp.slug === post.slug ? (
                      <span>{sp.title}</span>
                    ) : (
                      <Link href={`/blog/${sp.slug}`}>{sp.title}</Link>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Read Next */}
          {readNextPost && (
            <div className="article-read-next">
              <span className="article-read-next-label">Read Next</span>
              <Link href={`/blog/${readNextPost.slug}`} className="article-read-next-card">
                {readNextPost.thumbnail && (
                  <div className="article-read-next-thumb">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={readNextPost.thumbnail} alt="" />
                  </div>
                )}
                <div className="article-read-next-content">
                  <h3>{readNextPost.title}</h3>
                  {readNextPost.description && <p>{readNextPost.description}</p>}
                </div>
              </Link>
            </div>
          )}

          {/* Prev / Next links */}
          <nav className="article-prev-next" aria-label="Previous and next articles">
            <div className="article-prev-next-item">
              {prevPost && (
                <Link href={`/blog/${prevPost.slug}`} className="article-nav-link article-nav-prev">
                  <span className="article-nav-dir">&larr; Previous</span>
                  <span className="article-nav-title">{prevPost.title}</span>
                </Link>
              )}
            </div>
            <div className="article-prev-next-item">
              {nextPost && (
                <Link href={`/blog/${nextPost.slug}`} className="article-nav-link article-nav-next">
                  <span className="article-nav-dir">Next &rarr;</span>
                  <span className="article-nav-title">{nextPost.title}</span>
                </Link>
              )}
            </div>
          </nav>
        </article>
      </main>

      <BackToTop />
    </div>
  )
}
