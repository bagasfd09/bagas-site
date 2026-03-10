'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Toast from './Toast'
import ImageUpload from './ui/ImageUpload'

interface ProjectItem {
  name: string
  logo: string
  url: string
}

interface ExperienceData {
  id?: string
  title: string
  company: string
  companyLogo: string
  location: string
  startDate: string
  endDate: string
  current: boolean
  description: string
  tech: string
  projects: ProjectItem[]
  sortOrder: number | ''
}

interface ExperienceFormProps {
  experience?: {
    id: string
    title: string
    company: string
    companyLogo: string | null
    location: string | null
    startDate: string | Date
    endDate: string | Date | null
    current: boolean
    description: string | null
    tech: string[]
    projects: ProjectItem[]
    sortOrder: number
  }
}

function toDateInput(d: string | Date | null | undefined): string {
  if (!d) return ''
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toISOString().split('T')[0]
}

export default function ExperienceForm({ experience }: ExperienceFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const [form, setForm] = useState<ExperienceData>({
    title: experience?.title || '',
    company: experience?.company || '',
    companyLogo: experience?.companyLogo || '',
    location: experience?.location || '',
    startDate: toDateInput(experience?.startDate),
    endDate: toDateInput(experience?.endDate),
    current: experience?.current ?? false,
    description: experience?.description || '',
    tech: experience?.tech?.join(', ') || '',
    projects: experience?.projects || [],
    sortOrder: experience?.sortOrder ?? '',
  })

  function addProject() {
    setForm((f) => ({
      ...f,
      projects: [...f.projects, { name: '', logo: '', url: '' }],
    }))
  }

  function updateProject(index: number, field: keyof ProjectItem, value: string) {
    setForm((f) => ({
      ...f,
      projects: f.projects.map((p, i) => (i === index ? { ...p, [field]: value } : p)),
    }))
  }

  function removeProject(index: number) {
    setForm((f) => ({
      ...f,
      projects: f.projects.filter((_, i) => i !== index),
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const url = experience?.id
        ? `/api/admin/experiences/${experience.id}`
        : '/api/admin/experiences'
      const method = experience?.id ? 'PUT' : 'POST'

      const payload = {
        title: form.title,
        company: form.company,
        companyLogo: form.companyLogo || null,
        location: form.location || null,
        startDate: form.startDate,
        endDate: form.current ? null : form.endDate || null,
        current: form.current,
        description: form.description || null,
        tech: form.tech
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        projects: form.projects.filter((p) => p.name.trim()),
        sortOrder: form.sortOrder === '' ? null : form.sortOrder,
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

      setToast({ message: 'Experience saved successfully', type: 'success' })
      setTimeout(() => {
        router.push('/admin/experiences')
        router.refresh()
      }, 800)
    } catch (err) {
      setToast({ message: String(err instanceof Error ? err.message : err), type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!experience?.id) return
    if (!confirm(`Delete "${form.title} at ${form.company}"? This cannot be undone.`)) return
    try {
      const res = await fetch(`/api/admin/experiences/${experience.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      router.push('/admin/experiences')
      router.refresh()
    } catch {
      setToast({ message: 'Failed to delete', type: 'error' })
    }
  }

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}

      <form onSubmit={handleSubmit}>
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
            &larr; Back to Experiences
          </button>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={() => router.back()} className="admin-btn admin-btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="admin-btn admin-btn-primary">
              {loading ? 'Saving...' : experience?.id ? 'Update' : 'Create'}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '640px' }}>
          {/* Title */}
          <div>
            <label className="admin-label">Job Title *</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="admin-input"
              placeholder="Backend Developer"
            />
          </div>

          {/* Company + Location */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label className="admin-label">Company *</label>
              <input
                type="text"
                required
                value={form.company}
                onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                className="admin-input"
                placeholder="PT. Telkom Indonesia"
              />
            </div>
            <div>
              <label className="admin-label">Location</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                className="admin-input"
                placeholder="Jakarta, Indonesia"
              />
            </div>
          </div>

          {/* Company Logo */}
          <div>
            <label className="admin-label">Company Logo</label>
            <p className="admin-hint" style={{ marginBottom: '8px' }}>
              Auto-compressed to 128×128 WebP. Max 2MB upload.
            </p>
            <ImageUpload
              value={form.companyLogo}
              onChange={(path) => setForm((f) => ({ ...f, companyLogo: path }))}
              folder="company-logos"
              accept="image/*"
              acceptHint="PNG, JPG, SVG, WebP up to 2MB (auto-compressed)"
              compress="logo"
            />
          </div>

          {/* Dates + Current */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '14px', alignItems: 'end' }}>
            <div>
              <label className="admin-label">Start Date *</label>
              <input
                type="date"
                required
                value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                className="admin-input"
              />
            </div>
            <div>
              <label className="admin-label">End Date</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                className="admin-input"
                disabled={form.current}
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
                whiteSpace: 'nowrap',
              }}
            >
              <input
                type="checkbox"
                checked={form.current}
                onChange={(e) => setForm((f) => ({ ...f, current: e.target.checked, endDate: '' }))}
                style={{ width: '15px', height: '15px' }}
              />
              Current
            </label>
          </div>

          {/* Description */}
          <div>
            <label className="admin-label">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="admin-textarea"
              rows={6}
              placeholder="What did you work on? Use new lines for bullet points."
            />
          </div>

          {/* Tech */}
          <div>
            <label className="admin-label">Tech Stack</label>
            <input
              type="text"
              value={form.tech}
              onChange={(e) => setForm((f) => ({ ...f, tech: e.target.value }))}
              className="admin-input"
              placeholder="Go, PostgreSQL, Redis, Docker"
            />
            <p className="admin-hint">Comma-separated list of technologies</p>
          </div>

          {/* Projects */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label className="admin-label" style={{ marginBottom: 0 }}>Projects</label>
              <button
                type="button"
                onClick={addProject}
                className="admin-btn admin-btn-secondary"
                style={{ fontSize: '0.75rem', padding: '4px 10px' }}
              >
                + Add Project
              </button>
            </div>
            <p className="admin-hint" style={{ marginBottom: '10px' }}>
              Projects you worked on at this company. Logo auto-compressed to 128×128 WebP.
            </p>
            {form.projects.length === 0 && (
              <p style={{ fontSize: '0.8125rem', color: 'var(--admin-text-muted)', fontStyle: 'italic' }}>
                No projects added yet.
              </p>
            )}
            {form.projects.map((project, i) => (
              <div
                key={i}
                style={{
                  border: '1px solid var(--admin-border)',
                  borderRadius: '10px',
                  padding: '14px',
                  marginBottom: '10px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--admin-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Project {i + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeProject(i)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--admin-danger)',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      padding: 0,
                    }}
                  >
                    Remove
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <label className="admin-label" style={{ fontSize: '0.75rem' }}>Name *</label>
                    <input
                      type="text"
                      value={project.name}
                      onChange={(e) => updateProject(i, 'name', e.target.value)}
                      className="admin-input"
                      placeholder="SGK Performance Hub"
                    />
                  </div>
                  <div>
                    <label className="admin-label" style={{ fontSize: '0.75rem' }}>Logo</label>
                    <ImageUpload
                      value={project.logo}
                      onChange={(path) => updateProject(i, 'logo', path)}
                      folder="project-logos"
                      accept="image/*"
                      acceptHint="PNG, JPG, SVG, WebP (auto-compressed)"
                      compress="logo"
                    />
                  </div>
                  <div>
                    <label className="admin-label" style={{ fontSize: '0.75rem' }}>URL (optional)</label>
                    <input
                      type="text"
                      value={project.url}
                      onChange={(e) => updateProject(i, 'url', e.target.value)}
                      className="admin-input"
                      placeholder="https://example.com"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Sort Order */}
          <div style={{ maxWidth: '200px' }}>
            <label className="admin-label">Sort Order</label>
            <input
              type="number"
              value={form.sortOrder}
              onChange={(e) =>
                setForm((f) => ({ ...f, sortOrder: e.target.value === '' ? '' : parseInt(e.target.value) || 0 }))
              }
              className="admin-input"
              placeholder="Auto"
              min={0}
            />
            <p className="admin-hint">Lower number = shown first. Same company roles are grouped together.</p>
          </div>

          {/* Danger zone */}
          {experience?.id && (
            <div
              style={{
                border: '1px solid rgba(248,81,73,0.3)',
                borderRadius: '10px',
                padding: '14px 16px',
                marginTop: '8px',
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
                Delete Experience
              </button>
            </div>
          )}
        </div>
      </form>
    </>
  )
}
