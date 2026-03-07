import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''

    const where: Record<string, unknown> = {}
    if (search) where.name = { contains: search, mode: 'insensitive' }
    if (category) where.category = category

    const skills = await prisma.skill.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json({ skills })
  } catch (error) {
    console.error('Error fetching skills:', error)
    return NextResponse.json({ error: 'Failed to fetch skills' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { name, icon, url, category, sortOrder, featured } = data

    const slug = data.slug || slugify(name)

    const existing = await prisma.skill.findUnique({ where: { slug } })
    const finalSlug = existing ? `${slug}-${Date.now()}` : slug

    const skill = await prisma.skill.create({
      data: {
        name,
        slug: finalSlug,
        icon: icon || null,
        url: url || null,
        category: category || 'language',
        level: data.level || 'intermediate',
        yearsOfExp: data.yearsOfExp != null ? parseFloat(data.yearsOfExp) : null,
        sortOrder: sortOrder || 0,
        featured: featured || false,
      },
    })

    return NextResponse.json(skill, { status: 201 })
  } catch (error) {
    console.error('Error creating skill:', error)
    return NextResponse.json({ error: 'Failed to create skill' }, { status: 500 })
  }
}
