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
    <article className="article-page">
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: siteUrl },
          { name: 'Notes', url: `${siteUrl}/notes` },
          { name: note.title, url: `${siteUrl}/notes/${note.slug}` },
        ]}
      />
      <div className="article-header">
        <Link href="/notes" className="article-back">
          &larr; Back to Notes
        </Link>
        <h1 className="article-title">{note.title}</h1>
        <div className="article-meta">
          <time dateTime={note.createdAt.toISOString()}>
            {formatDate(note.createdAt)}
          </time>
          {note.tags.length > 0 && (
            <div className="article-tags">
              {note.tags.map((tag) => (
                <span key={tag} className="article-tag">{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      <MarkdownRenderer content={note.content} className="article-body" />
    </article>
  )
}
