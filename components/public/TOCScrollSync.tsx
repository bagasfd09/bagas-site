'use client'

import { useEffect, useState, useRef } from 'react'

export interface TOCHeading {
  id: string
  text: string
  level: number
}

export function extractHeadings(content: string): TOCHeading[] {
  const headings: TOCHeading[] = []
  const lines = content.split('\n')
  for (const line of lines) {
    const match = line.match(/^(#{2,3})\s+(.+)$/)
    if (match) {
      const level = match[1].length
      const text = match[2].replace(/[*_`\[\]]/g, '').trim()
      const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
      headings.push({ id, text, level })
    }
  }
  return headings
}

export default function TOCScrollSync({ headings }: { headings: TOCHeading[] }) {
  const [activeId, setActiveId] = useState<string>('')
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    if (headings.length === 0) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        // Find the first heading that is intersecting
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)

        if (visible.length > 0) {
          setActiveId(visible[0].target.id)
        }
      },
      { rootMargin: '0px 0px -70% 0px', threshold: 0.1 }
    )

    // Observe heading elements
    const timer = setTimeout(() => {
      headings.forEach(({ id }) => {
        const el = document.getElementById(id)
        if (el) observerRef.current?.observe(el)
      })
    }, 500) // delay to let markdown render

    return () => {
      clearTimeout(timer)
      observerRef.current?.disconnect()
    }
  }, [headings])

  if (headings.length === 0) return null

  return (
    <nav className="blog-toc" aria-label="Table of contents">
      <span className="blog-sidebar-label">Contents</span>
      <ul className="blog-toc-list">
        {headings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              className={`blog-toc-link ${h.level === 3 ? 'blog-toc-link--sub' : ''} ${activeId === h.id ? 'blog-toc-link--active' : ''}`}
              onClick={(e) => {
                e.preventDefault()
                document.getElementById(h.id)?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
