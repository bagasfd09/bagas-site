'use client'

import { useEffect, useState, useRef, useMemo, useCallback } from 'react'

/* ── Types ─────────────────────────────────────────────────── */

interface DailyData { date: string; views: number; visitors: number }

interface AnalyticsSummary {
  totalViews: number
  uniqueVisitors: number
  todayViews: number
  todayVisitors: number
  yesterdayViews: number
}

interface AnalyticsData {
  summary: AnalyticsSummary
  daily: DailyData[]
}

type TabId = 'overview' | 'realtime' | 'google'

interface RealtimeData {
  activeNow: number
  viewsLast30: number
  timeline: { minuteAgo: number; count: number }[]
  topPages: { path: string; count: number }[]
  topReferrers: { referrer: string; count: number }[]
}

interface SeoData {
  configured: boolean
  summary?: { totalClicks: number; totalImpressions: number; avgCtr: number; avgPosition: number }
  queries?: { query: string; clicks: number; impressions: number; ctr: number; position: number }[]
}

interface GaAnalyticsData {
  summary: AnalyticsSummary
  topPages: { path: string; views: number }[]
  countries: { country: string; code: string; views: number; visitors: number }[]
  devices: { device: string; pct: number }[]
}

/* ── Helpers ───────────────────────────────────────────────── */

function fmt(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return n.toString()
}

function pct(today: number, yesterday: number) {
  if (yesterday === 0 && today === 0) return { text: '0%', cls: '' }
  if (yesterday === 0) return { text: '+100%', cls: 'up' }
  const p = Math.round(((today - yesterday) / yesterday) * 100)
  return { text: `${p >= 0 ? '+' : ''}${p}%`, cls: p > 0 ? 'up' : p < 0 ? 'down' : '' }
}


/* ── Wave Chart SVG ────────────────────────────────────────── */

function WaveChart({ data }: { data: DailyData[] }) {
  const [hovered, setHovered] = useState<number | null>(null)
  const [viewportH, setViewportH] = useState(0)
  const ref = useRef<SVGSVGElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const uid = useMemo(() => Math.random().toString(36).slice(2, 8), [])

  // Detect viewport height for responsive grid
  useEffect(() => {
    setViewportH(window.innerHeight)
    const onResize = () => setViewportH(window.innerHeight)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Responsive: 2K+ monitors (viewport > 1100px tall) get more Y-axis detail
  const isLarge = viewportH > 1100
  const niceMax = isLarge ? 500 : 400
  const yStep = isLarge ? 50 : 100
  const gridSteps: number[] = []
  for (let v = 0; v <= niceMax; v += yStep) {
    gridSteps.push(v / niceMax)
  }

  const W = 600, H = 200
  const pT = 10, pB = 22, pL = 36, pR = 16
  const cW = W - pL - pR, cH = H - pT - pB

  const views = data.map((d) => d.views)
  const visitors = data.map((d) => d.visitors)

  function toX(i: number) { return pL + (i / Math.max(data.length - 1, 1)) * cW }
  function toY(v: number) { return pT + cH - (v / niceMax) * cH }

  function smooth(vals: number[]) {
    const pts = vals.map((v, i) => ({ x: toX(i), y: toY(v) }))
    if (pts.length < 2) return ''
    let d = `M ${pts[0].x},${pts[0].y}`
    for (let i = 0; i < pts.length - 1; i++) {
      const cx = (pts[i].x + pts[i + 1].x) / 2
      d += ` C ${cx},${pts[i].y} ${cx},${pts[i + 1].y} ${pts[i + 1].x},${pts[i + 1].y}`
    }
    return d
  }

  function area(vals: number[]) {
    const pts = vals.map((v, i) => ({ x: toX(i), y: toY(v) }))
    return `${smooth(vals)} L ${pts[pts.length - 1].x},${pT + cH} L ${pts[0].x},${pT + cH} Z`
  }

  // X-axis: date labels
  const dateLabels: { x: number; label: string }[] = []
  const labelCount = Math.min(6, data.length)
  for (let i = 0; i < labelCount; i++) {
    const idx = Math.round((i / Math.max(labelCount - 1, 1)) * (data.length - 1))
    const d = new Date(data[idx].date + 'T00:00:00')
    dateLabels.push({ x: toX(idx), label: d.toLocaleDateString('en', { month: 'short', day: 'numeric' }) })
  }

  function onMove(e: React.MouseEvent<SVGSVGElement>) {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * W
    const idx = Math.round(((x - pL) / cW) * (data.length - 1))
    setHovered(idx >= 0 && idx < data.length ? idx : null)
  }

  return (
    <div ref={wrapRef} className="adm-traf-chart-wrap" onMouseLeave={() => setHovered(null)}>
      <svg ref={ref} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMin meet" className="adm-traf-svg" onMouseMove={onMove} style={{ width: '100%', display: 'block' }}>
        <defs>
          <linearGradient id={`tg1-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#b4762c" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#b4762c" stopOpacity="0.01" />
          </linearGradient>
          <pattern id={`dots-${uid}`} x={pL} y={pT} width="5" height="5" patternUnits="userSpaceOnUse">
            <circle cx="2.5" cy="2.5" r="0.5" fill="#c8c1b4" />
          </pattern>
        </defs>

        {/* Dot grid background */}
        <rect x={pL} y={pT} width={cW} height={cH} fill={`url(#dots-${uid})`} />

        {/* Grid lines + Y labels */}
        {gridSteps.map((pctVal) => {
          const val = Math.round(niceMax * (1 - pctVal))
          const y = pT + cH * pctVal
          const isMajor = val % 100 === 0
          return (
            <g key={pctVal}>
              <line x1={pL} y1={y} x2={W - pR} y2={y} stroke={isMajor ? '#ebe7e0' : '#f0ece6'} strokeWidth={isMajor ? 0.7 : 0.5} strokeDasharray={isMajor ? undefined : '2,2'} />
              {isMajor ? (
                <text x={pL - 6} y={y + 3} textAnchor="end" fill="#9a917f" fontSize="9" fontFamily="inherit">{val}</text>
              ) : (
                <text x={pL - 6} y={y + 3} textAnchor="end" fill="#c0b9ab" fontSize="7.5" fontFamily="inherit">{val}</text>
              )}
            </g>
          )
        })}

        {/* Area fills */}
        <path d={area(views)} fill={`url(#tg1-${uid})`} />

        {/* Lines */}
        <path d={smooth(views)} fill="none" stroke="#b4762c" strokeWidth="2" />
        <path d={smooth(visitors)} fill="none" stroke="#d4a24c" strokeWidth="1.5" strokeDasharray="5,3" />

        {/* X labels */}
        {dateLabels.map((d, i) => (
          <text key={i} x={d.x} y={H - 6} textAnchor="middle" fill="#9a917f" fontSize="8" fontFamily="inherit">{d.label}</text>
        ))}

        {/* Hover line */}
        {hovered !== null && (
          <>
            <line x1={toX(hovered)} y1={pT} x2={toX(hovered)} y2={pT + cH} stroke="#9a917f" strokeWidth="0.6" strokeDasharray="2,2" />
            <circle cx={toX(hovered)} cy={toY(views[hovered])} r="3.5" fill="#b4762c" stroke="#fff" strokeWidth="1.5" />
            <circle cx={toX(hovered)} cy={toY(visitors[hovered])} r="2.5" fill="#d4a24c" stroke="#fff" strokeWidth="1.5" />
          </>
        )}
      </svg>

      {/* Hover tooltip */}
      {hovered !== null && data[hovered] && (
        <div className="adm-traf-tip" style={{ left: `${(toX(hovered) / W) * 100}%` }}>
          <div style={{ fontSize: '0.6875rem', color: '#9a917f', marginBottom: 2 }}>
            {new Date(data[hovered].date + 'T00:00:00').toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}
          </div>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#3b3225' }}>
            {data[hovered].views} views &middot; {data[hovered].visitors} visitors
          </div>
        </div>
      )}

    </div>
  )
}

/* ── Static wave fallback ──────────────────────────────────── */

function StaticWaveChart() {
  return (
    <div className="adm-traf-chart-wrap">
      <svg viewBox="0 0 600 220" className="adm-traf-svg" style={{ width: '100%', display: 'block' }}>
        <defs>
          <linearGradient id="tg-static" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#b4762c" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#b4762c" stopOpacity="0.01" />
          </linearGradient>
          <pattern id="dots-static" x="36" y="10" width="5" height="5" patternUnits="userSpaceOnUse">
            <circle cx="2.5" cy="2.5" r="0.5" fill="#c8c1b4" />
          </pattern>
        </defs>
        {/* Dot grid background */}
        <rect x={36} y={10} width={564} height={186} fill="url(#dots-static)" />
        {/* Grid */}
        {[0, 0.25, 0.5, 0.75, 1].map((p) => {
          const y = 10 + 186 * p
          const val = Math.round(400 * (1 - p))
          return (
            <g key={p}>
              <line x1={36} y1={y} x2={600} y2={y} stroke="#ebe7e0" strokeWidth="0.7" />
              <text x={30} y={y + 3} textAnchor="end" fill="#9a917f" fontSize="9">{val}</text>
            </g>
          )
        })}
        {/* Wave area */}
        <path d="M 36,130 C 110,90 170,70 230,100 C 290,130 350,50 410,80 C 470,110 530,60 600,70 L 600,196 L 36,196 Z" fill="url(#tg-static)" />
        <path d="M 36,130 C 110,90 170,70 230,100 C 290,130 350,50 410,80 C 470,110 530,60 600,70" fill="none" stroke="#b4762c" strokeWidth="2" />
        <path d="M 36,155 C 110,130 170,115 230,135 C 290,155 350,100 410,115 C 470,140 530,100 600,110" fill="none" stroke="#d4a24c" strokeWidth="1.5" strokeDasharray="5,3" />
        {/* X labels */}
        {['Feb 9', 'Feb 15', 'Feb 22', 'Mar 1', 'Mar 7', 'Mar 10'].map((label, i) => (
          <text key={label} x={36 + i * (548 / 5)} y={214} textAnchor="middle" fill="#9a917f" fontSize="8">{label}</text>
        ))}
      </svg>
    </div>
  )
}

/* ── Dot Timeline Chart ─────────────────────────────────────── */

function DotTimeline({ timeline }: { timeline: RealtimeData['timeline'] }) {
  const maxCount = Math.max(...timeline.map((t) => t.count), 1)
  // Max dots per column — scale so biggest column is ~6 dots tall
  const maxDots = Math.min(Math.max(maxCount, 1), 8)

  return (
    <div className="adm-traf-rt-timeline">
      <div className="adm-traf-rt-dots-grid">
        {timeline.map((bucket, i) => {
          const dots = Math.min(bucket.count, maxDots)
          // Color intensity: older = lighter, newer = darker
          const age = 1 - (bucket.minuteAgo / 30)
          return (
            <div key={i} className="adm-traf-rt-dots-col">
              {Array.from({ length: dots }).map((_, j) => (
                <div
                  key={j}
                  className="adm-traf-rt-dot-item"
                  style={{
                    opacity: 0.35 + age * 0.65,
                    background: age > 0.7 ? '#b4762c' : age > 0.4 ? '#d4a24c' : '#d9c9a8',
                  }}
                />
              ))}
            </div>
          )
        })}
      </div>
      <div className="adm-traf-rt-timeline-labels">
        <span>30 min ago</span>
        <span>Now</span>
      </div>
    </div>
  )
}

/* ── Real-time Tab Content ─────────────────────────────────── */

function RealtimeContent() {
  const [data, setData] = useState<RealtimeData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(() => {
    fetch('/api/admin/analytics/realtime')
      .then((r) => r.json())
      .then((d: RealtimeData) => {
        if (typeof d.activeNow === 'number') setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [fetchData])

  if (loading) {
    return (
      <div className="adm-traf-loading">
        <div className="adm-traf-loading-bar" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="adm-traf-tab-content adm-traf-rt-empty">
        <p style={{ color: '#9a917f', fontSize: '0.8125rem' }}>Unable to load real-time data</p>
      </div>
    )
  }

  const maxPageCount = data.topPages.length > 0 ? data.topPages[0].count : 1

  return (
    <div className="adm-traf-tab-content">
      {/* Big centered active count */}
      <div className="adm-traf-rt-hero">
        <span className="adm-traf-rt-hero-num">{data.activeNow}</span>
        <span className="adm-traf-rt-hero-label">active visitors right now</span>
      </div>

      {/* Dot timeline */}
      <div className="adm-traf-rt-section">
        <span className="adm-traf-rt-section-title">VISITORS — LAST 30 MINUTES</span>
        <DotTimeline timeline={data.timeline} />
      </div>

      {/* Bottom two columns */}
      {(data.topPages.length > 0 || data.topReferrers.length > 0) && (
        <div className="adm-traf-rt-bottom">
          {/* Top Active Pages */}
          <div className="adm-traf-rt-col">
            <span className="adm-traf-rt-section-title">TOP ACTIVE PAGES</span>
            <div className="adm-traf-rt-list">
              {data.topPages.map((p) => (
                <div key={p.path} className="adm-traf-rt-list-row">
                  <span className="adm-traf-rt-list-label">{p.path}</span>
                  <div className="adm-traf-rt-list-bar-wrap">
                    <div
                      className="adm-traf-rt-list-bar"
                      style={{ width: `${(p.count / maxPageCount) * 100}%` }}
                    />
                  </div>
                  <span className="adm-traf-rt-list-count">{p.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Referrers */}
          <div className="adm-traf-rt-col">
            <span className="adm-traf-rt-section-title">TOP REFERRERS</span>
            <div className="adm-traf-rt-list">
              {data.topReferrers.map((r) => (
                <div key={r.referrer} className="adm-traf-rt-list-row">
                  <span className="adm-traf-rt-list-label">{r.referrer}</span>
                  <span className="adm-traf-rt-list-count">{r.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {data.viewsLast30 === 0 && data.topPages.length === 0 && (
        <div className="adm-traf-rt-empty-feed">
          <p>No recent visitors</p>
        </div>
      )}
    </div>
  )
}

/* ── Google Analytics Tab Content ──────────────────────────── */

const GA_RANGE_OPTIONS = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 14 days', days: 14 },
  { label: 'Last 28 days', days: 28 },
  { label: 'Last 60 days', days: 60 },
  { label: 'Last 90 days', days: 90 },
]

const DEVICE_COLORS: Record<string, string> = {
  Desktop: '#b4762c',
  Mobile: '#d4a24c',
  Tablet: '#d9c9a8',
}

function GoogleAnalyticsContent() {
  const [analytics, setAnalytics] = useState<GaAnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [gaDays, setGaDays] = useState(28)
  const [gaOpen, setGaOpen] = useState(false)
  const gaDropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/analytics?days=${gaDays}`)
      .then((r) => r.json())
      .then((d: GaAnalyticsData) => {
        if (d?.summary) setAnalytics(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [gaDays])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (gaDropRef.current && !gaDropRef.current.contains(e.target as Node)) setGaOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  if (loading) {
    return (
      <div className="adm-traf-loading">
        <div className="adm-traf-loading-bar" />
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="adm-traf-tab-content adm-traf-seo-empty">
        <p className="adm-traf-seo-empty-title">No analytics data</p>
        <p className="adm-traf-seo-empty-desc">Start tracking page views to see Google Analytics-style data here.</p>
      </div>
    )
  }

  const s = analytics.summary
  const bounceRate = s.totalViews > 0
    ? Math.round((1 - s.uniqueVisitors / s.totalViews) * 1000) / 10
    : 0
  const avgDuration = '—'
  const topPages = (analytics.topPages || []).slice(0, 5)
  const devices = analytics.devices || []
  const countries = (analytics.countries || []).slice(0, 3)
  const countriesTotal = (analytics.countries || []).reduce((sum, c) => sum + c.views, 0) || 1
  const topCountriesPct = countries.map((c) => ({
    ...c,
    pct: Math.round((c.views / countriesTotal) * 100),
  }))
  const othersPct = Math.max(0, 100 - topCountriesPct.reduce((sum, c) => sum + c.pct, 0))
  const gaLabel = GA_RANGE_OPTIONS.find((o) => o.days === gaDays)?.label ?? `Last ${gaDays} days`

  return (
    <div className="adm-traf-tab-content">
      {/* Range dropdown for GA tab */}
      <div className="adm-traf-ga-range-row">
        <div className="adm-traf-range-wrap" ref={gaDropRef}>
          <button className="adm-traf-range" onClick={() => setGaOpen(!gaOpen)}>
            Range: {gaLabel}
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {gaOpen && (
            <div className="adm-traf-dropdown">
              {GA_RANGE_OPTIONS.map((opt) => (
                <button
                  key={opt.days}
                  className={`adm-traf-dropdown-item${opt.days === gaDays ? ' adm-traf-dropdown-item--active' : ''}`}
                  onClick={() => { setGaDays(opt.days); setGaOpen(false) }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 4 KPI cards */}
      <div className="adm-traf-ga-kpis">
        <div className="adm-traf-ga-kpi-card">
          <span className="adm-traf-ga-kpi-label">SESSIONS</span>
          <span className="adm-traf-ga-kpi-val">{fmt(s.totalViews)}</span>
        </div>
        <div className="adm-traf-ga-kpi-card">
          <span className="adm-traf-ga-kpi-label">USERS</span>
          <span className="adm-traf-ga-kpi-val">{fmt(s.uniqueVisitors)}</span>
        </div>
        <div className="adm-traf-ga-kpi-card">
          <span className="adm-traf-ga-kpi-label">BOUNCE RATE</span>
          <span className="adm-traf-ga-kpi-val">{bounceRate}%</span>
        </div>
        <div className="adm-traf-ga-kpi-card">
          <span className="adm-traf-ga-kpi-label">AVG. DURATION</span>
          <span className="adm-traf-ga-kpi-val">{avgDuration}</span>
        </div>
      </div>

      {/* Bottom two columns */}
      <div className="adm-traf-ga-bottom">
        {/* Left: Top Pages */}
        <div className="adm-traf-ga-col">
          <span className="adm-traf-rt-section-title">TOP PAGES</span>
          {topPages.length > 0 ? (
            <table className="adm-traf-seo-table">
              <thead>
                <tr className="adm-traf-seo-tr">
                  <th className="adm-traf-seo-th">Page</th>
                  <th className="adm-traf-seo-th adm-traf-seo-th--num">Views</th>
                </tr>
              </thead>
              <tbody>
                {topPages.map((p) => (
                  <tr key={p.path} className="adm-traf-seo-tr">
                    <td className="adm-traf-seo-td">{p.path}</td>
                    <td className="adm-traf-seo-td adm-traf-seo-td--num">{fmt(p.views)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="adm-traf-ga-no-data">No page data yet</p>
          )}
        </div>

        {/* Right: Devices + Countries */}
        <div className="adm-traf-ga-col">
          {/* Devices */}
          <span className="adm-traf-rt-section-title">DEVICES</span>
          <div className="adm-traf-ga-devices">
            {devices.map((d) => (
              <div key={d.device} className="adm-traf-ga-device-row">
                <span className="adm-traf-ga-device-name">{d.device}</span>
                <span className="adm-traf-ga-device-pct">{d.pct}%</span>
                <div className="adm-traf-ga-device-bar-wrap">
                  <div
                    className="adm-traf-ga-device-bar"
                    style={{ width: `${d.pct}%`, background: DEVICE_COLORS[d.device] || '#d9c9a8' }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Countries */}
          <span className="adm-traf-rt-section-title" style={{ marginTop: 16 }}>TOP COUNTRIES</span>
          <div className="adm-traf-ga-countries">
            {topCountriesPct.map((c) => (
              <div key={c.country} className="adm-traf-ga-country-row">
                <span className="adm-traf-ga-country-name">{c.country}</span>
                <span className="adm-traf-ga-country-pct">{c.pct}%</span>
              </div>
            ))}
            {othersPct > 0 && (
              <div className="adm-traf-ga-country-row">
                <span className="adm-traf-ga-country-name">Others</span>
                <span className="adm-traf-ga-country-pct">{othersPct}%</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Stats Row (client, fetches analytics) ─────────────────── */

function DashboardStats({ publishedPosts }: { publishedPosts: number }) {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)

  useEffect(() => {
    fetch('/api/admin/analytics?days=30')
      .then((r) => r.json())
      .then((d: AnalyticsData) => {
        if (d?.summary) setSummary(d.summary)
      })
      .catch(() => {})
  }, [])

  const todayViews = summary?.todayViews ?? 0
  const yesterdayViews = summary?.yesterdayViews ?? 0
  const trend = pct(todayViews, yesterdayViews)
  const avgPerDay = summary ? Math.round(summary.totalViews / 30) : 0

  const cards = [
    {
      label: 'TODAY',
      value: fmt(todayViews),
      trend: summary ? trend.text : null,
      trendCls: trend.cls,
      sub: 'page views',
    },
    {
      label: 'VISITORS',
      value: fmt(summary?.uniqueVisitors ?? 0),
      trend: null,
      trendCls: '',
      sub: 'unique visitors',
    },
    {
      label: 'TOTAL VIEWS',
      value: fmt(summary?.totalViews ?? 0),
      trend: summary ? `~${fmt(avgPerDay)}/d` : null,
      trendCls: '',
      sub: 'all time',
    },
    {
      label: 'POSTS',
      value: String(publishedPosts),
      trend: null,
      trendCls: '',
      sub: 'published',
    },
  ]

  return (
    <div className="adm-dstats">
      {cards.map((card, i) => (
        <div
          key={card.label}
          className="adm-dstat"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <span className="adm-dstat-label">{card.label}</span>
          <div className="adm-dstat-row">
            <span className="adm-dstat-value">{summary || card.label === 'POSTS' ? card.value : '--'}</span>
            {card.trend && (
              <span className={`adm-dstat-trend ${card.trendCls}`}>{card.trend}</span>
            )}
          </div>
          <span className="adm-dstat-sub">{card.sub}</span>
        </div>
      ))}
    </div>
  )
}

/* ── Stats Row export ──────────────────────────────────────── */

export { DashboardStats }

/* ── Traffic Card (standalone) ────────────────────────────── */

const RANGE_OPTIONS = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 14 days', days: 14 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 60 days', days: 60 },
  { label: 'Last 90 days', days: 90 },
]

const TABS: { id: TabId; label: string; icon: JSX.Element }[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="1" width="6" height="6" rx="1" strokeLinecap="round" /><rect x="9" y="1" width="6" height="6" rx="1" strokeLinecap="round" /><rect x="1" y="9" width="6" height="6" rx="1" strokeLinecap="round" /><rect x="9" y="9" width="6" height="6" rx="1" strokeLinecap="round" /></svg>,
  },
  {
    id: 'realtime',
    label: 'Real-time',
    icon: <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="3" /><circle cx="8" cy="8" r="6.5" strokeDasharray="2 2" /></svg>,
  },
  {
    id: 'google',
    label: 'Google Analytics',
    icon: <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 12l4-5 3 3 5-7" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  },
]

export default function DashboardTraffic() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(30)
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const dropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/analytics?days=${days}`)
      .then((r) => r.json())
      .then((d: AnalyticsData) => {
        if (d?.summary) setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [days])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const currentLabel = RANGE_OPTIONS.find((o) => o.days === days)?.label ?? `Last ${days} days`

  return (
    <div className="adm-traf">
      {/* Header */}
      <div className="adm-traf-header">
        <div>
          <h2 className="adm-traf-title">Traffic</h2>
          <p className="adm-traf-sub">
            {activeTab === 'realtime' ? 'Live visitors on your site' : activeTab === 'google' ? 'Google Analytics data' : 'Site analytics overview'}
          </p>
        </div>
        {activeTab === 'realtime' && (
          <span className="adm-traf-rt-live-badge">
            <span className="adm-traf-rt-live-dot" />
            Live
          </span>
        )}
        {activeTab === 'overview' && (
          <div className="adm-traf-range-wrap" ref={dropRef}>
            <button className="adm-traf-range" onClick={() => setOpen(!open)}>
              {currentLabel}
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {open && (
              <div className="adm-traf-dropdown">
                {RANGE_OPTIONS.map((opt) => (
                  <button
                    key={opt.days}
                    className={`adm-traf-dropdown-item${opt.days === days ? ' adm-traf-dropdown-item--active' : ''}`}
                    onClick={() => { setDays(opt.days); setOpen(false) }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="adm-traf-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`adm-traf-tab${activeTab === tab.id ? ' adm-traf-tab--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <>
          {loading ? (
            <div className="adm-traf-loading">
              <div className="adm-traf-loading-bar" />
            </div>
          ) : data && data.daily.length > 0 ? (
            <WaveChart data={data.daily} />
          ) : (
            <StaticWaveChart />
          )}

          {/* Legend row */}
          <div className="adm-traf-legend">
            <div className="adm-traf-leg-items">
              <span className="adm-traf-leg">
                <span className="adm-traf-leg-line" style={{ background: '#b4762c' }} />
                Page Views
              </span>
              <span className="adm-traf-leg">
                <span className="adm-traf-leg-line adm-traf-leg-line--dashed" style={{ background: '#d4a24c' }} />
                Unique Visitors
              </span>
            </div>
            <div className="adm-traf-bounce">
              <span className="adm-traf-bounce-val">
                {data ? `${Math.round((1 - (data.summary.uniqueVisitors / Math.max(data.summary.totalViews, 1))) * 100)}%` : '57%'}
              </span>
              <span className="adm-traf-bounce-label">Avg. Bounce Rate</span>
            </div>
          </div>
        </>
      )}

      {activeTab === 'realtime' && <RealtimeContent />}
      {activeTab === 'google' && <GoogleAnalyticsContent />}
    </div>
  )
}
