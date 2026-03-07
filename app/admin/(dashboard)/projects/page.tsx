'use client'

import Link from 'next/link'
import { useEffect, useState, useCallback } from 'react'
import ConfirmModal from '@/components/admin/ConfirmModal'
import Toast from '@/components/admin/Toast'

interface Project {
  id: string
  name: string
  slug: string
  description: string
  image: string | null
  tech: string[]
  featured: boolean
  sortOrder: number
  githubStars: number | null
  githubForks: number | null
  githubUpdatedAt: string | null
}

function timeAgo(iso: string | null): string {
  if (!iso) return '\u2014'
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}

export default function ProjectsAdminPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteTitle, setDeleteTitle] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [syncingAll, setSyncingAll] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const fetchProjects = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      const res = await fetch(`/api/admin/projects?${params}`)
      const data = await res.json()
      setProjects(data.projects || [])
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    const timer = setTimeout(fetchProjects, 300)
    return () => clearTimeout(timer)
  }, [fetchProjects])

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/projects/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setToast({ message: 'Project deleted', type: 'success' })
      fetchProjects()
    } catch {
      setToast({ message: 'Failed to delete', type: 'error' })
    } finally {
      setDeleting(false)
      setDeleteId(null)
      setDeleteTitle('')
    }
  }

  async function handleSyncAll() {
    setSyncingAll(true)
    try {
      const res = await fetch('/api/admin/projects/github-sync-all', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Sync failed')
      setToast({ message: `Synced ${data.synced}/${data.total} projects`, type: 'success' })
      fetchProjects()
    } catch (err) {
      setToast({ message: String(err instanceof Error ? err.message : err), type: 'error' })
    } finally {
      setSyncingAll(false)
    }
  }

  return (
    <div className="adm-page-in">
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
      <ConfirmModal
        isOpen={!!deleteId}
        title="Delete Project"
        message={`"${deleteTitle}" will be permanently deleted. This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => { setDeleteId(null); setDeleteTitle('') }}
        loading={deleting}
      />

      <div className="adm-list-header">
        <div>
          <h1>Projects</h1>
          <p>{projects.length} total</p>
        </div>
        <div className="adm-list-header-actions">
          <button onClick={handleSyncAll} disabled={syncingAll} className="admin-btn admin-btn-secondary">
            {syncingAll ? (
              <><span className="adm-spinner adm-spinner--sm" /> Syncing...</>
            ) : (
              <><svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41zm-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9z"/><path fillRule="evenodd" d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5.002 5.002 0 0 0 8 3zM3.1 9a5.002 5.002 0 0 0 8.757 2.182.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9H3.1z"/></svg> Sync All</>
            )}
          </button>
          <Link href="/admin/projects/new" className="admin-btn admin-btn-primary">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 2v12M2 8h12" strokeLinecap="round" /></svg>
            New Project
          </Link>
        </div>
      </div>

      <div className="adm-list-filters">
        <input type="text" placeholder="Search projects..." value={search} onChange={(e) => setSearch(e.target.value)} className="admin-input" />
      </div>

      <div className="adm-list-table">
        {loading ? (
          <div className="adm-loading"><div className="adm-loading-spinner" />Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className="adm-empty">
            <div className="adm-empty-icon"><svg width="24" height="24" viewBox="0 0 16 16" fill="currentColor"><path d="M9.828.722a.5.5 0 0 1 .354.146l4.95 4.95a.5.5 0 0 1 0 .707l-8.485 8.485a.5.5 0 0 1-.354.147H1.5A1.5 1.5 0 0 1 0 13.657V8.83a.5.5 0 0 1 .146-.354L8.83.722a.5.5 0 0 1 .998 0zM3 11a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/></svg></div>
            <div className="adm-empty-title">No projects yet</div>
            <p className="adm-empty-desc">Showcase something you built</p>
            <Link href="/admin/projects/new" className="admin-btn admin-btn-primary">Create Project</Link>
          </div>
        ) : (
          <table className="adm-table">
            <thead><tr className="adm-thead">
              <th className="adm-th" style={{ width: 56 }}></th>
              <th className="adm-th">Name</th>
              <th className="adm-th hidden sm:table-cell">Tech</th>
              <th className="adm-th adm-th--center hidden md:table-cell">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style={{ verticalAlign: -2 }}><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25z"/></svg>
              </th>
              <th className="adm-th adm-th--center hidden md:table-cell">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style={{ verticalAlign: -2 }}><path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0zM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5zM8 12.25a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5z"/></svg>
              </th>
              <th className="adm-th hidden lg:table-cell">Updated</th>
              <th className="adm-th adm-th--right">Actions</th>
            </tr></thead>
            <tbody>
              {projects.map((project, i) => (
                <tr key={project.id} className="adm-tr" style={{ animationDelay: `${i * 30}ms` }}>
                  <td className="adm-td" style={{ paddingRight: 0 }}>
                    {project.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={project.image} alt={project.name} className="adm-thumb" />
                    ) : (
                      <div className="adm-thumb-placeholder">
                        <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor"><path d="M9.828.722a.5.5 0 0 1 .354.146l4.95 4.95a.5.5 0 0 1 0 .707l-8.485 8.485a.5.5 0 0 1-.354.147H1.5A1.5 1.5 0 0 1 0 13.657V8.83a.5.5 0 0 1 .146-.354L8.83.722a.5.5 0 0 1 .998 0zM3 11a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/></svg>
                      </div>
                    )}
                  </td>
                  <td className="adm-td">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="adm-td-title">{project.name}</span>
                      {project.featured && <span className="adm-badge adm-badge--featured">featured</span>}
                    </div>
                    <div className="adm-td-slug adm-truncate" style={{ maxWidth: 280 }}>{project.description}</div>
                  </td>
                  <td className="adm-td hidden sm:table-cell">
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {project.tech.slice(0, 3).map((t) => (
                        <span key={t} className="adm-tech-pill">{t}</span>
                      ))}
                    </div>
                  </td>
                  <td className="adm-td adm-td--center hidden md:table-cell">
                    <span className="adm-gh-stat">{project.githubStars ?? '\u2014'}</span>
                  </td>
                  <td className="adm-td adm-td--center hidden md:table-cell">
                    <span className="adm-gh-stat">{project.githubForks ?? '\u2014'}</span>
                  </td>
                  <td className="adm-td adm-td--muted hidden lg:table-cell">{timeAgo(project.githubUpdatedAt)}</td>
                  <td className="adm-td adm-td--right">
                    <div className="adm-actions">
                      <Link href={`/admin/projects/${project.id}/edit`} className="adm-action-edit">
                        <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M12.146.854a.5.5 0 0 1 .708 0l2.292 2.292a.5.5 0 0 1 0 .708l-9.146 9.146H3.5a.5.5 0 0 1-.5-.5v-2.5L12.146.854zM2 13h12v1H2v-1z"/></svg>
                        Edit
                      </Link>
                      <button onClick={() => { setDeleteId(project.id); setDeleteTitle(project.name) }} className="adm-action-delete">
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
