import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const [
      totalPosts,
      publishedPosts,
      totalNotes,
      publishedNotes,
      totalProjects,
      recentPosts,
      recentNotes,
      recentProjects,
    ] = await Promise.all([
      prisma.post.count({ where: { type: 'post' } }),
      prisma.post.count({ where: { type: 'post', published: true } }),
      prisma.post.count({ where: { type: 'note' } }),
      prisma.post.count({ where: { type: 'note', published: true } }),
      prisma.project.count(),
      prisma.post.findMany({
        where: { type: 'post' },
        orderBy: { updatedAt: 'desc' },
        take: 3,
        select: { id: true, title: true, slug: true, published: true, updatedAt: true, type: true },
      }),
      prisma.post.findMany({
        where: { type: 'note' },
        orderBy: { updatedAt: 'desc' },
        take: 3,
        select: { id: true, title: true, slug: true, published: true, updatedAt: true, type: true },
      }),
      prisma.project.findMany({
        orderBy: { updatedAt: 'desc' },
        take: 3,
        select: { id: true, name: true, slug: true, updatedAt: true },
      }),
    ])

    const recentActivity = [
      ...recentPosts.map(p => ({ ...p, contentType: 'post' as const })),
      ...recentNotes.map(n => ({ ...n, contentType: 'note' as const })),
      ...recentProjects.map(p => ({
        id: p.id,
        title: p.name,
        slug: p.slug,
        published: true,
        updatedAt: p.updatedAt,
        type: 'project',
        contentType: 'project' as const,
      })),
    ]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5)

    return NextResponse.json({
      stats: {
        posts: { total: totalPosts, published: publishedPosts, draft: totalPosts - publishedPosts },
        notes: { total: totalNotes, published: publishedNotes, draft: totalNotes - publishedNotes },
        projects: { total: totalProjects },
      },
      recentActivity,
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 })
  }
}
