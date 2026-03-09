'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

const CATEGORIES = [
  { value: 'language', label: 'Language' },
  { value: 'framework', label: 'Framework' },
  { value: 'database', label: 'Database' },
  { value: 'tool', label: 'Tool' },
  { value: 'cloud', label: 'Cloud' },
  { value: 'other', label: 'Other' },
]

const LEVELS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'expert', label: 'Expert' },
]

interface RowData {
  id: string
  name: string
  category: string
  level: string
}

function newRow(category = 'language'): RowData {
  return { id: crypto.randomUUID(), name: '', category, level: 'intermediate' }
}

interface Props {
  existingNames: string[]
  onSaved: () => void
  onClose: () => void
}

export default function BatchSkillAdd({ existingNames, onSaved, onClose }: Props) {
  const [rows, setRows] = useState<RowData[]>(() => [newRow()])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const nameRefs = useRef<Map<string, HTMLInputElement>>(new Map())
  const existingSet = new Set(existingNames.map((n) => n.toLowerCase()))

  const filledRows = rows.filter((r) => r.name.trim())
  const dupes = new Set(
    rows
      .filter((r) => r.name.trim() && existingSet.has(r.name.trim().toLowerCase()))
      .map((r) => r.id)
  )

  // Focus first empty name on mount
  useEffect(() => {
    const first = rows[0]
    if (first) nameRefs.current.get(first.id)?.focus()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const setRef = useCallback((id: string, el: HTMLInputElement | null) => {
    if (el) nameRefs.current.set(id, el)
    else nameRefs.current.delete(id)
  }, [])

  function updateRow(id: string, field: keyof RowData, value: string) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)))
  }

  function removeRow(id: string) {
    setRows((prev) => {
      const next = prev.filter((r) => r.id !== id)
      return next.length === 0 ? [newRow()] : next
    })
  }

  function handleNameKeyDown(e: React.KeyboardEvent, row: RowData, index: number) {
    if (e.key === 'Enter') {
      e.preventDefault()
      // If this is the last row and has content, add a new row with sticky category
      if (index === rows.length - 1 && row.name.trim()) {
        const nr = newRow(row.category)
        setRows((prev) => [...prev, nr])
        setTimeout(() => nameRefs.current.get(nr.id)?.focus(), 0)
      } else if (index < rows.length - 1) {
        // Focus next row's name
        const nextRow = rows[index + 1]
        nameRefs.current.get(nextRow.id)?.focus()
      }
    }
    if (e.key === 'Escape') {
      if (!row.name.trim()) {
        if (rows.length > 1) {
          removeRow(row.id)
          // Focus previous row
          const prevRow = rows[Math.max(0, index - 1)]
          if (prevRow && prevRow.id !== row.id) {
            setTimeout(() => nameRefs.current.get(prevRow.id)?.focus(), 0)
          }
        } else {
          onClose()
        }
      }
    }
  }

  // Ctrl/Cmd+Enter to save
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        handleSave()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSave() {
    if (filledRows.length === 0) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/admin/skills/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skills: filledRows.map((r) => ({
            name: r.name.trim(),
            category: r.category,
            level: r.level,
          })),
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save')
      }
      const data = await res.json()
      onSaved()
      onClose()
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  // Auto-add ghost row when last row has content
  useEffect(() => {
    const last = rows[rows.length - 1]
    if (last && last.name.trim()) {
      setRows((prev) => [...prev, newRow(last.category)])
    }
  }, [rows.map((r) => r.name).join('|')]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="batch-panel">
      <div className="batch-header">
        <div className="batch-title">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M2 4h12M2 8h12M2 12h12" />
          </svg>
          Batch Add Skills
        </div>
        <span className="batch-count">
          {filledRows.length} {filledRows.length === 1 ? 'skill' : 'skills'} ready
        </span>
      </div>

      <div className="batch-table">
        <div className="batch-thead">
          <span className="batch-th batch-th--name">Name</span>
          <span className="batch-th batch-th--cat">Category</span>
          <span className="batch-th batch-th--level">Level</span>
          <span className="batch-th batch-th--action" />
        </div>
        <div className="batch-body">
          {rows.map((row, i) => {
            const isDupe = dupes.has(row.id)
            const isGhost = !row.name.trim() && i === rows.length - 1
            return (
              <div key={row.id} className={`batch-row${isGhost ? ' batch-row--ghost' : ''}`}>
                <div className="batch-cell batch-cell--name">
                  <input
                    ref={(el) => setRef(row.id, el)}
                    type="text"
                    value={row.name}
                    onChange={(e) => updateRow(row.id, 'name', e.target.value)}
                    onKeyDown={(e) => handleNameKeyDown(e, row, i)}
                    placeholder={i === 0 ? 'TypeScript' : 'Next skill...'}
                    className={`batch-input${isDupe ? ' batch-input--warn' : ''}`}
                    autoComplete="off"
                  />
                  {isDupe && <span className="batch-warn">Already exists</span>}
                </div>
                <div className="batch-cell batch-cell--cat">
                  <select
                    value={row.category}
                    onChange={(e) => updateRow(row.id, 'category', e.target.value)}
                    className="batch-select"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div className="batch-cell batch-cell--level">
                  <select
                    value={row.level}
                    onChange={(e) => updateRow(row.id, 'level', e.target.value)}
                    className="batch-select"
                  >
                    {LEVELS.map((l) => (
                      <option key={l.value} value={l.value}>{l.label}</option>
                    ))}
                  </select>
                </div>
                <div className="batch-cell batch-cell--action">
                  {rows.length > 1 && (
                    <button
                      type="button"
                      className="batch-remove"
                      onClick={() => removeRow(row.id)}
                      tabIndex={-1}
                    >
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <path d="M4 4l8 8M12 4l-8 8" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {error && <div className="batch-error">{error}</div>}

      <div className="batch-footer">
        <span className="batch-hint">
          Enter to add row &middot; Ctrl+Enter to save
        </span>
        <div className="batch-actions">
          <button type="button" className="admin-btn admin-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="admin-btn admin-btn-primary"
            disabled={filledRows.length === 0 || saving}
            onClick={handleSave}
          >
            {saving ? 'Saving...' : `Save ${filledRows.length || ''} Skills`}
          </button>
        </div>
      </div>
    </div>
  )
}
