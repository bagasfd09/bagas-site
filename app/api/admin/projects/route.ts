import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    const where: Record<string, unknown> = {}
    if (search) {
      where.name = { contains: search, mode: 'insensitive' }
    }

    const projects = await prisma.project.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json({ projects })
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const {
      name, description, image, repo, demoUrl, articleUrl,
      year, tech, featured, sortOrder,
    } = data

    let slug = data.slug || slugify(name)
    const existing = await prisma.project.findUnique({ where: { slug } })
    if (existing) {
      slug = `${slug}-${Date.now()}`
    }

    const project = await prisma.project.create({
      data: {
        name,
        slug,
        description: description || '',
        image: image || null,
        repo: repo || null,
        demoUrl: demoUrl || null,
        articleUrl: articleUrl || null,
        year: year ? Number(year) : null,
        tech: Array.isArray(tech)
          ? tech
          : tech
          ? String(tech).split(',').map((t: string) => t.trim()).filter(Boolean)
          : [],
        featured: featured || false,
        sortOrder: sortOrder || 0,
      },
    })

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
  }
}
