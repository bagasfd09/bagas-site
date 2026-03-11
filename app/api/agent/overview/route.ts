import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAgentKey, unauthorized, success, error } from '@/lib/agent-auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  if (!verifyAgentKey(request)) return unauthorized()

  try {
    const [
      postCount,
      noteCount,
      projectCount,
      skillCount,
      settings,
      recentPosts,
      recentProjects,
    ] = await Promise.all([
      prisma.post.count({ where: { type: 'post', published: true } }),
      prisma.post.count({ where: { type: 'note', published: true } }),
      prisma.project.count(),
      prisma.skill.count(),
      prisma.siteSettings.findUnique({ where: { id: 'main' } }),
      prisma.post.findMany({
        where: { published: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { title: true, slug: true, type: true, createdAt: true },
      }),
      prisma.project.findMany({
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: { name: true, slug: true, updatedAt: true },
      }),
    ])

    return success({
      counts: {
        posts: postCount,
        notes: noteCount,
        projects: projectCount,
        skills: skillCount,
      },
      site: settings ? {
        name: settings.name,
        siteName: settings.siteName,
        tagline: settings.tagline,
      } : null,
      recentPosts,
      recentProjects,
    })
  } catch (err) {
    console.error('Agent overview error:', err)
    return error('Failed to fetch overview')
  }
}
