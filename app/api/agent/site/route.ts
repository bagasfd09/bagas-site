import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAgentKey, unauthorized, success, error } from '@/lib/agent-auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  if (!verifyAgentKey(request)) return unauthorized()

  try {
    const settings = await prisma.siteSettings.findUnique({ where: { id: 'main' } })
    if (!settings) return error('Site settings not found', 404)
    return success(settings)
  } catch (err) {
    console.error('Agent get site error:', err)
    return error('Failed to fetch site settings')
  }
}

export async function PUT(request: NextRequest) {
  if (!verifyAgentKey(request)) return unauthorized()

  try {
    const body = await request.json()

    const data: Record<string, unknown> = {}
    const allowed = [
      'name', 'siteName', 'tagline', 'heroIntro', 'heroImage', 'cvUrl',
      'bio', 'sidebarBio', 'github', 'linkedin', 'twitter', 'email',
      'bluesky', 'rssEnabled', 'showExperience', 'showBlog', 'showNotes',
      'showSkills', 'showProjects',
    ]
    for (const key of allowed) {
      if (body[key] !== undefined) data[key] = body[key]
    }

    if (Object.keys(data).length === 0) {
      return error('No valid fields to update', 400)
    }

    const settings = await prisma.siteSettings.update({
      where: { id: 'main' },
      data,
    })

    return success(settings)
  } catch (err) {
    console.error('Agent update site error:', err)
    return error('Failed to update site settings')
  }
}
