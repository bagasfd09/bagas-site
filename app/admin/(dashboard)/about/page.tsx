'use client'

import { useEffect, useState } from 'react'
import Toast from '@/components/admin/Toast'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function AboutEditorPage() {
  const [bio, setBio] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((data) => {
        setBio(data.bio || '')
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      const settingsRes = await fetch('/api/admin/settings')
      const settings = await settingsRes.json()

      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...settings, bio }),
      })

      if (!res.ok) throw new Error('Failed to save')
      setToast({ message: 'About page updated', type: 'success' })
    } catch {
      setToast({ message: 'Failed to save', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px',
          color: 'var(--admin-text-muted)',
          fontSize: '0.875rem',
        }}
      >
        Loading...
      </div>
    )
  }

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: '24px',
          gap: '16px',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: 'var(--admin-text-primary)',
              margin: 0,
            }}
          >
            About Me
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--admin-text-secondary)', marginTop: '4px' }}>
            Edit your About Me page content — supports Markdown
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="admin-btn admin-btn-primary"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
        }}
        className="block lg:grid"
      >
        {/* Editor */}
        <div>
          <p className="admin-section-title">Markdown Editor</p>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="admin-textarea"
            style={{
              height: '600px',
              fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
              fontSize: '0.8125rem',
              resize: 'none',
            }}
            placeholder={'# About Me\n\nWrite your bio here...'}
          />
        </div>

        {/* Preview */}
        <div>
          <p className="admin-section-title">Preview</p>
          <div
            className="admin-card prose"
            style={{
              height: '600px',
              overflowY: 'auto',
              padding: '16px 20px',
              fontSize: '0.875rem',
            }}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{bio}</ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  )
}
