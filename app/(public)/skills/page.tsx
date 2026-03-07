import { prisma } from '@/lib/prisma'
import SkillsGrid from '@/components/public/SkillsGrid'
import AnimateIn from '@/components/public/AnimateIn'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Skills',
  description: 'Technical skills and tools used by Bagas — including Go, TypeScript, Node.js, React, Next.js, PostgreSQL, Docker, and more. Languages, frameworks, databases, and cloud technologies.',
  alternates: { canonical: '/skills' },
}

const CATEGORIES = [
  { key: 'language', label: 'Languages' },
  { key: 'framework', label: 'Frameworks' },
  { key: 'database', label: 'Databases' },
  { key: 'tool', label: 'Tools' },
  { key: 'cloud', label: 'Cloud' },
  { key: 'other', label: 'Other' },
]

export default async function SkillsPage() {
  const skills = await prisma.skill.findMany({
    orderBy: { sortOrder: 'asc' },
    select: { id: true, name: true, slug: true, icon: true, url: true, category: true, level: true, yearsOfExp: true },
  })

  const grouped = CATEGORIES.map((cat) => ({
    ...cat,
    items: skills.filter((s) => s.category === cat.key),
  })).filter((g) => g.items.length > 0)

  return (
    <div>
      <AnimateIn animation="fade-up" duration={400}>
        <h1 className="text-4xl font-serif font-normal mb-3" style={{ letterSpacing: '-0.02em' }}>
          Skills
        </h1>
        <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
          Technologies and tools I work with.
        </p>

        <div className="skill-legend">
          <span className="skill-legend-item">
            <span className="skill-legend-dot skill-legend-dot--confident" />
            Confident
          </span>
          <span className="skill-legend-item">
            <span className="skill-legend-dot skill-legend-dot--learning" />
            Learning / Familiar
          </span>
        </div>
      </AnimateIn>

      {grouped.map((group, i) => (
        <AnimateIn key={group.key} as="section" className="mb-10" animation="fade-up" delay={i * 100}>
          <h2
            className="text-sm font-mono font-medium mb-4 pb-2"
            style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}
          >
            {group.label}
          </h2>
          <SkillsGrid skills={group.items} />
        </AnimateIn>
      ))}
    </div>
  )
}
