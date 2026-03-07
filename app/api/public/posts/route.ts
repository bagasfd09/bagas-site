import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const typeParam = searchParams.get('type') || 'post'

    // Support comma-separated types, e.g. type=post,deep-dive
    const types = typeParam.split(',').map((t) => t.trim())

    const where =
      types.length === 1
        ? { type: types[0], published: true }
        : { type: { in: types }, published: true }

    const posts = await prisma.post.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        tags: true,
        category: true,
        type: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ posts })
  } catch (error) {
    console.error('Error fetching public posts:', error)
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
  }
}
