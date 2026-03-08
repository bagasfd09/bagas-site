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
    const days = parseInt(request.nextUrl.searchParams.get('days') || '30', 10)
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    startDate.setHours(0, 0, 0, 0)

    // Get all page views in range (exclude CTA tracking paths)
    const views = await prisma.pageView.findMany({
      where: {
        createdAt: { gte: startDate },
        NOT: { path: { startsWith: '__cta/' } },
      },
      select: {
        createdAt: true,
        country: true,
        countryCode: true,
        path: true,
        ipHash: true,
      },
    })

    // === Daily views ===
    const dailyMap = new Map<string, { views: number; visitors: Set<string> }>()
    for (let d = 0; d < days; d++) {
      const date = new Date(now.getTime() - d * 24 * 60 * 60 * 1000)
      const key = date.toISOString().slice(0, 10)
      dailyMap.set(key, { views: 0, visitors: new Set() })
    }

    for (const v of views) {
      const key = v.createdAt.toISOString().slice(0, 10)
      const entry = dailyMap.get(key)
      if (entry) {
        entry.views++
        entry.visitors.add(v.ipHash)
      }
    }

    const daily = Array.from(dailyMap.entries())
      .map(([date, data]) => ({
        date,
        views: data.views,
        visitors: data.visitors.size,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // === Country breakdown ===
    const countryMap = new Map<string, { country: string; code: string; views: number; visitors: Set<string> }>()
    for (const v of views) {
      const existing = countryMap.get(v.country)
      if (existing) {
        existing.views++
        existing.visitors.add(v.ipHash)
      } else {
        countryMap.set(v.country, {
          country: v.country,
          code: v.countryCode,
          views: 1,
          visitors: new Set([v.ipHash]),
        })
      }
    }

    const countries = Array.from(countryMap.values())
      .map((c) => ({ country: c.country, code: c.code, views: c.views, visitors: c.visitors.size }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 20)

    // === Top pages ===
    const pageMap = new Map<string, number>()
    for (const v of views) {
      pageMap.set(v.path, (pageMap.get(v.path) || 0) + 1)
    }

    const topPages = Array.from(pageMap.entries())
      .map(([path, count]) => ({ path, views: count }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10)

    // === CTA clicks ===
    const ctaClicks = await prisma.pageView.findMany({
      where: {
        path: { startsWith: '__cta/' },
        createdAt: { gte: startDate },
      },
      select: { path: true, createdAt: true },
    })

    const todayStr = now.toISOString().slice(0, 10)
    const ctaStats = {
      cvDownloads: { total: 0, today: 0 },
      linkedinClicks: { total: 0, today: 0 },
    }
    for (const c of ctaClicks) {
      const isToday = c.createdAt.toISOString().slice(0, 10) === todayStr
      if (c.path === '__cta/cv-download') {
        ctaStats.cvDownloads.total++
        if (isToday) ctaStats.cvDownloads.today++
      } else if (c.path === '__cta/linkedin') {
        ctaStats.linkedinClicks.total++
        if (isToday) ctaStats.linkedinClicks.today++
      }
    }

    // === Summary ===
    const allVisitors = new Set(views.map((v: { ipHash: string }) => v.ipHash))
    const todayKey = now.toISOString().slice(0, 10)
    const todayData = dailyMap.get(todayKey)
    const yesterdayKey = new Date(now.getTime() - 86400000).toISOString().slice(0, 10)
    const yesterdayData = dailyMap.get(yesterdayKey)

    return NextResponse.json({
      summary: {
        totalViews: views.length,
        uniqueVisitors: allVisitors.size,
        todayViews: todayData?.views || 0,
        todayVisitors: todayData?.visitors.size || 0,
        yesterdayViews: yesterdayData?.views || 0,
      },
      daily,
      countries,
      topPages,
      ctaStats,
    })
  } catch (err) {
    console.error('Analytics error:', err)
    return NextResponse.json({ error: 'Failed to load analytics' }, { status: 500 })
  }
}
