'use client'

import Link from 'next/link'
import { useEffect, useState, useCallback } from 'react'
import ConfirmModal from '@/components/admin/ConfirmModal'
import Toast from '@/components/admin/Toast'

interface Experience {
  id: string
  title: string
  company: string
  companyLogo: string | null
  location: string | null
  startDate: string
  endDate: string | null
  current: boolean
  tech: string[]
  projects: { name: string; logo?: string; url?: string }[]
  sortOrder: number
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

export default function ExperiencesAdminPage() {
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteName, setDeleteName] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const fetchExperiences = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/experiences')
      const data = await res.json()
      setExperiences(data.experiences || [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchExperiences()
  }, [fetchExperiences])

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/experiences/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setToast({ message: 'Experience deleted', type: 'success' })
      fetchExperiences()
    } catch {
      setToast({ message: 'Failed to delete', type: 'error' })
    } finally {
      setDeleting(false)
      setDeleteId(null)
      setDeleteName('')
    }
  }

  return (
    <div className="adm-page-in">
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
      <ConfirmModal
        isOpen={!!deleteId}
        title="Delete Experience"
        message={`"${deleteName}" will be permanently deleted.`}
        onConfirm={handleDelete}
        onCancel={() => { setDeleteId(null); setDeleteName('') }}
        loading={deleting}
      />

      <div className="adm-list-header">
        <div>
          <h1>Experiences</h1>
          <p>{experiences.length} total &middot; your work history</p>
        </div>
        <div className="adm-list-header-actions">
          <Link href="/admin/experiences/new" className="admin-btn admin-btn-primary">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 2v12M2 8h12" strokeLinecap="round" /></svg>
            Add Experience
          </Link>
        </div>
      </div>

      <div className="adm-list-table">
        {loading ? (
          <div className="adm-loading"><div className="adm-loading-spinner" />Loading experiences...</div>
        ) : experiences.length === 0 ? (
          <div className="adm-empty">
            <div className="adm-empty-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg></div>
            <div className="adm-empty-title">No experiences yet</div>
            <p className="adm-empty-desc">Add your work history to show on your portfolio</p>
            <Link href="/admin/experiences/new" className="admin-btn admin-btn-primary">Add First Experience</Link>
          </div>
        ) : (
          <table className="adm-table">
            <thead><tr className="adm-thead">
              <th className="adm-th">Title</th>
              <th className="adm-th">Company</th>
              <th className="adm-th hidden sm:table-cell">Period</th>
              <th className="adm-th hidden md:table-cell">Order</th>
              <th className="adm-th adm-th--right">Actions</th>
            </tr></thead>
            <tbody>
              {experiences.map((exp, i) => (
                <tr key={exp.id} className="adm-tr" style={{ animationDelay: `${i * 30}ms` }}>
                  <td className="adm-td">
                    <span className="adm-td-title">{exp.title}</span>
                    {exp.current && (
                      <span className="adm-badge" style={{ background: 'rgba(46,160,67,0.12)', color: '#2ea043', marginLeft: '8px' }}>Current</span>
                    )}
                  </td>
                  <td className="adm-td">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {exp.companyLogo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={exp.companyLogo} alt="" style={{ width: 24, height: 24, borderRadius: 6, objectFit: 'cover' }} />
                      ) : (
                        <span style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--admin-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, color: 'var(--admin-text-muted)', flexShrink: 0 }}>
                          {exp.company.charAt(0)}
                        </span>
                      )}
                      <div>
                        <span style={{ color: 'var(--admin-text-secondary)' }}>{exp.company}</span>
                        {exp.projects?.length > 0 && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--admin-text-muted)', marginLeft: '6px' }}>
                            ({exp.projects.length} project{exp.projects.length > 1 ? 's' : ''})
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="adm-td adm-td--muted hidden sm:table-cell">
                    {formatDate(exp.startDate)} — {exp.current ? 'Present' : exp.endDate ? formatDate(exp.endDate) : ''}
                  </td>
                  <td className="adm-td adm-td--muted hidden md:table-cell">{exp.sortOrder}</td>
                  <td className="adm-td adm-td--right">
                    <div className="adm-actions">
                      <Link href={`/admin/experiences/${exp.id}/edit`} className="adm-action-edit">
                        <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M12.146.854a.5.5 0 0 1 .708 0l2.292 2.292a.5.5 0 0 1 0 .708l-9.146 9.146H3.5a.5.5 0 0 1-.5-.5v-2.5L12.146.854zM2 13h12v1H2v-1z"/></svg>
                        Edit
                      </Link>
                      <button onClick={() => { setDeleteId(exp.id); setDeleteName(`${exp.title} at ${exp.company}`) }} className="adm-action-delete">
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
