import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAgentKey, unauthorized, success, error } from '@/lib/agent-auth'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!verifyAgentKey(request)) return unauthorized()

  try {
    const { slug } = await params
    const project = await prisma.project.findUnique({ where: { slug } })
    if (!project) return error('Project not found', 404)
    return success(project)
  } catch (err) {
    console.error('Agent get project error:', err)
    return error('Failed to fetch project')
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!verifyAgentKey(request)) return unauthorized()

  try {
    const { slug } = await params
    const existing = await prisma.project.findUnique({ where: { slug } })
    if (!existing) return error('Project not found', 404)

    const body = await request.json()

    const data: Record<string, unknown> = {}
    const allowed = ['name', 'description', 'image', 'demoUrl', 'repo', 'articleUrl', 'tech', 'year', 'featured', 'sortOrder']
    for (const key of allowed) {
      if (body[key] !== undefined) data[key] = body[key]
    }

    if (body.slug && body.slug !== slug) {
      const slugExists = await prisma.project.findUnique({ where: { slug: body.slug } })
      if (slugExists) return error(`Slug "${body.slug}" already in use`, 409)
      data.slug = body.slug
    }

    const project = await prisma.project.update({ where: { slug }, data })
    return success(project)
  } catch (err) {
    console.error('Agent update project error:', err)
    return error('Failed to update project')
  }
}
