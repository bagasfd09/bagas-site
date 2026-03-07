import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/utils'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const project = await prisma.project.findUnique({ where: { id } })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    return NextResponse.json(project)
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()
    const {
      name, slug: rawSlug, description, image, repo, demoUrl, articleUrl,
      year, tech, featured, sortOrder,
    } = data

    const slug = rawSlug || slugify(name)

    const existing = await prisma.project.findFirst({
      where: { slug, NOT: { id } },
    })
    if (existing) {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 400 })
    }

    const project = await prisma.project.update({
      where: { id },
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
        featured: featured ?? false,
        sortOrder: sortOrder || 0,
      },
    })

    return NextResponse.json(project)
  } catch (error) {
    console.error('Error updating project:', error)
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.project.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 })
  }
}
