'use client'

import { useEffect, useRef } from 'react'
import ImageUpload from '../ui/ImageUpload'

interface SettingsDrawerProps {
  open: boolean
  onClose: () => void
  isNote: boolean
  // Form state
  slug: string
  description: string
  thumbnail: string
  tags: string[]
  category: string
  series: string
  seriesOrder: number | null
  published: boolean
  featured: boolean
  existingSeries: string[]
  // Change handlers
  onSlugChange: (slug: string) => void
  onDescriptionChange: (desc: string) => void
  onThumbnailChange: (path: string) => void
  onTagsChange: (tags: string[]) => void
  onCategoryChange: (cat: string) => void
  onSeriesChange: (series: string) => void
  onSeriesOrderChange: (order: number) => void
  onPublishedChange: (published: boolean) => void
  onFeaturedChange: (featured: boolean) => void
}

export default function SettingsDrawer({
  open, onClose, isNote,
  slug, description, thumbnail, tags, category, series, seriesOrder,
  published, featured, existingSeries,
  onSlugChange, onDescriptionChange, onThumbnailChange, onTagsChange,
  onCategoryChange, onSeriesChange, onSeriesOrderChange,
  onPublishedChange, onFeaturedChange,
}: SettingsDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null)
  const tagInputRef = useRef<HTMLInputElement>(null)

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  // Ctrl+Shift+M toggle
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'm') {
        e.preventDefault()
        onClose() // parent toggles
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  const handleAddTag = (value: string) => {
    const trimmed = value.trim()
    if (trimmed && !tags.includes(trimmed)) {
      onTagsChange([...tags, trimmed])
    }
  }

  const handleRemoveTag = (index: number) => {
    onTagsChange(tags.filter((_, i) => i !== index))
  }

  if (!open) return null

  return (
    <>
      {/* Overlay */}
      <div className="pe2-drawer-overlay" onClick={onClose} />

      {/* Drawer */}
      <div ref={drawerRef} className="pe2-settings-drawer">
        {/* Header */}
        <div className="pe2-drawer-header">
          <span className="pe2-drawer-title">Post Settings</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span className="pe2-kbd">Ctrl+Shift+M</span>
            <button type="button" className="pe2-drawer-close" onClick={onClose} aria-label="Close settings">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="pe2-drawer-content">
          {/* Status */}
          <div className="pe2-drawer-section">
            <span className="pe2-drawer-label">Status</span>
            <div style={{ display: 'flex', gap: '10px', paddingTop: '10px' }}>
              <label className="pe2-drawer-toggle-card" data-active={published}>
                <span>Published</span>
                <input type="checkbox" checked={published} onChange={(e) => onPublishedChange(e.target.checked)} hidden />
                <div className={`pe2-toggle ${published ? 'pe2-toggle--on' : ''}`}>
                  <div className="pe2-toggle-thumb" />
                </div>
              </label>
              {!isNote && (
                <label className="pe2-drawer-toggle-card" data-active={featured}>
                  <span>Featured</span>
                  <input type="checkbox" checked={featured} onChange={(e) => onFeaturedChange(e.target.checked)} hidden />
                  <div className={`pe2-toggle ${featured ? 'pe2-toggle--on pe2-toggle--gold' : ''}`}>
                    <div className="pe2-toggle-thumb" />
                  </div>
                </label>
              )}
            </div>
          </div>

          {/* Cover Image (posts only) */}
          {!isNote && (
            <div className="pe2-drawer-section">
              <span className="pe2-drawer-label">Cover Image</span>
              <div style={{ marginTop: '10px' }}>
                <ImageUpload
                  value={thumbnail}
                  onChange={onThumbnailChange}
                  folder="blog"
                  compress="thumb"
                  acceptHint="PNG, JPG, WebP up to 2MB"
                />
              </div>
            </div>
          )}

          {/* Description */}
          {!isNote && (
            <div className="pe2-drawer-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="pe2-drawer-label">Description</span>
                <span className="pe2-drawer-counter">{description.length} / 160</span>
              </div>
              <textarea
                value={description}
                onChange={(e) => onDescriptionChange(e.target.value)}
                className="pe2-drawer-textarea"
                placeholder="Short description for preview cards and SEO..."
                rows={3}
              />
            </div>
          )}

          {/* Tags */}
          <div className="pe2-drawer-section">
            <span className="pe2-drawer-label">Tags</span>
            <div className="pe2-drawer-tags">
              {tags.map((tag, i) => (
                <span key={i} className="pe2-drawer-tag">
                  {tag}
                  <button type="button" onClick={() => handleRemoveTag(i)} className="pe2-drawer-tag-remove">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
              <input
                ref={tagInputRef}
                type="text"
                className="pe2-drawer-tag-input"
                placeholder="+ Add tag"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddTag((e.target as HTMLInputElement).value)
                    ;(e.target as HTMLInputElement).value = ''
                  }
                }}
              />
            </div>
          </div>

          {/* Category + Series */}
          {!isNote && (
            <div className="pe2-drawer-section">
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <span className="pe2-drawer-label">Category</span>
                  <select value={category} onChange={(e) => onCategoryChange(e.target.value)} className="pe2-drawer-select">
                    <option value="technical">Technical</option>
                    <option value="personal">Personal</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <span className="pe2-drawer-label">Series</span>
                  <input
                    type="text"
                    list="pe2-series-list"
                    value={series}
                    onChange={(e) => onSeriesChange(e.target.value)}
                    placeholder="None"
                    className="pe2-drawer-input"
                  />
                  <datalist id="pe2-series-list">
                    {existingSeries.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                </div>
              </div>
              {series && (
                <div style={{ marginTop: '10px' }}>
                  <span className="pe2-drawer-label">Series Order</span>
                  <input
                    type="number"
                    min={0}
                    value={seriesOrder ?? 0}
                    onChange={(e) => onSeriesOrderChange(parseInt(e.target.value) || 0)}
                    className="pe2-drawer-input"
                    style={{ width: '80px' }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Slug */}
          <div className="pe2-drawer-section">
            <span className="pe2-drawer-label">URL Slug</span>
            <div className="pe2-drawer-slug">
              <span className="pe2-drawer-slug-prefix">/{isNote ? 'notes' : 'blog'}/</span>
              <input
                type="text"
                value={slug}
                onChange={(e) => onSlugChange(e.target.value)}
                className="pe2-drawer-slug-input"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
