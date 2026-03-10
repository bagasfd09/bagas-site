import Image from 'next/image'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import ProjectCard from '@/components/public/ProjectCard'
import PostRowList from '@/components/public/PostRowList'
import SkillsGrid from '@/components/public/SkillsGrid'
import AnimateIn from '@/components/public/AnimateIn'
import AlienEyes from '@/components/public/AlienEyes'
import HeroCTAButtons from '@/components/public/HeroCTAButtons'
import ExperienceTimeline from '@/components/public/ExperienceTimeline'
import { PersonJsonLd, WebsiteJsonLd } from '@/components/public/JsonLd'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Bagas — Software Engineer & Backend Developer from Indonesia',
  description: 'Personal website of Bagas, a software engineer and backend developer from Indonesia. Specializing in Go, TypeScript, Node.js, and modern web development. Read articles, explore projects, and connect.',
  alternates: { canonical: '/' },
}

async function getData() {
  const [settings, blogPosts, notes, skills, projects, experiences] = await Promise.all([
    prisma.siteSettings.findUnique({ where: { id: 'main' } }),
    prisma.post.findMany({
      where: { type: 'post', published: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, title: true, slug: true, type: true, tags: true, createdAt: true },
    }),
    prisma.post.findMany({
      where: { type: 'note', published: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, title: true, slug: true, type: true, tags: true, createdAt: true },
    }),
    prisma.skill.findMany({
      where: { featured: true },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, name: true, slug: true, icon: true, url: true, category: true, level: true, yearsOfExp: true },
    }),
    prisma.project.findMany({
      orderBy: { sortOrder: 'asc' },
      take: 6,
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
    }),
    prisma.experience.findMany({
      orderBy: { sortOrder: 'asc' },
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
    }),
  ])

  return { settings, blogPosts, notes, skills, projects, experiences }
}

export default async function HomePage() {
  const { settings, blogPosts, notes, skills, projects, experiences } = await getData()

  const name = settings?.name || 'Bagas'
  const heroIntro =
    settings?.heroIntro ||
    "I'm a software developer and open-source enthusiast from Indonesia. I build modern web apps and write about development on this blog."
  const linkedin = settings?.linkedin || ''
  const cvUrl = settings?.cvUrl || ''
  const heroImage = settings?.heroImage || ''

  // Section visibility & ordering
  const sectionConfig = [
    { key: 'experience', show: settings?.showExperience ?? true, order: settings?.orderExperience ?? 0 },
    { key: 'blog', show: settings?.showBlog ?? true, order: settings?.orderBlog ?? 1 },
    { key: 'notes', show: settings?.showNotes ?? true, order: settings?.orderNotes ?? 2 },
    { key: 'skills', show: settings?.showSkills ?? true, order: settings?.orderSkills ?? 3 },
    { key: 'projects', show: settings?.showProjects ?? true, order: settings?.orderProjects ?? 4 },
  ].sort((a, b) => a.order - b.order)

  // Section renderers
  const sectionRenderers: Record<string, () => React.ReactNode> = {
    experience: () =>
      experiences.length > 0 ? (
        <AnimateIn as="section" className="mb-14" animation="fade-up" key="experience">
          <h2 className="section-heading">Experience</h2>
          <p className="section-subtitle">Where I&apos;ve worked and what I&apos;ve built.</p>
          <ExperienceTimeline experiences={experiences} />
        </AnimateIn>
      ) : null,
    blog: () =>
      blogPosts.length > 0 ? (
        <AnimateIn as="section" className="mb-14" animation="fade-up" key="blog">
          <h2 className="section-heading">Blog</h2>
          <p className="section-subtitle">Personal essays and technical thoughts.</p>
          <PostRowList posts={blogPosts} />
          <div className="mt-4">
            <Link href="/blog" className="view-all-link">
              All posts <span className="view-all-arrow">&rarr;</span>
            </Link>
          </div>
        </AnimateIn>
      ) : null,
    notes: () =>
      notes.length > 0 ? (
        <AnimateIn as="section" className="mb-14" animation="fade-up" delay={80} key="notes">
          <h2 className="section-heading">Notes</h2>
          <p className="section-subtitle">Guides, references, and tutorials.</p>
          <PostRowList posts={notes} />
          <div className="mt-4">
            <Link href="/notes" className="view-all-link">
              All notes <span className="view-all-arrow">&rarr;</span>
            </Link>
          </div>
        </AnimateIn>
      ) : null,
    skills: () =>
      skills.length > 0 ? (
        <AnimateIn as="section" className="mb-14" animation="fade-up" key="skills">
          <h2 className="section-heading">Skills</h2>
          <p className="section-subtitle">Technologies and tools I work with.</p>
          <div className="skill-legend" style={{ marginBottom: '1rem' }}>
            <span className="skill-legend-item">
              <span className="skill-legend-dot skill-legend-dot--confident" />
              Confident
            </span>
            <span className="skill-legend-item">
              <span className="skill-legend-dot skill-legend-dot--learning" />
              Learning / Familiar
            </span>
          </div>
          {(() => {
            const CATS = [
              { key: 'language', label: 'Languages' },
              { key: 'framework', label: 'Frameworks' },
              { key: 'database', label: 'Databases' },
              { key: 'tool', label: 'Tools' },
              { key: 'cloud', label: 'Cloud' },
              { key: 'other', label: 'Other' },
            ]
            const grouped = CATS
              .map((c) => ({ ...c, items: skills.filter((s) => s.category === c.key) }))
              .filter((g) => g.items.length > 0)
            return grouped.map((group) => (
              <section key={group.key} className="skill-filter-section">
                <h3 className="skill-filter-heading">{group.label}</h3>
                <SkillsGrid skills={group.items} />
              </section>
            ))
          })()}
          <div className="mt-4">
            <Link href="/skills" className="view-all-link">
              All skills <span className="view-all-arrow">&rarr;</span>
            </Link>
          </div>
        </AnimateIn>
      ) : null,
    projects: () =>
      projects.length > 0 ? (
        <AnimateIn as="section" className="mb-14" animation="fade-up" key="projects">
          <h2 className="section-heading">Projects</h2>
          <p className="section-subtitle">Open-source projects I&apos;ve worked on over the years.</p>
          <div className="three-col-grid">
            {projects.map((project, i) => (
              <AnimateIn key={project.id} animation="fade-up" delay={i * 80} duration={450}>
                <ProjectCard project={project} />
              </AnimateIn>
            ))}
          </div>
          <div className="mt-4">
            <Link href="/projects" className="view-all-link">
              All projects <span className="view-all-arrow">&rarr;</span>
            </Link>
          </div>
        </AnimateIn>
      ) : null,
  }

  return (
    <div>
      <PersonJsonLd />
      <WebsiteJsonLd />
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="mb-16">
        <div className="hero-content">
          {/* Text side */}
          <div className="hero-text">
            <h1
              className="font-serif font-normal mb-4"
              style={{ fontSize: '2.5rem', letterSpacing: '-0.03em', lineHeight: 1.2 }}
            >
              Hey, I&apos;m {name}!
            </h1>
            <p className="text-base leading-relaxed mb-3" style={{ color: 'var(--muted)' }}>
              {heroIntro}
            </p>
            <p className="text-sm mb-6 flex items-center gap-1.5" style={{ color: 'var(--muted)' }}>
              Claude helped me build this website — thanks to him
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                <path d="M17.153 2.274a1.005 1.005 0 0 0-1.894-.009L13.78 6.601a.5.5 0 0 1-.222.265l-4.2 2.463a1.005 1.005 0 0 0 .009 1.738l4.149 2.368a.5.5 0 0 1 .223.26l1.578 4.32a1.005 1.005 0 0 0 1.895.008l1.48-4.336a.5.5 0 0 1 .218-.267l4.197-2.462a1.005 1.005 0 0 0-.009-1.738l-4.145-2.365a.5.5 0 0 1-.224-.261L17.153 2.274z" fill="#D97706"/>
                <path d="M7.063 11.462a.737.737 0 0 0-1.39-.007l-.88 2.48a.367.367 0 0 1-.163.194l-2.42 1.42a.737.737 0 0 0 .006 1.275l2.39 1.363a.367.367 0 0 1 .163.191l.916 2.507a.737.737 0 0 0 1.39.006l.855-2.507a.367.367 0 0 1 .16-.196l2.42-1.42a.737.737 0 0 0-.007-1.274l-2.389-1.363a.367.367 0 0 1-.164-.191L7.063 11.462z" fill="#D97706"/>
              </svg>
            </p>
            <HeroCTAButtons cvUrl={cvUrl} linkedin={linkedin} />
          </div>

          {/* Mascot side */}
          <div className="hero-mascot">
            <div className="hero-mascot-circle">
              {/* Decorative elements */}
              <span className="hero-deco hero-rocket" aria-hidden="true">
                <svg width="28" height="28" viewBox="0 0 64 74" fill="none">
                  <path d="M32 4c0 0-16 12-16 36h8l8 16 8-16h8C48 16 32 4 32 4z" fill="#16a34a"/>
                  <path d="M32 4c0 0-10 10-14 28h10l4 12 4-12h10C42 14 32 4 32 4z" fill="#4ade80"/>
                  <circle cx="32" cy="28" r="5" fill="#fff"/>
                  <circle cx="32" cy="28" r="3" fill="#bbf7d0"/>
                  <path d="M26 40c-4 4-8 2-8 2s0-4 4-8" fill="#16a34a"/>
                  <path d="M38 40c4 4 8 2 8 2s0-4-4-8" fill="#16a34a"/>
                  {/* Normal flame */}
                  <path className="rocket-flame" d="M28 56l4-12 4 12" fill="#ef4444"/>
                  <path className="rocket-flame" d="M30 56l2-8 2 8" fill="#fbbf24"/>
                  {/* Turbo flame — bigger, hidden by default */}
                  <path className="rocket-turbo" d="M26 56l6-16 6 16" fill="#ef4444"/>
                  <path className="rocket-turbo" d="M28 58l4-14 4 14" fill="#fbbf24"/>
                  <path className="rocket-turbo" d="M30 62l2-10 2 10" fill="#fff" opacity="0.7"/>
                </svg>
              </span>
              <span className="hero-deco hero-moon" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 64 64" fill="none">
                  <path d="M44 8A28 28 0 1 0 56 44 22 22 0 0 1 44 8z" fill="#ffffff"/>
                  <circle cx="30" cy="24" r="3" fill="#e5e7eb" opacity="0.5"/>
                  <circle cx="22" cy="38" r="2" fill="#e5e7eb" opacity="0.4"/>
                  <circle cx="36" cy="42" r="2.5" fill="#e5e7eb" opacity="0.3"/>
                </svg>
              </span>
              <span className="hero-deco hero-star hero-star-1" aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#ffffff">
                  <path d="M12 2l2.9 6.3L22 9.2l-5 4.6 1.3 7.2L12 17.8 5.7 21l1.3-7.2-5-4.6 7.1-.9z"/>
                </svg>
              </span>
              <span className="hero-deco hero-star hero-star-2" aria-hidden="true">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="#ffffff">
                  <path d="M12 2l2.9 6.3L22 9.2l-5 4.6 1.3 7.2L12 17.8 5.7 21l1.3-7.2-5-4.6 7.1-.9z"/>
                </svg>
              </span>
              <span className="hero-deco hero-star hero-star-3" aria-hidden="true">
                <svg width="8" height="8" viewBox="0 0 24 24" fill="#ffffff">
                  <path d="M12 2l2.9 6.3L22 9.2l-5 4.6 1.3 7.2L12 17.8 5.7 21l1.3-7.2-5-4.6 7.1-.9z"/>
                </svg>
              </span>
              <span className="hero-deco hero-alien" aria-hidden="true">
                <AlienEyes />
              </span>
              <Image
                src={heroImage || '/images/bg-pic.png'}
                alt={`${name} mascot`}
                width={360}
                height={360}
                priority
                quality={80}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Dynamic Sections (ordered by settings) ─────────── */}
      {sectionConfig
        .filter((s) => s.show)
        .map((s) => sectionRenderers[s.key]?.())}
    </div>
  )
}
