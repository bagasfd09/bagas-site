import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const isGlobal = request.nextUrl.searchParams.get('global') === 'true'

  // Global stats: total views, unique visitors, post count across all /blog/* pages
  if (isGlobal) {
    const [totalViews, uniqueGroups, totalPosts] = await Promise.all([
      prisma.pageView.count({ where: { path: { startsWith: '/blog/' } } }),
      prisma.pageView.groupBy({
        by: ['ipHash'],
        where: { path: { startsWith: '/blog/' } },
      }).then(groups => groups.length),
      prisma.post.count({ where: { published: true, type: 'post' } }),
    ])

    return NextResponse.json({
      totalViews,
      totalUniqueVisitors: uniqueGroups,
      totalPosts,
    })
  }

  // Per-post stats
  const slug = request.nextUrl.searchParams.get('slug')
  if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 })

  const path = `/blog/${slug}`

  const [views, uniqueVisitors, post] = await Promise.all([
    prisma.pageView.count({ where: { path } }),
    prisma.pageView.groupBy({
      by: ['ipHash'],
      where: { path },
    }).then(groups => groups.length),
    prisma.post.findUnique({
      where: { slug },
      select: { content: true },
    }),
  ])

  const wordCount = post?.content?.split(/\s+/).filter(Boolean).length ?? 0
  const avgReadMin = Math.max(1, Math.round(wordCount / 200))

  return NextResponse.json({
    slug,
    path,
    views,
    uniqueVisitors,
    wordCount,
    avgReadMin,
  })
}
