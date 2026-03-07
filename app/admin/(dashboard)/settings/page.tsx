'use client'

import { useEffect, useState } from 'react'
import Toast from '@/components/admin/Toast'

interface Settings {
  name: string
  siteName: string
  tagline: string
  heroIntro: string
  heroImage: string
  sidebarBio: string
  github: string
  linkedin: string
  twitter: string
  email: string
  bluesky: string
  rssEnabled: boolean
  bio: string
}

const defaultSettings: Settings = {
  name: '',
  siteName: '',
  tagline: '',
  heroIntro: '',
  heroImage: '',
  sidebarBio: '',
  github: '',
  linkedin: '',
  twitter: '',
  email: '',
  bluesky: '',
  rssEnabled: true,
  bio: '',
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="admin-card" style={{ padding: '20px 24px', marginBottom: '16px' }}>
      <div style={{ marginBottom: '18px' }}>
        <h2 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--admin-text-primary)', margin: 0 }}>
          {title}
        </h2>
        {description && (
          <p style={{ fontSize: '0.8125rem', color: 'var(--admin-text-secondary)', marginTop: '4px' }}>
            {description}
          </p>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>{children}</div>
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="admin-label">{label}</label>
      {children}
      {hint && <p className="admin-hint">{hint}</p>}
    </div>
  )
}

export default function SettingsPage() {
  const [form, setForm] = useState<Settings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((data) => {
        setForm({
          name: data.name || '',
          siteName: data.siteName || '',
          tagline: data.tagline || '',
          heroIntro: data.heroIntro || '',
          heroImage: data.heroImage || '',
          sidebarBio: data.sidebarBio || '',
          github: data.github || '',
          linkedin: data.linkedin || '',
          twitter: data.twitter || '',
          email: data.email || '',
          bluesky: data.bluesky || '',
          rssEnabled: data.rssEnabled ?? true,
          bio: data.bio || '',
        })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Failed to save')
      setToast({ message: 'Settings saved successfully', type: 'success' })
    } catch {
      setToast({ message: 'Failed to save settings', type: 'error' })
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

      <div style={{ marginBottom: '28px' }}>
        <h1
          style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            color: 'var(--admin-text-primary)',
            margin: 0,
          }}
        >
          Site Settings
        </h1>
        <p style={{ fontSize: '0.8125rem', color: 'var(--admin-text-secondary)', marginTop: '4px' }}>
          Configure your site metadata and social links
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Section title="Identity" description="Your personal information shown across the site">
          <Field label="Display Name">
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="admin-input"
              placeholder="Bagas"
            />
          </Field>
          <Field label="Site Name">
            <input
              type="text"
              value={form.siteName}
              onChange={(e) => setForm((f) => ({ ...f, siteName: e.target.value }))}
              className="admin-input"
              placeholder="bagas.dev"
            />
          </Field>
          <Field label="Tagline">
            <input
              type="text"
              value={form.tagline}
              onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))}
              className="admin-input"
              placeholder="Software developer"
            />
          </Field>
        </Section>

        <Section title="Homepage" description="Content shown on the homepage hero section">
          <Field label="Hero Introduction">
            <textarea
              value={form.heroIntro}
              onChange={(e) => setForm((f) => ({ ...f, heroIntro: e.target.value }))}
              className="admin-textarea"
              rows={3}
              placeholder="Short intro shown in the hero section..."
            />
          </Field>
          <Field
            label="Mascot / Hero Image URL"
            hint="Leave blank to use the default SVG mascot"
          >
            <input
              type="url"
              value={form.heroImage}
              onChange={(e) => setForm((f) => ({ ...f, heroImage: e.target.value }))}
              className="admin-input"
              placeholder="https://example.com/mascot.png"
            />
          </Field>
          <Field label="Sidebar Bio">
            <textarea
              value={form.sidebarBio}
              onChange={(e) => setForm((f) => ({ ...f, sidebarBio: e.target.value }))}
              className="admin-textarea"
              rows={3}
              placeholder="Short bio shown in the sidebar..."
            />
          </Field>
        </Section>

        <Section title="Social Links">
          {[
            { key: 'github', label: 'GitHub URL', placeholder: 'https://github.com/username' },
            { key: 'linkedin', label: 'LinkedIn URL', placeholder: 'https://linkedin.com/in/username' },
            { key: 'twitter', label: 'Twitter URL', placeholder: 'https://twitter.com/username' },
            { key: 'email', label: 'Email Address', placeholder: 'hello@example.com' },
            { key: 'bluesky', label: 'Bluesky URL', placeholder: 'https://bsky.app/profile/username' },
          ].map(({ key, label, placeholder }) => (
            <Field key={key} label={label}>
              <input
                type={key === 'email' ? 'email' : 'text'}
                value={form[key as keyof Settings] as string}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                className="admin-input"
                placeholder={placeholder}
              />
            </Field>
          ))}
        </Section>

        <Section title="Options">
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              color: 'var(--admin-text-primary)',
            }}
          >
            <input
              type="checkbox"
              checked={form.rssEnabled}
              onChange={(e) => setForm((f) => ({ ...f, rssEnabled: e.target.checked }))}
              className="admin-checkbox"
              style={{ width: '16px', height: '16px' }}
            />
            Enable RSS Feed
          </label>
        </Section>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="submit"
            disabled={saving}
            className="admin-btn admin-btn-primary"
            style={{ padding: '10px 24px' }}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  )
}
