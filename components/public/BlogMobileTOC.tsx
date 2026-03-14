'use client'

import { useState } from 'react'
import type { TOCHeading } from './TOCScrollSync'

export default function BlogMobileTOC({ headings }: { headings: TOCHeading[] }) {
  const [open, setOpen] = useState(false)

  if (headings.length === 0) return null

  return (
    <div className="blog-mobile-toc">
      <button
        onClick={() => setOpen(!open)}
        className="blog-mobile-toc-toggle"
        aria-expanded={open}
        aria-controls="mobile-toc-list"
      >
        <span>Contents</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <ul id="mobile-toc-list" className="blog-mobile-toc-list">
          {headings.map((h) => (
            <li key={h.id}>
              <a
                href={`#${h.id}`}
                className={`blog-mobile-toc-link ${h.level === 3 ? 'blog-mobile-toc-link--sub' : ''}`}
                onClick={() => setOpen(false)}
              >
                {h.text}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
