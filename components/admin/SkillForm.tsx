'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { slugify } from '@/lib/utils'
import Toast from './Toast'
import ImageUpload from './ui/ImageUpload'

const CATEGORIES = [
  { value: 'language', label: 'Language' },
  { value: 'framework', label: 'Framework' },
  { value: 'database', label: 'Database' },
  { value: 'tool', label: 'Tool' },
  { value: 'cloud', label: 'Cloud' },
  { value: 'other', label: 'Other' },
]

const LEVELS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'expert', label: 'Expert' },
]

interface Skill {
  id?: string
  name: string
  slug: string
  icon: string
  url: string
  category: string
  level: string
  yearsOfExp: number | ''
  sortOrder: number
  featured: boolean
}

interface SkillFormProps {
  skill?: Partial<Omit<Skill, 'yearsOfExp'> & { yearsOfExp?: number | null }> & { id?: string }
}

export default function SkillForm({ skill }: SkillFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const [form, setForm] = useState<Skill>({
    name: skill?.name || '',
    slug: skill?.slug || '',
    icon: skill?.icon || '',
    url: skill?.url || '',
    category: skill?.category || 'language',
    level: skill?.level || 'intermediate',
    yearsOfExp: skill?.yearsOfExp ?? '',
    sortOrder: skill?.sortOrder ?? 0,
    featured: skill?.featured ?? false,
  })

  const [slugManual, setSlugManual] = useState(!!skill?.slug)

  useEffect(() => {
    if (!slugManual && form.name) {
      setForm((f) => ({ ...f, slug: slugify(form.name) }))
    }
  }, [form.name, slugManual])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const url = skill?.id ? `/api/admin/skills/${skill.id}` : '/api/admin/skills'
      const method = skill?.id ? 'PUT' : 'POST'

      const payload = {
        ...form,
        icon: form.icon || null,
        url: form.url || null,
        yearsOfExp: form.yearsOfExp === '' ? null : parseFloat(String(form.yearsOfExp)),
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to save')
      }

      setToast({ message: 'Skill saved successfully', type: 'success' })
      setTimeout(() => {
        router.push('/admin/skills')
        router.refresh()
      }, 800)
    } catch (err) {
      setToast({ message: String(err instanceof Error ? err.message : err), type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!skill?.id) return
    if (!confirm(`Delete "${form.name}"? This cannot be undone.`)) return
    try {
      const res = await fetch(`/api/admin/skills/${skill.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      router.push('/admin/skills')
      router.refresh()
    } catch {
      setToast({ message: 'Failed to delete', type: 'error' })
    }
  }

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}

      <form onSubmit={handleSubmit}>
        {/* Header bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '28px',
            gap: '12px',
          }}
        >
          <button
            type="button"
            onClick={() => router.back()}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--admin-text-secondary)',
              cursor: 'pointer',
              fontSize: '0.875rem',
              padding: 0,
            }}
          >
            ← Back to Skills
          </button>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={() => router.back()} className="admin-btn admin-btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="admin-btn admin-btn-primary">
              {loading ? 'Saving...' : skill?.id ? 'Update' : 'Create'}
            </button>
          </div>
        </div>

        {/* Two-column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>
          {/* LEFT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Name */}
            <div>
              <label className="admin-label">Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="admin-input"
                placeholder="Golang"
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
                placeholder="golang"
              />
            </div>

            {/* Category */}
            <div>
              <label className="admin-label">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="admin-select"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            {/* Level + Years */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label className="admin-label">Proficiency Level</label>
                <select
                  value={form.level}
                  onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))}
                  className="admin-select"
                >
                  {LEVELS.map((l) => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="admin-label">Years of Experience</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="number"
                    value={form.yearsOfExp}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        yearsOfExp: e.target.value === '' ? '' : parseFloat(e.target.value),
                      }))
                    }
                    className="admin-input"
                    placeholder="0"
                    min={0}
                    max={30}
                    step={0.5}
                  />
                  <span style={{ fontSize: '0.8125rem', color: 'var(--admin-text-muted)', whiteSpace: 'nowrap' }}>
                    years
                  </span>
                </div>
              </div>
            </div>

            {/* URL */}
            <div>
              <label className="admin-label">URL (optional)</label>
              <input
                type="text"
                value={form.url}
                onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                className="admin-input"
                placeholder="https://go.dev"
              />
              <p className="admin-hint">Link to official docs or a related blog post</p>
            </div>

            {/* Sort + Featured */}
            <div className="admin-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <p className="admin-section-title" style={{ margin: 0 }}>Display</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', alignItems: 'end' }}>
                <div>
                  <label className="admin-label">Sort Order</label>
                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))
                    }
                    className="admin-input"
                    min={0}
                  />
                </div>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    color: 'var(--admin-text-primary)',
                    paddingBottom: '8px',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
                    style={{ width: '15px', height: '15px' }}
                  />
                  Show on homepage
                </label>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* SVG Upload */}
            <div>
              <label className="admin-label">Skill Icon (SVG)</label>
              <ImageUpload
                value={form.icon}
                onChange={(path) => setForm((f) => ({ ...f, icon: path }))}
                folder="skills"
                accept="image/svg+xml"
                acceptHint="SVG only · recommended 64×64px or larger"
              />
              <p
                style={{
                  fontSize: '0.7rem',
                  color: 'var(--admin-text-muted)',
                  marginTop: '6px',
                }}
              >
                Find logos at{' '}
                <a
                  href="https://svgl.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--admin-accent)' }}
                >
                  svgl.app
                </a>{' '}
                or{' '}
                <a
                  href="https://simpleicons.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--admin-accent)' }}
                >
                  simpleicons.org
                </a>
              </p>
            </div>

            {/* Live preview */}
            <div>
              <label className="admin-label">Preview</label>
              <div
                style={{
                  background: 'var(--admin-bg)',
                  border: '1px solid var(--admin-border)',
                  borderRadius: '10px',
                  padding: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '20px 24px',
                    border: '1px solid var(--admin-border)',
                    borderRadius: '8px',
                    minWidth: '100px',
                    background: 'var(--admin-surface)',
                  }}
                >
                  {form.icon ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={form.icon} alt={form.name} style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
                  ) : (
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        background: 'var(--admin-surface-hover)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.2rem',
                        color: 'var(--admin-text-muted)',
                      }}
                    >
                      {form.name ? form.name[0].toUpperCase() : '?'}
                    </div>
                  )}
                  <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--admin-text-primary)' }}>
                    {form.name || 'Skill Name'}
                  </span>
                </div>
              </div>
            </div>

            {/* Danger zone */}
            {skill?.id && (
              <div
                style={{
                  border: '1px solid rgba(248,81,73,0.3)',
                  borderRadius: '10px',
                  padding: '14px 16px',
                }}
              >
                <p
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    color: 'var(--admin-danger)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '10px',
                  }}
                >
                  Danger Zone
                </p>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="admin-btn admin-btn-danger"
                  style={{ fontSize: '0.8125rem' }}
                >
                  🗑 Delete Skill
                </button>
              </div>
            )}
          </div>
        </div>
      </form>
    </>
  )
}
