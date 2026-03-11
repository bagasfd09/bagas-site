import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAgentKey, unauthorized, success, error } from '@/lib/agent-auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  if (!verifyAgentKey(request)) return unauthorized()

  try {
    const params = request.nextUrl.searchParams
    const types = (params.get('type') || 'post,note').split(',')
    const publishedParam = params.get('published') || 'all'
    const limit = Math.min(parseInt(params.get('limit') || '50', 10), 100)
    const offset = parseInt(params.get('offset') || '0', 10)
    const search = params.get('search') || ''

    const where: Record<string, unknown> = { type: { in: types } }

    if (publishedParam === 'true') where.published = true
    else if (publishedParam === 'false') where.published = false

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.post.count({ where }),
    ])

    return success({ posts, total })
  } catch (err) {
    console.error('Agent posts list error:', err)
    return error('Failed to fetch posts')
  }
}

export async function POST(request: NextRequest) {
  if (!verifyAgentKey(request)) return unauthorized()

  try {
    const body = await request.json()

    if (!body.title || !body.slug || !body.content) {
      return error('Missing required fields: title, slug, content', 400)
    }

    const existing = await prisma.post.findUnique({ where: { slug: body.slug } })
    if (existing) {
      return error(`Post with slug "${body.slug}" already exists`, 409)
    }

    const post = await prisma.post.create({
      data: {
        title: body.title,
        slug: body.slug,
        content: body.content,
        description: body.description || null,
        icon: body.icon || null,
        tags: body.tags || [],
        category: body.category || 'technical',
        type: body.type || 'post',
        published: body.published ?? false,
        featured: body.featured ?? false,
      },
    })

    return success(post)
  } catch (err) {
    console.error('Agent create post error:', err)
    return error('Failed to create post')
  }
}
