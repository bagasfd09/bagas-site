'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { groupByYear } from '@/lib/utils'

interface Note {
  id: string
  title: string
  slug: string
  createdAt: string
  tags: string[]
}

function formatMonthDay(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/public/posts?type=note')
      .then((r) => r.json())
      .then((data) => {
        setNotes(data.posts || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filtered = notes.filter((n) =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  )

  const grouped = groupByYear(filtered)
  const years = Object.keys(grouped)
    .map(Number)
    .sort((a, b) => b - a)

  return (
    <div className="page-fade-in">
      <h1
        className="text-4xl font-serif font-normal mb-2"
        style={{ letterSpacing: '-0.02em' }}
      >
        Notes
      </h1>
      <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
        {notes.length > 0 && `${notes.length} notes — `}Guides, references, and tutorials.
      </p>

      <div className="search-wrap">
        <svg className="search-icon" width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="7" cy="7" r="5.5" />
          <path d="M11 11l3.5 3.5" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          placeholder="Search notes by title or tag..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
      </div>

      {loading ? (
        <div className="mt-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton-row">
              <div className="skeleton" style={{ width: '70px', height: '14px' }} />
              <div className="skeleton" style={{ width: `${200 + i * 30}px`, height: '14px' }} />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm mt-6" style={{ color: 'var(--muted)' }}>
          {search ? `No notes matching "${search}".` : 'No notes yet.'}
        </p>
      ) : (
        years.map((year) => (
          <section key={year} className="mb-10">
            <div className="year-heading">
              <h2 className="year-heading-text">{year}</h2>
              <span className="year-heading-count">{grouped[year].length}</span>
            </div>
            <ul>
              {grouped[year].map((note) => (
                <li key={note.id}>
                  <Link
                    href={`/notes/${note.slug}`}
                    className="post-row-link"
                  >
                    <span className="post-row-link-title">{note.title}</span>
                    <span className="post-row-link-meta">
                      {note.tags.length > 0 && (
                        <span className="post-row-tags">
                          {note.tags.slice(0, 2).map((tag) => (
                            <span key={tag} className="post-row-tag">{tag}</span>
                          ))}
                        </span>
                      )}
                      <span className="post-row-link-date">
                        {formatMonthDay(note.createdAt)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  )
}
