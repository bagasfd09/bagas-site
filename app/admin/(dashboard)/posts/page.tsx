'use client'

import Link from 'next/link'
import { useEffect, useState, useCallback } from 'react'
import { formatDateShort } from '@/lib/utils'
import ConfirmModal from '@/components/admin/ConfirmModal'
import Toast from '@/components/admin/Toast'

interface Post {
  id: string
  title: string
  slug: string
  type: string
  category: string
  published: boolean
  featured: boolean
  createdAt: string
  updatedAt: string
}

export default function PostsAdminPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteTitle, setDeleteTitle] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ type: 'post', status })
      if (search) params.set('search', search)
      const res = await fetch(`/api/admin/posts?${params}`)
      const data = await res.json()
      setPosts(data.posts || [])
      setTotal(data.total || 0)
    } finally {
      setLoading(false)
    }
  }, [search, status])

  useEffect(() => {
    const timer = setTimeout(fetchPosts, 300)
    return () => clearTimeout(timer)
  }, [fetchPosts])

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/posts/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setToast({ message: 'Post deleted', type: 'success' })
      fetchPosts()
    } catch {
      setToast({ message: 'Failed to delete', type: 'error' })
    } finally {
      setDeleting(false)
      setDeleteId(null)
      setDeleteTitle('')
    }
  }

  return (
    <div className="adm-page-in">
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
      <ConfirmModal
        isOpen={!!deleteId}
        title="Delete Post"
        message={`"${deleteTitle}" will be permanently deleted. This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => { setDeleteId(null); setDeleteTitle('') }}
        loading={deleting}
      />

      <div className="adm-list-header">
        <div>
          <h1>Posts</h1>
          <p>{total} total &middot; blog posts and essays</p>
        </div>
        <div className="adm-list-header-actions">
          <Link href="/admin/posts/new" className="admin-btn admin-btn-primary">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 2v12M2 8h12" strokeLinecap="round" /></svg>
            New Post
          </Link>
        </div>
      </div>

      <div className="adm-list-filters">
        <input type="text" placeholder="Search posts..." value={search} onChange={(e) => setSearch(e.target.value)} className="admin-input" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="admin-select">
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      <div className="adm-list-table">
        {loading ? (
          <div className="adm-loading"><div className="adm-loading-spinner" />Loading posts...</div>
        ) : posts.length === 0 ? (
          <div className="adm-empty">
            <div className="adm-empty-icon"><svg width="24" height="24" viewBox="0 0 16 16" fill="currentColor"><path d="M2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2zm1 3h10v1H3V3zm0 3h10v1H3V6zm0 3h7v1H3V9z" /></svg></div>
            <div className="adm-empty-title">No posts yet</div>
            <p className="adm-empty-desc">Start writing your first blog post</p>
            <Link href="/admin/posts/new" className="admin-btn admin-btn-primary">Create Post</Link>
          </div>
        ) : (
          <table className="adm-table">
            <thead><tr className="adm-thead">
              <th className="adm-th">Title</th>
              <th className="adm-th hidden sm:table-cell">Status</th>
              <th className="adm-th hidden md:table-cell">Date</th>
              <th className="adm-th adm-th--right">Actions</th>
            </tr></thead>
            <tbody>
              {posts.map((post, i) => (
                <tr key={post.id} className="adm-tr" style={{ animationDelay: `${i * 30}ms` }}>
                  <td className="adm-td">
                    <div className="adm-td-title">{post.title}</div>
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
        )}
      </div>
    </div>
  )
}
