import { NextRequest } from 'next/server'
import { verifyAgentKey, unauthorized, success, error } from '@/lib/agent-auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  if (!verifyAgentKey(request)) return unauthorized()

  try {
    const days = parseInt(request.nextUrl.searchParams.get('days') || '28', 10)

    // Proxy to the existing admin SEO endpoint logic
    const siteUrl = process.env.GOOGLE_SEARCH_CONSOLE_SITE
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
    const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY

    if (!siteUrl || !serviceAccountEmail || !serviceAccountKey) {
      return success({ configured: false })
    }

    const { google } = await import('googleapis')

    const auth = new google.auth.JWT({
      email: serviceAccountEmail,
      key: serviceAccountKey.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    })

    const searchconsole = google.searchconsole({ version: 'v1', auth })

    const now = new Date()
    const endDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000)
    const dateFmt = (d: Date) => d.toISOString().slice(0, 10)

    const [queriesRes, pagesRes, dailyRes] = await Promise.all([
      searchconsole.searchanalytics.query({
        siteUrl,
        requestBody: { startDate: dateFmt(startDate), endDate: dateFmt(endDate), dimensions: ['query'], rowLimit: 10 },
      }),
      searchconsole.searchanalytics.query({
        siteUrl,
        requestBody: { startDate: dateFmt(startDate), endDate: dateFmt(endDate), dimensions: ['page'], rowLimit: 10 },
      }),
      searchconsole.searchanalytics.query({
        siteUrl,
        requestBody: { startDate: dateFmt(startDate), endDate: dateFmt(endDate), dimensions: ['date'] },
      }),
    ])

    type Row = { keys?: string[] | null; clicks?: number | null; impressions?: number | null; ctr?: number | null; position?: number | null }
    const mapRow = (r: Row) => ({
      keys: (r.keys || []) as string[],
      clicks: r.clicks ?? 0,
      impressions: r.impressions ?? 0,
      ctr: r.ctr ?? 0,
      position: r.position ?? 0,
    })

    const queries = (queriesRes.data.rows || []).map((r) => mapRow(r as Row)).map((r) => ({
      query: r.keys[0] || '', clicks: r.clicks, impressions: r.impressions,
      ctr: Math.round(r.ctr * 1000) / 10, position: Math.round(r.position * 10) / 10,
    }))

    const pages = (pagesRes.data.rows || []).map((r) => mapRow(r as Row)).map((r) => ({
      page: r.keys[0] || '', clicks: r.clicks, impressions: r.impressions,
      ctr: Math.round(r.ctr * 1000) / 10, position: Math.round(r.position * 10) / 10,
    }))

    const daily = (dailyRes.data.rows || []).map((r) => mapRow(r as Row)).map((r) => ({
      date: r.keys[0] || '', clicks: r.clicks, impressions: r.impressions,
      ctr: Math.round(r.ctr * 1000) / 10, position: Math.round(r.position * 10) / 10,
    }))

    const totalClicks = daily.reduce((s, d) => s + d.clicks, 0)
    const totalImpressions = daily.reduce((s, d) => s + d.impressions, 0)
    const avgCtr = totalImpressions > 0 ? Math.round((totalClicks / totalImpressions) * 1000) / 10 : 0
    const avgPosition = daily.length > 0
      ? Math.round((daily.reduce((s, d) => s + d.position, 0) / daily.length) * 10) / 10 : 0

    return success({
      configured: true,
      summary: { totalClicks, totalImpressions, avgCtr, avgPosition },
      queries,
      pages,
      daily,
    })
  } catch (err) {
    console.error('Agent SEO analytics error:', err)
    return error('Failed to fetch SEO data')
  }
}
