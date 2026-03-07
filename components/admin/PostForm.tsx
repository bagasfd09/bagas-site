'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { slugify } from '@/lib/utils'
import Toast from './Toast'

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


  useEffect(() => {
    if (!slugManual && form.title) {
      setForm((f) => ({ ...f, slug: slugify(form.title) }))
    }
  }, [form.title, slugManual])

  function handleTagsChange(value: string) {
    setTagsInput(value)
    const tags = value
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
    setForm((f) => ({ ...f, tags }))
  }

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
      setToast({
        message: String(err instanceof Error ? err.message : err),
        type: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Title */}
        <div>
          <label className="admin-label">Title *</label>
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="admin-input"
            placeholder={isNote ? 'Note title' : 'Post title'}
          />
        </div>

        {/* Slug */}
        <div>
          <label className="admin-label">Slug *</label>
          <input
            type="text"
            required
            value={form.slug}
            onChange={(e) => {
              setSlugManual(true)
              setForm((f) => ({ ...f, slug: e.target.value }))
            }}
            className="admin-input"
            placeholder="post-slug-here"
          />
          <p className="admin-hint">
            URL: /{isNote ? 'notes' : 'blog'}/{form.slug}
          </p>
        </div>


        {/* Description (posts only) */}
        {!isNote && (
          <div>
            <label className="admin-label">Description / Excerpt</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="admin-input"
              placeholder="Short description for preview cards..."
            />
          </div>
        )}

        {/* Content */}
        <div>
          <label className="admin-label">Content (Markdown) *</label>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
            }}
            className="block lg:grid"
          >
            <textarea
              required
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              className="admin-textarea"
              style={{
                height: '480px',
                fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
                fontSize: '0.8125rem',
                resize: 'none',
              }}
              placeholder={'# Title\n\nWrite your content in Markdown...'}
            />
            <div
              className="admin-card prose hidden lg:block"
              style={{
                height: '480px',
                overflowY: 'auto',
                padding: '12px 16px',
                fontSize: '0.875rem',
              }}
              dangerouslySetInnerHTML={{
                __html: form.content
                  ? form.content.replace(/\n/g, '<br/>')
                  : '<p style="color:var(--admin-text-muted);font-size:0.8125rem">Preview will appear here...</p>',
              }}
            />
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="admin-label">Tags (comma-separated)</label>
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => handleTagsChange(e.target.value)}
            className="admin-input"
            placeholder="TypeScript, React, Next.js"
          />
        </div>

        {/* Category (posts only) */}
        {!isNote && (
          <div>
            <label className="admin-label">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="admin-select"
            >
              <option value="technical">Technical</option>
              <option value="personal">Personal</option>
            </select>
          </div>
        )}

        {/* Toggles */}
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              color: 'var(--admin-text-primary)',
            }}
          >
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
              className="admin-checkbox"
              style={{ width: '15px', height: '15px' }}
            />
            Published
          </label>

          {!isNote && (
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                color: 'var(--admin-text-primary)',
              }}
            >
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
                className="admin-checkbox"
                style={{ width: '15px', height: '15px' }}
              />
              Featured
            </label>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
          <button type="submit" disabled={loading} className="admin-btn admin-btn-primary">
            {loading ? 'Saving...' : post?.id ? 'Update' : 'Create'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="admin-btn admin-btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </>
  )
}
