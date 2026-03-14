import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'
import MarkdownRenderer from '@/components/public/MarkdownRenderer'
import { BlogPostJsonLd, BreadcrumbJsonLd } from '@/components/public/JsonLd'
import ArticleClient from './ArticleClient'
import type { Metadata } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bagas.dev'

interface Props {
  params: Promise<{ slug: string }>
}

function calculateReadTime(content: string): number {
  const words = content.replace(/[#*`\[\]()>-]/g, ' ').split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 220))
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
      ...(post.thumbnail ? { images: [{ url: post.thumbnail }] } : {}),
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
  const readTime = calculateReadTime(post.content)

  // Fetch adjacent posts for prev/next navigation
  const [prevPost, nextPost] = await Promise.all([
    prisma.post.findFirst({
      where: { type: 'post', published: true, createdAt: { lt: post.createdAt } },
      orderBy: { createdAt: 'desc' },
      select: { title: true, slug: true },
    }),
    prisma.post.findFirst({
      where: { type: 'post', published: true, createdAt: { gt: post.createdAt } },
      orderBy: { createdAt: 'asc' },
      select: { title: true, slug: true },
    }),
  ])

  // Fetch "Read Next" suggestion (next post or random featured)
  const readNextPost = nextPost || await prisma.post.findFirst({
    where: { type: 'post', published: true, slug: { not: slug } },
    orderBy: { createdAt: 'desc' },
    select: { title: true, slug: true, description: true, thumbnail: true },
  })

  // Fetch series posts if this post is part of a series
  let seriesPosts: { title: string; slug: string; seriesOrder: number | null }[] = []
  if (post.series) {
    seriesPosts = await prisma.post.findMany({
      where: { series: post.series, published: true },
      orderBy: { seriesOrder: 'asc' },
      select: { title: true, slug: true, seriesOrder: true },
    })
  }

  // Fetch all posts for sidebar
  const allPosts = await prisma.post.findMany({
    where: { type: 'post', published: true },
    orderBy: { createdAt: 'desc' },
    select: { slug: true, title: true, tags: true, series: true, createdAt: true },
  })

  return (
    <ArticleClient
      post={{
        title: post.title,
        slug: post.slug,
        content: post.content,
        description,
        thumbnail: post.thumbnail,
        tags: post.tags,
        series: post.series,
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
      }}
      readTime={readTime}
      prevPost={prevPost}
      nextPost={nextPost}
      readNextPost={readNextPost}
      seriesPosts={seriesPosts}
      allPosts={allPosts.map(p => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
      }))}
    >
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
      <MarkdownRenderer content={post.content} className="article-body" />
    </ArticleClient>
  )
}
