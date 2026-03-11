import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAgentKey, unauthorized, success, error } from '@/lib/agent-auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  if (!verifyAgentKey(request)) return unauthorized()

  try {
    const params = request.nextUrl.searchParams
    const featuredParam = params.get('featured') || 'all'
    const limit = Math.min(parseInt(params.get('limit') || '50', 10), 100)

    const where: Record<string, unknown> = {}
    if (featuredParam === 'true') where.featured = true
    else if (featuredParam === 'false') where.featured = false

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        take: limit,
      }),
      prisma.project.count({ where }),
    ])

    return success({ projects, total })
  } catch (err) {
    console.error('Agent projects list error:', err)
    return error('Failed to fetch projects')
  }
}

export async function POST(request: NextRequest) {
  if (!verifyAgentKey(request)) return unauthorized()

  try {
    const body = await request.json()

    if (!body.name || !body.slug || !body.description) {
      return error('Missing required fields: name, slug, description', 400)
    }

    const existing = await prisma.project.findUnique({ where: { slug: body.slug } })
    if (existing) return error(`Project with slug "${body.slug}" already exists`, 409)

    const project = await prisma.project.create({
      data: {
        name: body.name,
        slug: body.slug,
        description: body.description,
        image: body.image || null,
        demoUrl: body.demoUrl || null,
        repo: body.repo || null,
        articleUrl: body.articleUrl || null,
        tech: body.tech || [],
        year: body.year || null,
        featured: body.featured ?? false,
        sortOrder: body.sortOrder ?? 0,
      },
    })

    return success(project)
  } catch (err) {
    console.error('Agent create project error:', err)
    return error('Failed to create project')
  }
}
