import { prisma } from '@/lib/prisma'
import ExperienceTimeline from '@/components/public/ExperienceTimeline'
import AnimateIn from '@/components/public/AnimateIn'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Experience — Bagas',
  description: 'Professional experience and career history of Bagas, a software engineer from Indonesia.',
  alternates: { canonical: '/experience' },
}

async function getExperiences() {
  return prisma.experience.findMany({
    orderBy: { startDate: 'desc' },
    select: {
      id: true,
      title: true,
      company: true,
      companyLogo: true,
      location: true,
      startDate: true,
      endDate: true,
      current: true,
      description: true,
      tech: true,
      projects: true,
    },
  })
}

export default async function ExperiencePage() {
  const experiences = await getExperiences()

  return (
    <div>
      <AnimateIn as="section" animation="fade-up">
        <h1 className="section-heading" style={{ fontSize: '2rem' }}>Experience</h1>
        <p className="section-subtitle">My professional journey and career history.</p>
        {experiences.length > 0 ? (
          <ExperienceTimeline experiences={experiences} />
        ) : (
          <p style={{ color: 'var(--muted)' }}>No experience entries yet.</p>
        )}
      </AnimateIn>
    </div>
  )
}
