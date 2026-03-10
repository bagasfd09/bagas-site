import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    const where: Record<string, unknown> = {}
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
      ]
    }

    const experiences = await prisma.experience.findMany({
      where,
      orderBy: { startDate: 'desc' },
    })

    return NextResponse.json({ experiences })
  } catch (error) {
    console.error('Error fetching experiences:', error)
    return NextResponse.json({ error: 'Failed to fetch experiences' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { title, company, companyLogo, location, startDate, endDate, current, description, tech, projects, sortOrder } = data

    let finalSortOrder = sortOrder
    if (finalSortOrder == null || finalSortOrder === '') {
      const maxSort = await prisma.experience.aggregate({
        _max: { sortOrder: true },
      })
      finalSortOrder = (maxSort._max.sortOrder ?? -1) + 1
    }

    const experience = await prisma.experience.create({
      data: {
        title,
        company,
        companyLogo: companyLogo || null,
        location: location || null,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        current: current || false,
        description: description || null,
        tech: tech || [],
        projects: projects || [],
        sortOrder: finalSortOrder,
      },
    })

    return NextResponse.json(experience, { status: 201 })
  } catch (error) {
    console.error('Error creating experience:', error)
    return NextResponse.json({ error: 'Failed to create experience' }, { status: 500 })
  }
}
