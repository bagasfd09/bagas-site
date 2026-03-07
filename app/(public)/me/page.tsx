import { prisma } from '@/lib/prisma'
import MarkdownRenderer from '@/components/public/MarkdownRenderer'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'About Me',
  description: 'Learn about Bagas — a software engineer and backend developer from Indonesia. Skilled in Go, TypeScript, Node.js, React, and PostgreSQL. Building modern web applications and open-source tools.',
  alternates: { canonical: '/me' },
  openGraph: {
    title: 'About Bagas — Software Engineer from Indonesia',
    description: 'Software engineer specializing in backend development with Go, TypeScript, and Node.js.',
  },
}

export default async function AboutPage() {
  const settings = await prisma.siteSettings.findUnique({
    where: { id: 'main' },
  })

  const bio = settings?.bio || '# About Me\n\nHi, I\'m Bagas.'
  const socialLinks = [
    settings?.github && { href: settings.github, label: 'GitHub' },
    settings?.linkedin && { href: settings.linkedin, label: 'LinkedIn' },
    settings?.twitter && { href: settings.twitter, label: 'Twitter' },
    settings?.bluesky && { href: settings.bluesky, label: 'Bluesky' },
    settings?.email && { href: `mailto:${settings.email}`, label: 'Email' },
  ].filter(Boolean) as { href: string; label: string }[]

  return (
    <div>
      <MarkdownRenderer content={bio} />

      {socialLinks.length > 0 && (
        <div
          className="mt-10 pt-8"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <h2
            className="text-sm uppercase tracking-widest font-medium mb-4"
            style={{ color: 'var(--muted)' }}
          >
            Connect
          </h2>
          <div className="flex flex-wrap gap-4">
            {socialLinks.map(({ href, label }) => (
              <a
                key={href}
                href={href}
                target={href.startsWith('mailto:') ? undefined : '_blank'}
                rel="noopener noreferrer"
                className="text-sm hover:underline"
                style={{ color: 'var(--text)' }}
              >
                {label} →
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
