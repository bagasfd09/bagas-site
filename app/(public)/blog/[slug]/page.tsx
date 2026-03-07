import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'
import MarkdownRenderer from '@/components/public/MarkdownRenderer'
import { BlogPostJsonLd, BreadcrumbJsonLd } from '@/components/public/JsonLd'
import type { Metadata } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bagas.dev'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await prisma.post.findUnique({ where: { slug } })
  if (!post) return {}

  const description = post.description || `${post.content.slice(0, 155).replace(/[#\n]/g, ' ').trim()}...`

  return {
    title: post.title,
    description,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      type: 'article',
      title: post.title,
      description,
      url: `${siteUrl}/blog/${slug}`,
      publishedTime: post.createdAt.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      authors: ['Bagas'],
      tags: post.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description,
    },
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const post = await prisma.post.findUnique({
    where: { slug, published: true },
  })

  if (!post) notFound()

  const description = post.description || `${post.content.slice(0, 155).replace(/[#\n]/g, ' ').trim()}...`

  return (
    <article>
      <BlogPostJsonLd
        title={post.title}
        description={description}
        slug={post.slug}
        datePublished={post.createdAt.toISOString()}
        dateModified={post.updatedAt.toISOString()}
        tags={post.tags}
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: siteUrl },
          { name: 'Blog', url: `${siteUrl}/blog` },
          { name: post.title, url: `${siteUrl}/blog/${post.slug}` },
        ]}
      />
      <div className="mb-8">
        <Link
          href="/blog"
          className="text-sm hover:underline mb-6 block"
          style={{ color: 'var(--muted)' }}
        >
          &larr; Back to Blog
        </Link>
        <h1
          className="text-4xl font-serif font-normal mb-4"
          style={{ letterSpacing: '-0.02em' }}
        >
          {post.title}
        </h1>
        <div className="flex flex-wrap items-center gap-3">
          <time
            className="text-sm font-mono"
            style={{ color: 'var(--muted)' }}
            dateTime={post.createdAt.toISOString()}
          >
            {formatDate(post.createdAt)}
          </time>
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {post.tags.map((tag) => (
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

      <MarkdownRenderer content={post.content} />
    </article>
  )
}
