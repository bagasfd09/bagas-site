'use client'

import { useEffect, useState } from 'react'
import {
  Globe,
  User,
  Layout,
  Link2,
  ToggleLeft,
  Briefcase,
  FileText,
  StickyNote,
  Cpu,
  FolderKanban,
  Rss,
  Save,
  GripVertical,
  ChevronUp,
  ChevronDown,
} from 'lucide-react'
import Toast from '@/components/admin/Toast'

interface Settings {
  name: string
  siteName: string
  tagline: string
  heroIntro: string
  heroImage: string
  cvUrl: string
  sidebarBio: string
  github: string
  linkedin: string
  twitter: string
  email: string
  bluesky: string
  rssEnabled: boolean
  bio: string
  showExperience: boolean
  showBlog: boolean
  showNotes: boolean
  showSkills: boolean
  showProjects: boolean
  orderExperience: number
  orderBlog: number
  orderNotes: number
  orderSkills: number
  orderProjects: number
}

const defaultSettings: Settings = {
  name: '',
  siteName: '',
  tagline: '',
  heroIntro: '',
  heroImage: '',
  cvUrl: '',
  sidebarBio: '',
  github: '',
  linkedin: '',
  twitter: '',
  email: '',
  bluesky: '',
  rssEnabled: true,
  bio: '',
  showExperience: true,
  showBlog: true,
  showNotes: true,
  showSkills: true,
  showProjects: true,
  orderExperience: 0,
  orderBlog: 1,
  orderNotes: 2,
  orderSkills: 3,
  orderProjects: 4,
}

type TabKey = 'general' | 'homepage' | 'social' | 'sections'

const tabs: { key: TabKey; label: string; icon: typeof Globe }[] = [
  { key: 'general', label: 'General', icon: Globe },
  { key: 'homepage', label: 'Homepage', icon: Layout },
  { key: 'sections', label: 'Sections', icon: ToggleLeft },
  { key: 'social', label: 'Social', icon: Link2 },
]

function SectionCard({ title, desc, icon: Icon, children }: {
  title: string
  desc?: string
  icon?: typeof Globe
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        background: 'var(--admin-surface)',
        border: '1px solid var(--admin-border)',
        borderRadius: '14px',
        padding: '24px',
        marginBottom: '16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        {Icon && (
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'var(--admin-accent-muted, rgba(88,166,255,0.08))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon size={16} style={{ color: 'var(--admin-accent)' }} />
          </div>
        )}
        <div>
          <h2 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--admin-text-primary)', margin: 0 }}>
            {title}
          </h2>
          {desc && (
            <p style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', marginTop: '2px' }}>{desc}</p>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>{children}</div>
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

function ToggleSwitch({
  label,
  desc,
  icon: Icon,
  checked,
  onChange,
}: {
  label: string
  desc: string
  icon: typeof Globe
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        padding: '14px 16px',
        borderRadius: '10px',
        border: `1px solid ${checked ? 'var(--admin-accent)' : 'var(--admin-border)'}`,
        background: checked ? 'rgba(88,166,255,0.04)' : 'transparent',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      }}
    >
      <div
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '9px',
          background: checked ? 'rgba(88,166,255,0.1)' : 'var(--admin-bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'all 0.15s ease',
        }}
      >
        <Icon size={18} style={{ color: checked ? 'var(--admin-accent)' : 'var(--admin-text-muted)', transition: 'color 0.15s' }} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--admin-text-primary)' }}>{label}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', marginTop: '1px' }}>{desc}</div>
      </div>
      <div
        style={{
          width: '42px',
          height: '24px',
          borderRadius: '12px',
          background: checked ? 'var(--admin-accent)' : 'var(--admin-border)',
          position: 'relative',
          transition: 'background 0.2s ease',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            background: '#fff',
            position: 'absolute',
            top: '3px',
            left: checked ? '21px' : '3px',
            transition: 'left 0.2s ease',
            boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
          }}
        />
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const [form, setForm] = useState<Settings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<TabKey>('general')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [original, setOriginal] = useState<Settings>(defaultSettings)

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((data) => {
        const s: Settings = {
          name: data.name || '',
          siteName: data.siteName || '',
          tagline: data.tagline || '',
          heroIntro: data.heroIntro || '',
          heroImage: data.heroImage || '',
          cvUrl: data.cvUrl || '',
          sidebarBio: data.sidebarBio || '',
          github: data.github || '',
          linkedin: data.linkedin || '',
          twitter: data.twitter || '',
          email: data.email || '',
          bluesky: data.bluesky || '',
          rssEnabled: data.rssEnabled ?? true,
          bio: data.bio || '',
          showExperience: data.showExperience ?? true,
          showBlog: data.showBlog ?? true,
          showNotes: data.showNotes ?? true,
          showSkills: data.showSkills ?? true,
          showProjects: data.showProjects ?? true,
          orderExperience: data.orderExperience ?? 0,
          orderBlog: data.orderBlog ?? 1,
          orderNotes: data.orderNotes ?? 2,
          orderSkills: data.orderSkills ?? 3,
          orderProjects: data.orderProjects ?? 4,
        }
        setForm(s)
        setOriginal(s)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    setHasChanges(JSON.stringify(form) !== JSON.stringify(original))
  }, [form, original])

  function updateForm(patch: Partial<Settings>) {
    setForm((f) => ({ ...f, ...patch }))
  }

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
      setOriginal(form)
      setToast({ message: 'Settings saved successfully', type: 'success' })
    } catch {
      setToast({ message: 'Failed to save settings', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px', color: 'var(--admin-text-muted)', fontSize: '0.875rem' }}>
        <div className="adm-loading"><div className="adm-loading-spinner" />Loading settings...</div>
      </div>
    )
  }

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--admin-text-primary)', margin: 0 }}>
            Site Settings
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--admin-text-muted)', marginTop: '4px' }}>
            Configure your site metadata, visibility, and social links
          </p>
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving || !hasChanges}
          className="admin-btn admin-btn-primary"
          style={{
            padding: '9px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            opacity: hasChanges ? 1 : 0.5,
          }}
        >
          <Save size={14} />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Tab navigation */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          marginBottom: '24px',
          borderBottom: '1px solid var(--admin-border)',
          paddingBottom: '0',
        }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon
          const active = activeTab === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 16px',
                fontSize: '0.8125rem',
                fontWeight: active ? 600 : 500,
                color: active ? 'var(--admin-accent)' : 'var(--admin-text-secondary)',
                background: 'none',
                border: 'none',
                borderBottom: `2px solid ${active ? 'var(--admin-accent)' : 'transparent'}`,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                marginBottom: '-1px',
              }}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <form onSubmit={handleSubmit}>
        {/* General tab */}
        {activeTab === 'general' && (
          <>
            <SectionCard title="Identity" desc="Your personal information shown across the site" icon={User}>
              <Field label="Display Name">
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => updateForm({ name: e.target.value })}
                  className="admin-input"
                  placeholder="Bagas"
                />
              </Field>
              <Field label="Site Name">
                <input
                  type="text"
                  value={form.siteName}
                  onChange={(e) => updateForm({ siteName: e.target.value })}
                  className="admin-input"
                  placeholder="bagas.dev"
                />
              </Field>
              <Field label="Tagline">
                <input
                  type="text"
                  value={form.tagline}
                  onChange={(e) => updateForm({ tagline: e.target.value })}
                  className="admin-input"
                  placeholder="Software developer and open-source enthusiast"
                />
              </Field>
            </SectionCard>

            <SectionCard title="Sidebar" desc="Content shown in the public site sidebar" icon={Layout}>
              <Field label="Sidebar Bio">
                <textarea
                  value={form.sidebarBio}
                  onChange={(e) => updateForm({ sidebarBio: e.target.value })}
                  className="admin-textarea"
                  rows={3}
                  placeholder="Short bio shown in the sidebar..."
                />
              </Field>
            </SectionCard>

            <SectionCard title="Options" icon={ToggleLeft}>
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
                <Rss size={15} style={{ color: form.rssEnabled ? 'var(--admin-accent)' : 'var(--admin-text-muted)' }} />
                <span style={{ flex: 1 }}>Enable RSS Feed</span>
                <input
                  type="checkbox"
                  checked={form.rssEnabled}
                  onChange={(e) => updateForm({ rssEnabled: e.target.checked })}
                  style={{ width: '16px', height: '16px' }}
                />
              </label>
            </SectionCard>
          </>
        )}

        {/* Homepage tab */}
        {activeTab === 'homepage' && (
          <SectionCard title="Hero Section" desc="Content shown in the homepage hero area" icon={Layout}>
            <Field label="Hero Introduction">
              <textarea
                value={form.heroIntro}
                onChange={(e) => updateForm({ heroIntro: e.target.value })}
                className="admin-textarea"
                rows={3}
                placeholder="Short intro shown in the hero section..."
              />
            </Field>
            <Field label="Mascot / Hero Image URL" hint="Leave blank to use the default mascot">
              <input
                type="url"
                value={form.heroImage}
                onChange={(e) => updateForm({ heroImage: e.target.value })}
                className="admin-input"
                placeholder="https://example.com/mascot.png"
              />
            </Field>
            <Field label="CV / Resume (PDF)" hint="Upload your CV to enable the Download CV button">
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="text"
                  value={form.cvUrl}
                  onChange={(e) => updateForm({ cvUrl: e.target.value })}
                  className="admin-input"
                  placeholder="/uploads/profile/cv.pdf"
                  readOnly
                  style={{ flex: 1 }}
                />
                <label
                  className="admin-btn admin-btn-secondary"
                  style={{ padding: '8px 16px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                  Upload PDF
                  <input
                    type="file"
                    accept=".pdf"
                    style={{ display: 'none' }}
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      const fd = new FormData()
                      fd.append('file', file)
                      fd.append('folder', 'profile')
                      try {
                        const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
                        const data = await res.json()
                        if (data.path) {
                          updateForm({ cvUrl: data.path })
                          setToast({ message: 'CV uploaded successfully', type: 'success' })
                        } else {
                          setToast({ message: data.error || 'Upload failed', type: 'error' })
                        }
                      } catch {
                        setToast({ message: 'Upload failed', type: 'error' })
                      }
                      e.target.value = ''
                    }}
                  />
                </label>
                {form.cvUrl && (
                  <button
                    type="button"
                    className="admin-btn admin-btn-danger"
                    style={{ padding: '8px 12px' }}
                    onClick={() => updateForm({ cvUrl: '' })}
                  >
                    Remove
                  </button>
                )}
              </div>
            </Field>
          </SectionCard>
        )}

        {/* Sections tab */}
        {activeTab === 'sections' && (
          <SectionCard
            title="Homepage Sections"
            desc="Toggle visibility and drag to reorder sections on the homepage."
            icon={ToggleLeft}
          >
            {(() => {
              type SectionKey = 'experience' | 'blog' | 'notes' | 'skills' | 'projects'
              const sectionDefs: { key: SectionKey; label: string; desc: string; icon: typeof Globe; showField: keyof Settings; orderField: keyof Settings }[] = [
                { key: 'experience', label: 'Experience', desc: 'Work history timeline', icon: Briefcase, showField: 'showExperience', orderField: 'orderExperience' },
                { key: 'blog', label: 'Blog', desc: 'Personal essays and articles', icon: FileText, showField: 'showBlog', orderField: 'orderBlog' },
                { key: 'notes', label: 'Notes', desc: 'Guides and tutorials', icon: StickyNote, showField: 'showNotes', orderField: 'orderNotes' },
                { key: 'skills', label: 'Skills', desc: 'Technologies and tools', icon: Cpu, showField: 'showSkills', orderField: 'orderSkills' },
                { key: 'projects', label: 'Projects', desc: 'Open-source projects', icon: FolderKanban, showField: 'showProjects', orderField: 'orderProjects' },
              ]

              const sorted = [...sectionDefs].sort(
                (a, b) => (form[a.orderField] as number) - (form[b.orderField] as number)
              )

              function moveSection(index: number, direction: 'up' | 'down') {
                const target = direction === 'up' ? index - 1 : index + 1
                if (target < 0 || target >= sorted.length) return
                const updates: Partial<Settings> = {}
                // Swap order values
                const currentItem = sorted[index]
                const targetItem = sorted[target]
                const currentOrder = form[currentItem.orderField] as number
                const targetOrder = form[targetItem.orderField] as number
                updates[currentItem.orderField as keyof Settings] = targetOrder as never
                updates[targetItem.orderField as keyof Settings] = currentOrder as never
                updateForm(updates)
              }

              return sorted.map((section, index) => {
                const Icon = section.icon
                const checked = form[section.showField] as boolean
                return (
                  <div
                    key={section.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      border: `1px solid ${checked ? 'var(--admin-accent)' : 'var(--admin-border)'}`,
                      background: checked ? 'rgba(88,166,255,0.04)' : 'transparent',
                      opacity: checked ? 1 : 0.6,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {/* Order controls */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flexShrink: 0 }}>
                      <button
                        type="button"
                        onClick={() => moveSection(index, 'up')}
                        disabled={index === 0}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: index === 0 ? 'default' : 'pointer',
                          padding: '1px',
                          color: index === 0 ? 'var(--admin-border)' : 'var(--admin-text-muted)',
                          lineHeight: 0,
                        }}
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSection(index, 'down')}
                        disabled={index === sorted.length - 1}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: index === sorted.length - 1 ? 'default' : 'pointer',
                          padding: '1px',
                          color: index === sorted.length - 1 ? 'var(--admin-border)' : 'var(--admin-text-muted)',
                          lineHeight: 0,
                        }}
                      >
                        <ChevronDown size={14} />
                      </button>
                    </div>

                    {/* Grip icon */}
                    <GripVertical size={16} style={{ color: 'var(--admin-text-muted)', opacity: 0.4, flexShrink: 0 }} />

                    {/* Order number */}
                    <span style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '6px',
                      background: checked ? 'var(--admin-accent)' : 'var(--admin-border)',
                      color: checked ? '#fff' : 'var(--admin-text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}>
                      {index + 1}
                    </span>

                    {/* Icon */}
                    <div
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '8px',
                        background: checked ? 'rgba(88,166,255,0.1)' : 'var(--admin-bg)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={16} style={{ color: checked ? 'var(--admin-accent)' : 'var(--admin-text-muted)' }} />
                    </div>

                    {/* Label + desc */}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--admin-text-primary)' }}>
                        {section.label}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)', marginTop: '1px' }}>
                        {section.desc}
                      </div>
                    </div>

                    {/* Toggle */}
                    <div
                      onClick={() => updateForm({ [section.showField]: !checked })}
                      style={{
                        width: '42px',
                        height: '24px',
                        borderRadius: '12px',
                        background: checked ? 'var(--admin-accent)' : 'var(--admin-border)',
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'background 0.2s ease',
                        flexShrink: 0,
                      }}
                    >
                      <div
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          background: '#fff',
                          position: 'absolute',
                          top: '3px',
                          left: checked ? '21px' : '3px',
                          transition: 'left 0.2s ease',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                        }}
                      />
                    </div>
                  </div>
                )
              })
            })()}
          </SectionCard>
        )}

        {/* Social tab */}
        {activeTab === 'social' && (
          <SectionCard title="Social Links" desc="Links shown in the sidebar and footer" icon={Link2}>
            {[
              { key: 'github', label: 'GitHub', placeholder: 'https://github.com/username' },
              { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/username' },
              { key: 'twitter', label: 'Twitter / X', placeholder: 'https://twitter.com/username' },
              { key: 'email', label: 'Email', placeholder: 'hello@example.com' },
              { key: 'bluesky', label: 'Bluesky', placeholder: 'https://bsky.app/profile/username' },
            ].map(({ key, label, placeholder }) => (
              <Field key={key} label={label}>
                <input
                  type={key === 'email' ? 'email' : 'text'}
                  value={form[key as keyof Settings] as string}
                  onChange={(e) => updateForm({ [key]: e.target.value })}
                  className="admin-input"
                  placeholder={placeholder}
                />
              </Field>
            ))}
          </SectionCard>
        )}
      </form>

      {/* Unsaved changes indicator */}
      {hasChanges && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: 'var(--admin-surface)',
            border: '1px solid var(--admin-accent)',
            borderRadius: '12px',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            zIndex: 50,
          }}
        >
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--admin-accent)', animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: '0.8125rem', color: 'var(--admin-text-primary)', fontWeight: 500 }}>
            Unsaved changes
          </span>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="admin-btn admin-btn-primary"
            style={{ padding: '6px 14px', fontSize: '0.8125rem' }}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      )}
    </div>
  )
}
