import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'
import MarkdownRenderer from '@/components/public/MarkdownRenderer'
import { BreadcrumbJsonLd } from '@/components/public/JsonLd'
import type { Metadata } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bagas.dev'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const note = await prisma.post.findUnique({ where: { slug } })
  if (!note) return {}

  const description = note.description || `${note.content.slice(0, 155).replace(/[#\n]/g, ' ').trim()}...`

  return {
    title: note.title,
    description,
    alternates: { canonical: `/notes/${slug}` },
    openGraph: {
      type: 'article',
      title: note.title,
      description,
      url: `${siteUrl}/notes/${slug}`,
    },
  }
}

export default async function NoteDetailPage({ params }: Props) {
  const { slug } = await params
  const note = await prisma.post.findUnique({
    where: { slug, published: true, type: 'note' },
  })

  if (!note) notFound()

  return (
    <article>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: siteUrl },
          { name: 'Notes', url: `${siteUrl}/notes` },
          { name: note.title, url: `${siteUrl}/notes/${note.slug}` },
        ]}
      />
      <div className="mb-8">
        <Link
          href="/notes"
          className="text-sm hover:underline mb-6 block"
          style={{ color: 'var(--muted)' }}
        >
          &larr; Back to Notes
        </Link>
        <h1
          className="text-4xl font-serif font-normal mb-4"
          style={{ letterSpacing: '-0.02em' }}
        >
          {note.title}
        </h1>
        <div className="flex flex-wrap items-center gap-3">
          <time
            className="text-sm font-mono"
            style={{ color: 'var(--muted)' }}
            dateTime={note.createdAt.toISOString()}
          >
            {formatDate(note.createdAt)}
          </time>
          {note.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {note.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 rounded-full border"
                  style={{
                    borderColor: 'var(--card-border)',
                    color: 'var(--muted)',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <MarkdownRenderer content={note.content} />
    </article>
  )
}
