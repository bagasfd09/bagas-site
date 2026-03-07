'use client'

import Link from 'next/link'
import { useEffect, useState, useCallback } from 'react'
import { formatDateShort } from '@/lib/utils'
import ConfirmModal from '@/components/admin/ConfirmModal'
import Toast from '@/components/admin/Toast'

interface Note {
  id: string
  title: string
  slug: string
  published: boolean
  createdAt: string
  tags: string[]
}

export default function NotesAdminPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteTitle, setDeleteTitle] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const fetchNotes = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ status })
      if (search) params.set('search', search)
      const res = await fetch(`/api/admin/notes?${params}`)
      const data = await res.json()
      setNotes(data.notes || [])
      setTotal(data.total || 0)
    } finally {
      setLoading(false)
    }
  }, [search, status])

  useEffect(() => {
    const timer = setTimeout(fetchNotes, 300)
    return () => clearTimeout(timer)
  }, [fetchNotes])

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/notes/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setToast({ message: 'Note deleted', type: 'success' })
      fetchNotes()
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
        title="Delete Note"
        message={`"${deleteTitle}" will be permanently deleted. This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => { setDeleteId(null); setDeleteTitle('') }}
        loading={deleting}
      />

      <div className="adm-list-header">
        <div>
          <h1>Notes</h1>
          <p>{total} total &middot; reference notes and guides</p>
        </div>
        <div className="adm-list-header-actions">
          <Link href="/admin/notes/new" className="admin-btn admin-btn-primary">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 2v12M2 8h12" strokeLinecap="round" /></svg>
            New Note
          </Link>
        </div>
      </div>

      <div className="adm-list-filters">
        <input type="text" placeholder="Search notes..." value={search} onChange={(e) => setSearch(e.target.value)} className="admin-input" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="admin-select">
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      <div className="adm-list-table">
        {loading ? (
          <div className="adm-loading"><div className="adm-loading-spinner" />Loading notes...</div>
        ) : notes.length === 0 ? (
          <div className="adm-empty">
            <div className="adm-empty-icon"><svg width="24" height="24" viewBox="0 0 16 16" fill="currentColor"><path d="M5 0a.5.5 0 0 1 .5.5V2h5V.5a.5.5 0 0 1 1 0V2h1A1.5 1.5 0 0 1 14 3.5v11a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 14.5v-11A1.5 1.5 0 0 1 3.5 2h1V.5A.5.5 0 0 1 5 0zM4 5v1h8V5H4zm0 3v1h8V8H4zm0 3v1h5v-1H4z" /></svg></div>
            <div className="adm-empty-title">No notes yet</div>
            <p className="adm-empty-desc">Capture something you learned today</p>
            <Link href="/admin/notes/new" className="admin-btn admin-btn-primary">Create Note</Link>
          </div>
        ) : (
          <table className="adm-table">
            <thead><tr className="adm-thead">
              <th className="adm-th">Title</th>
              <th className="adm-th hidden sm:table-cell">Tags</th>
              <th className="adm-th hidden md:table-cell">Status</th>
              <th className="adm-th hidden lg:table-cell">Date</th>
              <th className="adm-th adm-th--right">Actions</th>
            </tr></thead>
            <tbody>
              {notes.map((note, i) => (
                <tr key={note.id} className="adm-tr" style={{ animationDelay: `${i * 30}ms` }}>
                  <td className="adm-td">
                    <div className="adm-td-title">{note.title}</div>
                    <div className="adm-td-slug">/notes/{note.slug}</div>
                  </td>
                  <td className="adm-td hidden sm:table-cell">
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {note.tags.slice(0, 3).map((t) => (
                        <span key={t} className="adm-tag">{t}</span>
                      ))}
                    </div>
                  </td>
                  <td className="adm-td hidden md:table-cell">
                    <span className={`adm-badge ${note.published ? 'adm-badge--published' : 'adm-badge--draft'}`}>
                      <span className={`adm-status-dot ${note.published ? 'adm-status-dot--success' : 'adm-status-dot--warning'}`} style={{ width: 6, height: 6 }} />
                      {note.published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="adm-td adm-td--muted hidden lg:table-cell">{formatDateShort(note.createdAt)}</td>
                  <td className="adm-td adm-td--right">
                    <div className="adm-actions">
                      <Link href={`/admin/notes/${note.id}/edit`} className="adm-action-edit">
                        <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M12.146.854a.5.5 0 0 1 .708 0l2.292 2.292a.5.5 0 0 1 0 .708l-9.146 9.146H3.5a.5.5 0 0 1-.5-.5v-2.5L12.146.854zM2 13h12v1H2v-1z"/></svg>
                        Edit
                      </Link>
                      <button onClick={() => { setDeleteId(note.id); setDeleteTitle(note.title) }} className="adm-action-delete">
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
