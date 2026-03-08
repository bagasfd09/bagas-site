'use client'

import { useState, useRef } from 'react'
import SkillsGrid from './SkillsGrid'

interface Skill {
  id: string
  name: string
  slug: string
  icon: string | null
  url: string | null
  category: string
  level?: string
  yearsOfExp: number | null
}

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'language', label: 'Languages' },
  { key: 'framework', label: 'Frameworks' },
  { key: 'database', label: 'Databases' },
  { key: 'tool', label: 'Tools' },
  { key: 'cloud', label: 'Cloud' },
  { key: 'other', label: 'Other' },
]

export default function SkillsFilterGrid({ skills }: { skills: Skill[] }) {
  const [active, setActive] = useState('all')
  const gridRef = useRef<HTMLDivElement>(null)

  // Only show categories that have skills
  const availableKeys = new Set(skills.map((s) => s.category))
  const tabs = CATEGORIES.filter((c) => c.key === 'all' || availableKeys.has(c.key))

  const filtered = active === 'all' ? skills : skills.filter((s) => s.category === active)

  // Group for display when "all" is selected
  const grouped = active === 'all'
    ? tabs
        .filter((t) => t.key !== 'all')
        .map((t) => ({ ...t, items: skills.filter((s) => s.category === t.key) }))
        .filter((g) => g.items.length > 0)
    : null

  return (
    <div>
      {/* Filter pills */}
      <div className="skill-filter-bar">
        {tabs.map((tab) => {
          const count = tab.key === 'all' ? skills.length : skills.filter((s) => s.category === tab.key).length
          return (
            <button
              key={tab.key}
              className={`skill-filter-pill${active === tab.key ? ' skill-filter-pill--active' : ''}`}
              onClick={() => setActive(tab.key)}
            >
              {tab.label}
              <span className="skill-filter-count">{count}</span>
            </button>
          )
        })}
      </div>

      {/* Grid */}
      <div ref={gridRef} className="skill-filter-grid">
        {grouped ? (
          grouped.map((group) => (
            <section key={group.key} className="skill-filter-section">
              <h2 className="skill-filter-heading">{group.label}</h2>
              <SkillsGrid skills={group.items} />
            </section>
          ))
        ) : (
          <SkillsGrid skills={filtered} />
        )}
      </div>
    </div>
  )
}
