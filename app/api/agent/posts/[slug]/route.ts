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
    const post = await prisma.post.findUnique({ where: { slug } })
    if (!post) return error('Post not found', 404)
    return success(post)
  } catch (err) {
    console.error('Agent get post error:', err)
    return error('Failed to fetch post')
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!verifyAgentKey(request)) return unauthorized()

  try {
    const { slug } = await params
    const existing = await prisma.post.findUnique({ where: { slug } })
    if (!existing) return error('Post not found', 404)

    const body = await request.json()

    // Only allow updating safe fields
    const data: Record<string, unknown> = {}
    const allowed = ['title', 'content', 'description', 'icon', 'tags', 'category', 'type', 'published', 'featured']
    for (const key of allowed) {
      if (body[key] !== undefined) data[key] = body[key]
    }

    // Handle slug change
    if (body.slug && body.slug !== slug) {
      const slugExists = await prisma.post.findUnique({ where: { slug: body.slug } })
      if (slugExists) return error(`Slug "${body.slug}" already in use`, 409)
      data.slug = body.slug
    }

    const post = await prisma.post.update({ where: { slug }, data })
    return success(post)
  } catch (err) {
    console.error('Agent update post error:', err)
    return error('Failed to update post')
  }
}
