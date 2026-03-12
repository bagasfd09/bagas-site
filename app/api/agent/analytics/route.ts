import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAgentKey, unauthorized, success, error } from '@/lib/agent-auth'
import { toDateKeyWIB, startOfDayWIB } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  if (!verifyAgentKey(request)) return unauthorized()

  try {
    const now = new Date()
    const days = parseInt(request.nextUrl.searchParams.get('days') || '30', 10)
    const startDate = startOfDayWIB(new Date(now.getTime() - (days - 1) * 24 * 60 * 60 * 1000))

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
        userAgent: true,
      },
    })

    // Daily breakdown
    const dailyMap = new Map<string, { views: number; visitors: Set<string> }>()
    for (let d = 0; d < days; d++) {
      const date = new Date(now.getTime() - d * 24 * 60 * 60 * 1000)
      const key = toDateKeyWIB(date)
      dailyMap.set(key, { views: 0, visitors: new Set() })
    }
    for (const v of views) {
      const key = toDateKeyWIB(v.createdAt)
      const entry = dailyMap.get(key)
      if (entry) { entry.views++; entry.visitors.add(v.ipHash) }
    }
    const daily = Array.from(dailyMap.entries())
      .map(([date, data]) => ({ date, views: data.views, visitors: data.visitors.size }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Countries
    const countryMap = new Map<string, { country: string; code: string; views: number }>()
    for (const v of views) {
      const existing = countryMap.get(v.country)
      if (existing) existing.views++
      else countryMap.set(v.country, { country: v.country, code: v.countryCode, views: 1 })
    }
    const countries = Array.from(countryMap.values()).sort((a, b) => b.views - a.views).slice(0, 10)

    // Top pages
    const pageMap = new Map<string, number>()
    for (const v of views) pageMap.set(v.path, (pageMap.get(v.path) || 0) + 1)
    const topPages = Array.from(pageMap.entries())
      .map(([path, count]) => ({ path, views: count }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10)

    // Devices
    let desktop = 0, mobile = 0, tablet = 0
    for (const v of views) {
      const ua = (v.userAgent || '').toLowerCase()
      if (/ipad|tablet|kindle/.test(ua)) tablet++
      else if (/mobile|android|iphone|ipod/.test(ua)) mobile++
      else desktop++
    }
    const total = desktop + mobile + tablet || 1

    // Summary
    const allVisitors = new Set(views.map((v) => v.ipHash))
    const todayKey = toDateKeyWIB(now)
    const todayData = dailyMap.get(todayKey)

    return success({
      summary: {
        totalViews: views.length,
        uniqueVisitors: allVisitors.size,
        todayViews: todayData?.views || 0,
        todayVisitors: todayData?.visitors.size || 0,
      },
      daily,
      countries,
      topPages,
      devices: [
        { device: 'Desktop', pct: Math.round((desktop / total) * 100) },
        { device: 'Mobile', pct: Math.round((mobile / total) * 100) },
        { device: 'Tablet', pct: Math.round((tablet / total) * 100) },
      ],
    })
  } catch (err) {
    console.error('Agent analytics error:', err)
    return error('Failed to fetch analytics')
  }
}
