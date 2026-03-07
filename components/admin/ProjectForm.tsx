'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { slugify } from '@/lib/utils'
import Toast from './Toast'
import ImageUpload from './ui/ImageUpload'

interface GitHubStats {
  stars: number | null
  forks: number | null
  createdAt: string | null
  updatedAt: string | null
  language: string | null
  syncedAt: string | null
}

interface Project {
  id?: string
  name: string
  slug: string
  description: string
  image: string
  repo: string
  demoUrl: string
  articleUrl: string
  year: number | ''
  tech: string[]
  featured: boolean
  sortOrder: number
  githubStars?: number | null
  githubForks?: number | null
  githubCreatedAt?: string | null
  githubUpdatedAt?: string | null
  githubLanguage?: string | null
  githubSyncedAt?: string | null
}

interface ProjectFormProps {
  project?: Partial<Project> & { id?: string }
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function timeAgo(iso: string | null | undefined): string {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 2) return 'just now'
  if (mins < 60) return `${mins} minutes ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`
  const months = Math.floor(days / 30)
  return `${months} month${months > 1 ? 's' : ''} ago`
}

export default function ProjectForm({ project }: ProjectFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncCooldown, setSyncCooldown] = useState(false)

  const [github, setGithub] = useState<GitHubStats>({
    stars: project?.githubStars ?? null,
    forks: project?.githubForks ?? null,
    createdAt: project?.githubCreatedAt ?? null,
    updatedAt: project?.githubUpdatedAt ?? null,
    language: project?.githubLanguage ?? null,
    syncedAt: project?.githubSyncedAt ?? null,
  })

  const [form, setForm] = useState<Project>({
    name: project?.name || '',
    slug: project?.slug || '',
    description: project?.description || '',
    image: project?.image || '',
    repo: project?.repo || '',
    demoUrl: project?.demoUrl || '',
    articleUrl: project?.articleUrl || '',
    year: project?.year || '',
    tech: project?.tech || [],
    featured: project?.featured || false,
    sortOrder: project?.sortOrder || 0,
  })

  const [techInput, setTechInput] = useState((project?.tech || []).join(', '))
  const [slugManual, setSlugManual] = useState(!!project?.slug)
  const prevRepo = useRef(project?.repo || '')

  useEffect(() => {
    if (!slugManual && form.name) {
      setForm((f) => ({ ...f, slug: slugify(form.name) }))
    }
  }, [form.name, slugManual])

  function handleTechChange(value: string) {
    setTechInput(value)
    const tech = value.split(',').map((t) => t.trim()).filter(Boolean)
    setForm((f) => ({ ...f, tech }))
  }

  async function handleSync() {
    if (!form.repo || syncing || syncCooldown) return
    setSyncing(true)
    try {
      const res = await fetch('/api/admin/projects/github-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project?.id, repoUrl: form.repo }),
      })
      const data = await res.json()
      if (!res.ok) {
        setToast({ message: data.error || 'Sync failed', type: 'error' })
        return
      }
      setGithub({
        stars: data.github.stars,
        forks: data.github.forks,
        createdAt: data.github.createdAt,
        updatedAt: data.github.updatedAt,
        language: data.github.language,
        syncedAt: new Date().toISOString(),
      })
      setToast({ message: 'GitHub data synced', type: 'success' })
      setSyncCooldown(true)
      setTimeout(() => setSyncCooldown(false), 30000)
    } catch {
      setToast({ message: 'Sync failed', type: 'error' })
    } finally {
      setSyncing(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const repoChanged = form.repo !== prevRepo.current

    try {
      const url = project?.id ? `/api/admin/projects/${project.id}` : '/api/admin/projects'
      const method = project?.id ? 'PUT' : 'POST'

      const payload = {
        ...form,
        year: form.year === '' ? null : Number(form.year),
        image: form.image || null,
        repo: form.repo || null,
        demoUrl: form.demoUrl || null,
        articleUrl: form.articleUrl || null,
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

      const saved = await res.json()
      prevRepo.current = form.repo

      // Auto-sync GitHub if repo URL changed and project now has an ID
      if (repoChanged && form.repo && (project?.id || saved.id)) {
        const projectId = project?.id || saved.id
        fetch('/api/admin/projects/github-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId, repoUrl: form.repo }),
        })
          .then((r) => r.json())
          .then((data) => {
            if (data.github) {
              setGithub({
                stars: data.github.stars,
                forks: data.github.forks,
                createdAt: data.github.createdAt,
                updatedAt: data.github.updatedAt,
                language: data.github.language,
                syncedAt: new Date().toISOString(),
              })
            }
          })
          .catch(() => {})
      }

      setToast({ message: 'Project saved successfully', type: 'success' })
      setTimeout(() => {
        router.push('/admin/projects')
        router.refresh()
      }, 800)
    } catch (err) {
      setToast({ message: String(err instanceof Error ? err.message : err), type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!project?.id) return
    if (!confirm(`Delete "${form.name}"? This cannot be undone.`)) return
    try {
      const res = await fetch(`/api/admin/projects/${project.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      router.push('/admin/projects')
      router.refresh()
    } catch {
      setToast({ message: 'Failed to delete', type: 'error' })
    }
  }

  const hasGitHub = github.stars !== null || github.forks !== null
  const canSync = !!form.repo && !!project?.id

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}

      <form onSubmit={handleSubmit}>
        {/* ── Header bar ───────────────────────────────────────────── */}
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
            ← Back to Projects
          </button>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={() => router.back()}
              className="admin-btn admin-btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" disabled={loading} className="admin-btn admin-btn-primary">
              {loading ? 'Saving...' : project?.id ? 'Update' : 'Create'}
            </button>
          </div>
        </div>

        {/* ── Two-column layout ─────────────────────────────────────── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 380px',
            gap: '24px',
            alignItems: 'start',
          }}
        >
          {/* LEFT COLUMN */}
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
                placeholder="Project name"
              />
            </div>

            {/* Description */}
            <div>
              <label className="admin-label">Description *</label>
              <textarea
                required
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="admin-textarea"
                rows={4}
                placeholder="What does this project do?"
              />
            </div>

            {/* Tech stack */}
            <div>
              <label className="admin-label">Tech Stack</label>
              <input
                type="text"
                value={techInput}
                onChange={(e) => handleTechChange(e.target.value)}
                className="admin-input"
                placeholder="Next.js, TypeScript, Prisma"
              />
              <p className="admin-hint">Comma-separated list of technologies</p>
              {form.tech.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                  {form.tech.map((t) => (
                    <span
                      key={t}
                      style={{
                        fontSize: '0.75rem',
                        padding: '3px 9px',
                        borderRadius: '4px',
                        background: 'var(--admin-surface-hover)',
                        color: 'var(--admin-text-secondary)',
                        border: '1px solid var(--admin-border)',
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Links */}
            <div className="admin-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <p className="admin-section-title" style={{ margin: 0 }}>Links</p>
              <div>
                <label className="admin-label">Demo URL</label>
                <input
                  type="text"
                  value={form.demoUrl}
                  onChange={(e) => setForm((f) => ({ ...f, demoUrl: e.target.value }))}
                  className="admin-input"
                  placeholder="https://demo.example.com"
                />
              </div>
              <div>
                <label className="admin-label">GitHub Repository</label>
                <input
                  type="text"
                  value={form.repo}
                  onChange={(e) => setForm((f) => ({ ...f, repo: e.target.value }))}
                  className="admin-input"
                  placeholder="https://github.com/user/repo"
                />
              </div>
              <div>
                <label className="admin-label">Related Article URL</label>
                <input
                  type="text"
                  value={form.articleUrl}
                  onChange={(e) => setForm((f) => ({ ...f, articleUrl: e.target.value }))}
                  className="admin-input"
                  placeholder="/blog/my-post-about-this-project"
                />
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Project Image */}
            <div>
              <label className="admin-label">Project Image</label>
              <ImageUpload
                value={form.image}
                onChange={(path) => setForm((f) => ({ ...f, image: path }))}
                folder="projects"
              />
            </div>

            {/* GitHub Stats */}
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                }}
              >
                <label className="admin-label" style={{ margin: 0 }}>GitHub Stats</label>
                {canSync && (
                  <button
                    type="button"
                    onClick={handleSync}
                    disabled={syncing || syncCooldown}
                    style={{
                      background: 'none',
                      border: '1px solid var(--admin-border)',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      fontSize: '0.75rem',
                      color: 'var(--admin-text-secondary)',
                      cursor: syncing || syncCooldown ? 'not-allowed' : 'pointer',
                      opacity: syncing || syncCooldown ? 0.5 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    {syncing ? '⏳ Syncing...' : '🔄 Sync'}
                  </button>
                )}
              </div>

              <div
                style={{
                  background: 'var(--admin-bg)',
                  border: '1px solid var(--admin-border)',
                  borderRadius: '10px',
                  padding: '16px',
                }}
              >
                {!form.repo ? (
                  <p style={{ fontSize: '0.8125rem', color: 'var(--admin-text-muted)', margin: 0 }}>
                    Add a GitHub repository URL above to see stats
                  </p>
                ) : !hasGitHub ? (
                  <p style={{ fontSize: '0.8125rem', color: 'var(--admin-text-muted)', margin: 0 }}>
                    {!project?.id
                      ? 'Save the project first, then sync'
                      : 'Not synced yet. Click Sync to fetch data.'}
                  </p>
                ) : (
                  <>
                    {/* Big stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div
                          style={{
                            fontSize: '1.75rem',
                            fontWeight: 700,
                            color: 'var(--admin-text-primary)',
                            lineHeight: 1,
                          }}
                        >
                          {github.stars ?? '—'}
                        </div>
                        <div
                          style={{
                            fontSize: '0.6875rem',
                            color: 'var(--admin-text-muted)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            marginTop: '4px',
                          }}
                        >
                          ⭐ stars
                        </div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div
                          style={{
                            fontSize: '1.75rem',
                            fontWeight: 700,
                            color: 'var(--admin-text-primary)',
                            lineHeight: 1,
                          }}
                        >
                          {github.forks ?? '—'}
                        </div>
                        <div
                          style={{
                            fontSize: '0.6875rem',
                            color: 'var(--admin-text-muted)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            marginTop: '4px',
                          }}
                        >
                          🍴 forks
                        </div>
                      </div>
                    </div>

                    {/* Detail rows */}
                    {[
                      { label: 'Created', value: formatDate(github.createdAt) },
                      { label: 'Updated', value: formatDate(github.updatedAt) },
                      { label: 'Language', value: github.language || '—' },
                    ].map(({ label, value }) => (
                      <div
                        key={label}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '5px 0',
                          fontSize: '0.8125rem',
                          borderTop: '1px solid var(--admin-border)',
                        }}
                      >
                        <span style={{ color: 'var(--admin-text-secondary)' }}>{label}</span>
                        <span style={{ color: 'var(--admin-text-primary)', fontWeight: 500 }}>
                          {value}
                        </span>
                      </div>
                    ))}

                    {github.syncedAt && (
                      <p
                        style={{
                          fontSize: '0.6875rem',
                          color: 'var(--admin-text-muted)',
                          marginTop: '10px',
                          marginBottom: 0,
                        }}
                      >
                        Synced {timeAgo(github.syncedAt)}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Settings */}
            <div className="admin-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <p className="admin-section-title" style={{ margin: 0 }}>Settings</p>

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
                  placeholder="my-project"
                />
              </div>

              {/* Year */}
              <div>
                <label className="admin-label">Year</label>
                <input
                  type="number"
                  value={form.year}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      year: e.target.value === '' ? '' : parseInt(e.target.value),
                    }))
                  }
                  className="admin-input"
                  placeholder="2026"
                  min={2000}
                  max={2099}
                />
              </div>

              {/* Sort Order */}
              <div>
                <label className="admin-label">Sort Order</label>
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))
                  }
                  className="admin-input"
                />
              </div>

              {/* Featured */}
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
                  style={{ width: '15px', height: '15px' }}
                />
                Featured
              </label>
            </div>

            {/* Danger zone */}
            {project?.id && (
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
                  🗑 Delete Project
                </button>
              </div>
            )}
          </div>
        </div>
      </form>
    </>
  )
}
