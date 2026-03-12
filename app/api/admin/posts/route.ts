import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all'
    const typeParam = searchParams.get('type') || 'post'
    const types = typeParam.split(',').map((t) => t.trim())

    const where: Record<string, unknown> =
      types.length === 1 ? { type: types[0] } : { type: { in: types } }

    if (search) {
      where.title = { contains: search, mode: 'insensitive' }
    }

    if (status === 'published') where.published = true
    if (status === 'draft') where.published = false

    const sort = searchParams.get('sort') || 'newest'
    const orderBy = sort === 'oldest'
      ? { createdAt: 'asc' as const }
      : sort === 'title'
        ? { title: 'asc' as const }
        : { createdAt: 'desc' as const }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.post.count({ where }),
    ])

    return NextResponse.json({ posts, total, page, limit })
  } catch (error) {
    console.error('Error fetching posts:', error)
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { title, content, description, icon, tags, category, type, published, featured } = data

    let slug = data.slug || slugify(title)

    // Check if slug exists and make unique
    const existing = await prisma.post.findUnique({ where: { slug } })
    if (existing) {
      slug = `${slug}-${Date.now()}`
    }

    const post = await prisma.post.create({
      data: {
        title,
        slug,
        content: content || '',
        description: description || null,
        icon: icon || null,
        tags: Array.isArray(tags) ? tags : (tags ? String(tags).split(',').map((t: string) => t.trim()).filter(Boolean) : []),
        category: category || 'technical',
        type: type || 'post',
        published: published || false,
        featured: featured || false,
      },
    })

    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    console.error('Error creating post:', error)
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }
}
