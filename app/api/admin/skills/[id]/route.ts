import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const skill = await prisma.skill.findUnique({ where: { id } })
    if (!skill) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(skill)
  } catch (error) {
    console.error('Error fetching skill:', error)
    return NextResponse.json({ error: 'Failed to fetch skill' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()

    const existing = await prisma.skill.findFirst({
      where: { slug: data.slug, NOT: { id } },
    })
    if (existing) {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 400 })
    }

    const skill = await prisma.skill.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        icon: data.icon || null,
        url: data.url || null,
        category: data.category || 'language',
        level: data.level || 'intermediate',
        yearsOfExp: data.yearsOfExp != null ? parseFloat(data.yearsOfExp) : null,
        sortOrder: data.sortOrder ?? 0,
        featured: data.featured ?? false,
      },
    })

    return NextResponse.json(skill)
  } catch (error) {
    console.error('Error updating skill:', error)
    return NextResponse.json({ error: 'Failed to update skill' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.skill.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting skill:', error)
    return NextResponse.json({ error: 'Failed to delete skill' }, { status: 500 })
  }
}
