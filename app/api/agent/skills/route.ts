import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAgentKey, unauthorized, success, error } from '@/lib/agent-auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  if (!verifyAgentKey(request)) return unauthorized()

  try {
    const category = request.nextUrl.searchParams.get('category') || ''

    const where: Record<string, unknown> = {}
    if (category) where.category = category

    const [skills, total] = await Promise.all([
      prisma.skill.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      }),
      prisma.skill.count({ where }),
    ])

    return success({ skills, total })
  } catch (err) {
    console.error('Agent skills error:', err)
    return error('Failed to fetch skills')
  }
}
