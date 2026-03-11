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
        referrer: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })

    // Active now: unique IPs in last 5 minutes
    const activeIps = new Set(
      views.filter((v) => v.createdAt >= fiveMinAgo).map((v) => v.ipHash)
    )

    // Timeline: group views into 1-minute buckets for the dot chart
    const timeline: { minuteAgo: number; count: number }[] = []
    for (let m = 29; m >= 0; m--) {
      const bucketStart = new Date(now.getTime() - (m + 1) * 60 * 1000)
      const bucketEnd = new Date(now.getTime() - m * 60 * 1000)
      const count = views.filter((v) => v.createdAt >= bucketStart && v.createdAt < bucketEnd).length
      timeline.push({ minuteAgo: m, count })
    }

    // Top active pages (top 5 by view count)
    const pageMap = new Map<string, number>()
    for (const v of views) {
      pageMap.set(v.path, (pageMap.get(v.path) || 0) + 1)
    }
    const topPages = Array.from(pageMap.entries())
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Top referrers (top 5 by count)
    const refMap = new Map<string, number>()
    for (const v of views) {
      let ref = '(direct)'
      if (v.referrer) {
        try {
          ref = new URL(v.referrer).hostname.replace(/^www\./, '')
        } catch {
          ref = v.referrer
        }
      }
      refMap.set(ref, (refMap.get(ref) || 0) + 1)
    }
    const topReferrers = Array.from(refMap.entries())
      .map(([referrer, count]) => ({ referrer, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    return NextResponse.json({
      activeNow: activeIps.size,
      viewsLast30: views.length,
      timeline,
      topPages,
      topReferrers,
    })
  } catch (err) {
    console.error('Realtime analytics error:', err)
    return NextResponse.json({ error: 'Failed to fetch realtime data' }, { status: 500 })
  }
}
