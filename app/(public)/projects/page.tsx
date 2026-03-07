import { prisma } from '@/lib/prisma'
import ProjectCard from '@/components/public/ProjectCard'
import AnimateIn from '@/components/public/AnimateIn'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Projects',
  description: 'Open-source projects and software built by Bagas — including web applications, backend systems, and developer tools using Go, TypeScript, Next.js, and more.',
  alternates: { canonical: '/projects' },
}

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({
    orderBy: { sortOrder: 'asc' },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      image: true,
      demoUrl: true,
      repo: true,
      articleUrl: true,
      tech: true,
      year: true,
      featured: true,
      githubStars: true,
      githubForks: true,
      githubLanguage: true,
    },
  })

  return (
    <div>
      <AnimateIn animation="fade-up" duration={400}>
        <h1
          className="text-4xl font-serif font-normal mb-3"
          style={{ letterSpacing: '-0.02em' }}
        >
          Projects
        </h1>
        <p className="text-sm mb-10" style={{ color: 'var(--muted)' }}>
          Open-source projects I&apos;ve worked on.
        </p>
      </AnimateIn>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {projects.map((project, i) => (
          <AnimateIn key={project.id} animation="fade-up" delay={i * 70} duration={450}>
            <ProjectCard project={project} />
          </AnimateIn>
        ))}
      </div>
    </div>
  )
}
