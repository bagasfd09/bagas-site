import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const experiences = await prisma.experience.findMany({
      orderBy: { startDate: 'desc' },
      select: {
        id: true,
        title: true,
        company: true,
        companyLogo: true,
        location: true,
        startDate: true,
        endDate: true,
        current: true,
        description: true,
        tech: true,
        projects: true,
      },
    })

    return NextResponse.json({ experiences })
  } catch (error) {
    console.error('Error fetching experiences:', error)
    return NextResponse.json({ error: 'Failed to fetch experiences' }, { status: 500 })
  }
}
