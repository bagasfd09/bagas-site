import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()
    const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000)
    const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000)

    const views = await prisma.pageView.findMany({
      where: {
        createdAt: { gte: thirtyMinAgo },
        NOT: { path: { startsWith: '__cta/' } },
      },
      select: {
        path: true,
        ipHash: true,
        country: true,
        countryCode: true,
        referrer: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    // Active now: unique IPs in last 5 minutes
    const activeIps = new Set(
      views.filter((v) => v.createdAt >= fiveMinAgo).map((v) => v.ipHash)
    )

    // Country breakdown (top 5)
    const countryMap = new Map<string, { country: string; code: string; views: number }>()
    for (const v of views) {
      const key = v.countryCode || 'XX'
      const existing = countryMap.get(key)
      if (existing) {
        existing.views++
      } else {
        countryMap.set(key, { country: v.country || 'Unknown', code: key, views: 1 })
      }
    }
    const countries = Array.from(countryMap.values())
      .sort((a, b) => b.views - a.views)
      .slice(0, 5)

    // Recent views (last 20)
    const recentViews = views.slice(0, 20).map((v) => ({
      path: v.path,
      country: v.country || 'Unknown',
      countryCode: v.countryCode || 'XX',
      referrer: v.referrer || null,
      createdAt: v.createdAt.toISOString(),
    }))

    return NextResponse.json({
      activeNow: activeIps.size,
      viewsLast30: views.length,
      recentViews,
      countries,
    })
  } catch (err) {
    console.error('Realtime analytics error:', err)
    return NextResponse.json({ error: 'Failed to fetch realtime data' }, { status: 500 })
  }
}
