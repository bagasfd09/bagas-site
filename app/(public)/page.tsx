import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import ProjectCard from '@/components/public/ProjectCard'
import PostRowList from '@/components/public/PostRowList'
import SkillsGrid from '@/components/public/SkillsGrid'
import AnimateIn from '@/components/public/AnimateIn'
import AlienEyes from '@/components/public/AlienEyes'
import { PersonJsonLd, WebsiteJsonLd } from '@/components/public/JsonLd'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Bagas — Software Engineer & Backend Developer from Indonesia',
  description: 'Personal website of Bagas, a software engineer and backend developer from Indonesia. Specializing in Go, TypeScript, Node.js, and modern web development. Read articles, explore projects, and connect.',
  alternates: { canonical: '/' },
}

async function getData() {
  const [settings, blogPosts, notes, skills, projects] = await Promise.all([
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
  ])

  return { settings, blogPosts, notes, skills, projects }
}

export default async function HomePage() {
  const { settings, blogPosts, notes, skills, projects } = await getData()

  const name = settings?.name || 'Bagas'
  const heroIntro =
    settings?.heroIntro ||
    "I'm a software developer and open-source enthusiast from Indonesia. I build modern web apps and write about development on this blog."
  const linkedin = settings?.linkedin || ''
  const cvUrl = settings?.cvUrl || ''
  const heroImage = settings?.heroImage || ''

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
            <div className="flex flex-wrap gap-3">
              {cvUrl?.trim() && (
                <a href={cvUrl} download className="hero-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10 9 9 9 8 9"/>
                  </svg>
                  Grab My Resume
                </a>
              )}
              {linkedin?.trim() && (
                <a href={linkedin} target="_blank" rel="noopener noreferrer" className="hero-btn">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854V1.146zm4.943 12.248V6.169H2.542v7.225h2.401zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248-.822 0-1.359.54-1.359 1.248 0 .694.521 1.248 1.327 1.248h.016zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016l.016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225h2.4z"/>
                  </svg>
                  Let&apos;s Connect
                </a>
              )}
            </div>
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
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={heroImage || '/images/bg-pic.png'}
                alt={`${name} mascot`}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Blog ─────────────────────────────────────────────── */}
      {blogPosts.length > 0 && (
        <AnimateIn as="section" className="mb-14" animation="fade-up">
          <h2 className="section-heading">Blog</h2>
          <p className="section-subtitle">Personal essays and technical thoughts.</p>
          <PostRowList posts={blogPosts} />
          <div className="mt-4">
            <Link href="/blog" className="view-all-link">
              All posts <span className="view-all-arrow">&rarr;</span>
            </Link>
          </div>
        </AnimateIn>
      )}

      {/* ── Notes ────────────────────────────────────────────── */}
      {notes.length > 0 && (
        <AnimateIn as="section" className="mb-14" animation="fade-up" delay={80}>
          <h2 className="section-heading">Notes</h2>
          <p className="section-subtitle">Guides, references, and tutorials.</p>
          <PostRowList posts={notes} />
          <div className="mt-4">
            <Link href="/notes" className="view-all-link">
              All notes <span className="view-all-arrow">&rarr;</span>
            </Link>
          </div>
        </AnimateIn>
      )}

      {/* ── Skills ───────────────────────────────────────────── */}
      {skills.length > 0 && (
        <AnimateIn as="section" className="mb-14" animation="fade-up">
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
          <SkillsGrid skills={skills} />
          <div className="mt-4">
            <Link href="/skills" className="view-all-link">
              All skills <span className="view-all-arrow">&rarr;</span>
            </Link>
          </div>
        </AnimateIn>
      )}

      {/* ── Projects ─────────────────────────────────────────── */}
      {projects.length > 0 && (
        <AnimateIn as="section" className="mb-14" animation="fade-up">
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
      )}
    </div>
  )
}
