import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const { skills } = await request.json()

    if (!Array.isArray(skills) || skills.length === 0) {
      return NextResponse.json({ error: 'No skills provided' }, { status: 400 })
    }

    if (skills.length > 50) {
      return NextResponse.json({ error: 'Maximum 50 skills per batch' }, { status: 400 })
    }

    // Get existing slugs to avoid conflicts
    const existingSlugs = new Set(
      (await prisma.skill.findMany({ select: { slug: true } })).map((s) => s.slug)
    )

    // Get max sortOrder per category for auto-increment
    const categoryMaxSort = new Map<string, number>()
    const sortAgg = await prisma.skill.groupBy({
      by: ['category'],
      _max: { sortOrder: true },
    })
    for (const row of sortAgg) {
      categoryMaxSort.set(row.category, row._max.sortOrder ?? -1)
    }

    const created = []
    for (const skill of skills) {
      const name = String(skill.name || '').trim()
      if (!name) continue

      const category = skill.category || 'language'
      const level = skill.level || 'intermediate'

      // Generate unique slug
      let slug = slugify(name)
      if (existingSlugs.has(slug)) {
        slug = `${slug}-${Date.now()}`
      }
      existingSlugs.add(slug)

      // Auto sortOrder
      const currentMax = categoryMaxSort.get(category) ?? -1
      const sortOrder = currentMax + 1
      categoryMaxSort.set(category, sortOrder)

      const record = await prisma.skill.create({
        data: {
          name,
          slug,
          category,
          level,
          sortOrder,
          icon: null,
          url: null,
          featured: false,
        },
      })
      created.push(record)
    }

    return NextResponse.json({ created: created.length, skills: created }, { status: 201 })
  } catch (error) {
    console.error('Batch skill create error:', error)
    return NextResponse.json({ error: 'Failed to create skills' }, { status: 500 })
  }
}
