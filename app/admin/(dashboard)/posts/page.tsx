'use client'

import Link from 'next/link'
import { useEffect, useState, useCallback } from 'react'
import { formatDateShort } from '@/lib/utils'
import ConfirmModal from '@/components/admin/ConfirmModal'
import Toast from '@/components/admin/Toast'
import PostsMascot from '@/components/admin/PostsMascot'

interface Post {
  id: string
  title: string
  slug: string
  type: string
  category: string
  description: string
  published: boolean
  featured: boolean
  createdAt: string
  updatedAt: string
}

type StatusFilter = 'all' | 'published' | 'draft' | 'featured'
type SortOrder = 'newest' | 'oldest' | 'title'

export default function PostsAdminPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [total, setTotal] = useState(0)
  const [publishedCount, setPublishedCount] = useState(0)
  const [draftCount, setDraftCount] = useState(0)
  const [featuredCount, setFeaturedCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [sort, setSort] = useState<SortOrder>('newest')
  const [page, setPage] = useState(1)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteTitle, setDeleteTitle] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [hoveredPost, setHoveredPost] = useState<Post | null>(null)
  const [analyzingPost, setAnalyzingPost] = useState<Post | null>(null)

  const limit = 6

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ type: 'post', status: status === 'featured' ? 'all' : status })
      if (search) params.set('search', search)
      params.set('page', String(page))
      params.set('limit', String(limit))
      if (sort === 'oldest') params.set('sort', 'oldest')
      if (sort === 'title') params.set('sort', 'title')
      const res = await fetch(`/api/admin/posts?${params}`)
      const data = await res.json()
      let fetchedPosts: Post[] = data.posts || []

      // Client-side featured filter
      if (status === 'featured') {
        fetchedPosts = fetchedPosts.filter((p: Post) => p.featured)
      }

      setPosts(fetchedPosts)
      setTotal(data.total || 0)
    } finally {
      setLoading(false)
    }
  }, [search, status, page, sort])

  // Fetch counts once
  useEffect(() => {
    async function fetchCounts() {
      try {
        const [allRes, pubRes, draftRes] = await Promise.all([
          fetch('/api/admin/posts?type=post&status=all&limit=200'),
          fetch('/api/admin/posts?type=post&status=published&limit=200'),
          fetch('/api/admin/posts?type=post&status=draft&limit=200'),
        ])
        const [allData, pubData, draftData] = await Promise.all([allRes.json(), pubRes.json(), draftRes.json()])
        setPublishedCount(pubData.total || 0)
        setDraftCount(draftData.total || 0)
        const allPosts: Post[] = allData.posts || []
        setFeaturedCount(allPosts.filter(p => p.featured).length)
      } catch { /* ignore */ }
    }
    fetchCounts()
  }, [])

  useEffect(() => {
    const timer = setTimeout(fetchPosts, 300)
    return () => clearTimeout(timer)
  }, [fetchPosts])

  // Reset page when filters change
  useEffect(() => { setPage(1) }, [search, status, sort])

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/posts/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setToast({ message: 'Post deleted', type: 'success' })
      setHoveredPost(null)
      fetchPosts()
    } catch {
      setToast({ message: 'Failed to delete', type: 'error' })
    } finally {
      setDeleting(false)
      setDeleteId(null)
      setDeleteTitle('')
    }
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="adm-page-in adm-page-fixed">
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
      <ConfirmModal
        isOpen={!!deleteId}
        title="Delete Post"
        message={`"${deleteTitle}" will be permanently deleted. This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => { setDeleteId(null); setDeleteTitle('') }}
        loading={deleting}
      />

      {/* Header */}
      <div className="adm-list-header">
        <div>
          <h1>Posts</h1>
          <p>Manage your blog posts and articles</p>
        </div>
        <div className="adm-list-header-actions">
          <Link href="/admin/posts/new" className="admin-btn admin-btn-primary">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 2v12M2 8h12" strokeLinecap="round" /></svg>
            New Post
          </Link>
        </div>
      </div>

      {/* Main content: Table + Post Intelligence side by side */}
      <div className="posts-layout">
        {/* Left: Filters + Table */}
        <div className="posts-layout-main">
          {/* Search & Filters */}
          <div className="posts-filters-bar">
            <div className="posts-search-wrap">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5l3 3"/></svg>
              <input
                type="text"
                placeholder="Search posts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="posts-search-input"
              />
            </div>

            <div className="posts-filters-divider" />

            <div className="posts-status-filters">
              {([
                { key: 'all' as StatusFilter, label: 'All', count: total },
                { key: 'published' as StatusFilter, label: 'Published', count: publishedCount },
                { key: 'draft' as StatusFilter, label: 'Drafts', count: draftCount },
                { key: 'featured' as StatusFilter, label: 'Featured', count: featuredCount },
              ]).map(f => (
                <button
                  key={f.key}
                  className={`posts-status-pill ${status === f.key ? 'posts-status-pill--active' : ''}`}
                  onClick={() => setStatus(f.key)}
                >
                  {f.label} {f.count}
                </button>
              ))}
            </div>

            <div className="posts-filters-divider" />

            <div className="posts-sort-wrap">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 4h12M4 8h8M6 12h4"/></svg>
              <select value={sort} onChange={e => setSort(e.target.value as SortOrder)} className="posts-sort-select">
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="title">Title</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="adm-list-table">
            {loading ? (
              <div className="adm-loading"><div className="adm-loading-spinner" />Loading posts...</div>
            ) : posts.length === 0 ? (
              <div className="adm-empty">
                <div className="adm-empty-icon">
                  <svg width="24" height="24" viewBox="0 0 16 16" fill="currentColor"><path d="M2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2zm1 3h10v1H3V3zm0 3h10v1H3V6zm0 3h7v1H3V9z" /></svg>
                </div>
                <div className="adm-empty-title">No posts yet</div>
                <p className="adm-empty-desc">Start writing your first blog post</p>
                <Link href="/admin/posts/new" className="admin-btn admin-btn-primary">Create Post</Link>
              </div>
            ) : (
              <>
                <table className="adm-table">
                  <thead><tr className="adm-thead">
                    <th className="adm-th">Title</th>
                    <th className="adm-th hidden sm:table-cell">Status</th>
                    <th className="adm-th hidden md:table-cell">Date</th>
                    <th className="adm-th adm-th--right">Actions</th>
                  </tr></thead>
                  <tbody>
                    {posts.map((post, i) => (
                      <tr
                        key={post.id}
                        className={`adm-tr ${hoveredPost?.id === post.id ? 'adm-tr--hovered' : ''} ${analyzingPost?.id === post.id ? 'adm-tr--analyzing' : ''}`}
                        style={{ animationDelay: `${i * 30}ms` }}
                        onMouseEnter={() => setHoveredPost(post)}
                      >
                        <td className="adm-td">
                          <div className="adm-td-title">
                            {post.title}
                            {post.featured && (
                              <svg width="12" height="12" viewBox="0 0 16 16" fill="#c4953a" stroke="none" style={{ marginLeft: 5, verticalAlign: 'middle', display: 'inline' }}>
                                <path d="M8 1l2.2 4.6L15 6.3l-3.5 3.4.8 4.9L8 12.3 3.7 14.6l.8-4.9L1 6.3l4.8-.7z"/>
                              </svg>
                            )}
                          </div>
                          <div className="adm-td-slug">/blog/{post.slug}</div>
                        </td>
                        <td className="adm-td hidden sm:table-cell">
                          <span className={`adm-badge ${post.published ? 'adm-badge--published' : 'adm-badge--draft'}`}>
                            <span className={`adm-status-dot ${post.published ? 'adm-status-dot--success' : 'adm-status-dot--warning'}`} style={{ width: 6, height: 6 }} />
                            {post.published ? 'Published' : 'Draft'}
                          </span>
                        </td>
                        <td className="adm-td adm-td--muted hidden md:table-cell">{formatDateShort(post.createdAt)}</td>
                        <td className="adm-td adm-td--right">
                          <div className="adm-actions">
                            <button
                              onClick={() => setAnalyzingPost(post)}
                              className={`adm-action-analyze ${analyzingPost?.id === post.id ? 'adm-action-analyze--active' : ''}`}
                              title="Analyze with AI"
                            >
                              <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm1 11H7V7h2v4zm0-5H7V4h2v2z"/></svg>
                              Analyze
                            </button>
                            <Link href={`/admin/posts/${post.id}/edit`} className="adm-action-edit">
                              <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M12.146.854a.5.5 0 0 1 .708 0l2.292 2.292a.5.5 0 0 1 0 .708l-9.146 9.146H3.5a.5.5 0 0 1-.5-.5v-2.5L12.146.854zM2 13h12v1H2v-1z"/></svg>
                              Edit
                            </Link>
                            <button onClick={() => { setDeleteId(post.id); setDeleteTitle(post.title) }} className="adm-action-delete">
                              <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4L4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="posts-pagination">
                    <span className="posts-pagination-info">
                      Showing {(page - 1) * limit + 1}-{Math.min(page * limit, total)} of {total} posts
                    </span>
                    <div className="posts-pagination-buttons">
                      <button
                        className="posts-page-btn"
                        disabled={page <= 1}
                        onClick={() => setPage(p => p - 1)}
                      >
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 4l-4 4 4 4"/></svg>
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                        <button
                          key={p}
                          className={`posts-page-btn ${p === page ? 'posts-page-btn--active' : ''}`}
                          onClick={() => setPage(p)}
                        >
                          {p}
                        </button>
                      ))}
                      <button
                        className="posts-page-btn"
                        disabled={page >= totalPages}
                        onClick={() => setPage(p => p + 1)}
                      >
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 4l4 4-4 4"/></svg>
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right: Post Intelligence */}
        <PostsMascot analyzingPost={analyzingPost} onAnalysisDone={() => setAnalyzingPost(null)} />
      </div>
    </div>
  )
}
