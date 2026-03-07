'use client'

import Link from 'next/link'
import { useEffect, useState, useCallback } from 'react'
import ConfirmModal from '@/components/admin/ConfirmModal'
import Toast from '@/components/admin/Toast'

interface Skill {
  id: string
  name: string
  slug: string
  icon: string | null
  category: string
  featured: boolean
  sortOrder: number
}

const CATEGORY_META: Record<string, { label: string; bg: string; color: string }> = {
  language:  { label: 'Language',  bg: 'rgba(88,166,255,0.12)',   color: '#58a6ff' },
  framework: { label: 'Framework', bg: 'rgba(163,113,247,0.12)',  color: '#a371f7' },
  database:  { label: 'Database',  bg: 'rgba(46,160,67,0.12)',    color: '#2ea043' },
  tool:      { label: 'Tool',      bg: 'rgba(210,153,34,0.12)',   color: '#d29922' },
  cloud:     { label: 'Cloud',     bg: 'rgba(56,200,200,0.12)',   color: '#38c8c8' },
  other:     { label: 'Other',     bg: 'rgba(136,136,136,0.12)', color: '#888888' },
}

export default function SkillsAdminPage() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteName, setDeleteName] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const fetchSkills = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (category) params.set('category', category)
      const res = await fetch(`/api/admin/skills?${params}`)
      const data = await res.json()
      setSkills(data.skills || [])
    } finally {
      setLoading(false)
    }
  }, [search, category])

  useEffect(() => {
    const timer = setTimeout(fetchSkills, 300)
    return () => clearTimeout(timer)
  }, [fetchSkills])

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/skills/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setToast({ message: 'Skill deleted', type: 'success' })
      fetchSkills()
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
        title="Delete Skill"
        message={`"${deleteName}" will be permanently deleted.`}
        onConfirm={handleDelete}
        onCancel={() => { setDeleteId(null); setDeleteName('') }}
        loading={deleting}
      />

      <div className="adm-list-header">
        <div>
          <h1>Skills</h1>
          <p>{skills.length} total &middot; technologies you work with</p>
        </div>
        <div className="adm-list-header-actions">
          <Link href="/admin/skills/new" className="admin-btn admin-btn-primary">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 2v12M2 8h12" strokeLinecap="round" /></svg>
            Add Skill
          </Link>
        </div>
      </div>

      <div className="adm-list-filters">
        <input type="text" placeholder="Search skills..." value={search} onChange={(e) => setSearch(e.target.value)} className="admin-input" />
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="admin-select">
          <option value="">All Categories</option>
          {Object.entries(CATEGORY_META).map(([val, meta]) => (
            <option key={val} value={val}>{meta.label}</option>
          ))}
        </select>
      </div>

      <div className="adm-list-table">
        {loading ? (
          <div className="adm-loading"><div className="adm-loading-spinner" />Loading skills...</div>
        ) : skills.length === 0 ? (
          <div className="adm-empty">
            <div className="adm-empty-icon"><svg width="24" height="24" viewBox="0 0 16 16" fill="currentColor"><path d="M6 .5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5V3h3.5a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-.5.5H10v3.5a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5V7H2.5a.5.5 0 0 1-.5-.5v-3a.5.5 0 0 1 .5-.5H6V.5z" /></svg></div>
            <div className="adm-empty-title">No skills yet</div>
            <p className="adm-empty-desc">Showcase the technologies you work with</p>
            <Link href="/admin/skills/new" className="admin-btn admin-btn-primary">Add First Skill</Link>
          </div>
        ) : (
          <table className="adm-table">
            <thead><tr className="adm-thead">
              <th className="adm-th" style={{ width: 48 }}></th>
              <th className="adm-th">Name</th>
              <th className="adm-th hidden sm:table-cell">Category</th>
              <th className="adm-th adm-th--center hidden md:table-cell">Featured</th>
              <th className="adm-th hidden md:table-cell">Order</th>
              <th className="adm-th adm-th--right">Actions</th>
            </tr></thead>
            <tbody>
              {skills.map((skill, i) => {
                const cat = CATEGORY_META[skill.category] || CATEGORY_META.other
                return (
                  <tr key={skill.id} className="adm-tr" style={{ animationDelay: `${i * 30}ms` }}>
                    <td className="adm-td" style={{ paddingRight: 0 }}>
                      {skill.icon ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={skill.icon} alt={skill.name} className="adm-skill-icon" />
                      ) : (
                        <div className="adm-skill-icon-placeholder">{skill.name[0]?.toUpperCase()}</div>
                      )}
                    </td>
                    <td className="adm-td"><span className="adm-td-title">{skill.name}</span></td>
                    <td className="adm-td hidden sm:table-cell">
                      <span className="adm-badge adm-badge--category" style={{ background: cat.bg, color: cat.color }}>{cat.label}</span>
                    </td>
                    <td className="adm-td adm-td--center hidden md:table-cell">
                      <span className={`adm-featured-dot ${skill.featured ? 'adm-featured-dot--yes' : 'adm-featured-dot--no'}`} />
                    </td>
                    <td className="adm-td adm-td--muted hidden md:table-cell">{skill.sortOrder}</td>
                    <td className="adm-td adm-td--right">
                      <div className="adm-actions">
                        <Link href={`/admin/skills/${skill.id}/edit`} className="adm-action-edit">
                          <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M12.146.854a.5.5 0 0 1 .708 0l2.292 2.292a.5.5 0 0 1 0 .708l-9.146 9.146H3.5a.5.5 0 0 1-.5-.5v-2.5L12.146.854zM2 13h12v1H2v-1z"/></svg>
                          Edit
                        </Link>
                        <button onClick={() => { setDeleteId(skill.id); setDeleteName(skill.name) }} className="adm-action-delete">
                          <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4L4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
