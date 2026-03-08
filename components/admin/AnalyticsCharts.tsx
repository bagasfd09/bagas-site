'use client'

import { useEffect, useState, useRef, useMemo } from 'react'

/* ── Types ─────────────────────────────────────────────────── */

interface DailyData { date: string; views: number; visitors: number }
interface CountryData { country: string; code: string; views: number; visitors: number }
interface PageData { path: string; views: number }

interface CtaStat { total: number; today: number }

interface AnalyticsData {
  summary: {
    totalViews: number
    uniqueVisitors: number
    todayViews: number
    todayVisitors: number
    yesterdayViews: number
  }
  daily: DailyData[]
  countries: CountryData[]
  topPages: PageData[]
  ctaStats?: {
    cvDownloads: CtaStat
    linkedinClicks: CtaStat
  }
}

interface SeoQuery { query: string; clicks: number; impressions: number; ctr: number; position: number }
interface SeoPage { page: string; clicks: number; impressions: number; ctr: number; position: number }
interface SeoDaily { date: string; clicks: number; impressions: number; ctr: number; position: number }

interface SeoData {
  configured: boolean
  summary?: { totalClicks: number; totalImpressions: number; avgCtr: number; avgPosition: number }
  queries?: SeoQuery[]
  pages?: SeoPage[]
  daily?: SeoDaily[]
}

/* ── Helpers ───────────────────────────────────────────────── */

function flag(code: string): string {
  if (!code || code === 'XX') return '\u{1F310}'
  return String.fromCodePoint(...code.toUpperCase().split('').map((c) => 0x1f1e6 + c.charCodeAt(0) - 65))
}

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

/* ── Mini area chart ───────────────────────────────────────── */

function MiniChart({
  data,
  valueKey,
  secondKey,
  color = 'var(--admin-accent)',
  secondColor = 'var(--admin-info)',
  height = 130,
}: {
  data: { date: string; [k: string]: number | string }[]
  valueKey: string
  secondKey?: string
  color?: string
  secondColor?: string
  height?: number
}) {
  const [hovered, setHovered] = useState<number | null>(null)
  const ref = useRef<SVGSVGElement>(null)
  const uid = useMemo(() => Math.random().toString(36).slice(2, 8), [])
  if (data.length === 0) return null

  const W = 500, H = height
  const pT = 6, pB = 20, cH = H - pT - pB
  const step = W / Math.max(data.length - 1, 1)
  const vals = data.map((d) => d[valueKey] as number)
  const maxV = Math.max(...vals, 1)
  const pts = vals.map((v, i) => ({ x: i * step, y: pT + cH - (v / maxV) * cH }))

  let pts2: { x: number; y: number }[] = []
  if (secondKey) {
    const vals2 = data.map((d) => d[secondKey] as number)
    pts2 = vals2.map((v, i) => ({ x: i * step, y: pT + cH - (v / maxV) * cH }))
  }

  function smooth(p: { x: number; y: number }[]) {
    if (p.length < 2) return ''
    let d = `M ${p[0].x},${p[0].y}`
    for (let i = 0; i < p.length - 1; i++) {
      const cx = (p[i].x + p[i + 1].x) / 2
      d += ` C ${cx},${p[i].y} ${cx},${p[i + 1].y} ${p[i + 1].x},${p[i + 1].y}`
    }
    return d
  }

  function area(p: { x: number; y: number }[]) {
    return `${smooth(p)} L ${p[p.length - 1].x},${pT + cH} L ${p[0].x},${pT + cH} Z`
  }

  const gridLines = 3
  const gridVals = Array.from({ length: gridLines }, (_, i) => Math.round((maxV / gridLines) * (gridLines - i)))

  function onMove(e: React.MouseEvent<SVGSVGElement>) {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * W
    const idx = Math.round(x / step)
    setHovered(idx >= 0 && idx < data.length ? idx : null)
  }

  const hd = hovered !== null ? data[hovered] : null
  const hp = hovered !== null ? pts[hovered] : null

  return (
    <div className="ana-minichart" onMouseLeave={() => setHovered(null)}>
      <svg ref={ref} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="ana-chart-svg" onMouseMove={onMove}>
        <defs>
          <linearGradient id={`g1-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0.01" />
          </linearGradient>
          {secondKey && (
            <linearGradient id={`g2-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={secondColor} stopOpacity="0.1" />
              <stop offset="100%" stopColor={secondColor} stopOpacity="0.01" />
            </linearGradient>
          )}
        </defs>
        {gridVals.map((val, i) => {
          const y = pT + cH - (val / maxV) * cH
          return (
            <g key={i}>
              <line x1={0} y1={y} x2={W} y2={y} stroke="var(--admin-border)" strokeWidth="0.6" strokeDasharray="3,3" />
              <text x={W - 2} y={y - 3} textAnchor="end" fill="var(--admin-text-muted)" fontSize="7.5" fontFamily="inherit">{fmt(val)}</text>
            </g>
          )
        })}
        {secondKey && pts2.length > 1 && (
          <>
            <path d={area(pts2)} fill={`url(#g2-${uid})`} />
            <path d={smooth(pts2)} fill="none" stroke={secondColor} strokeWidth="1" strokeOpacity="0.4" />
          </>
        )}
        <path d={area(pts)} fill={`url(#g1-${uid})`} />
        <path d={smooth(pts)} fill="none" stroke={color} strokeWidth="1.5" />
        {data.map((d, i) => {
          const show = data.length <= 10 || i % Math.ceil(data.length / 6) === 0 || i === data.length - 1
          if (!show) return null
          return (
            <text key={d.date} x={i * step} y={H - 3} textAnchor="middle" fill="var(--admin-text-muted)" fontSize="7" fontFamily="inherit">
              {new Date(d.date + 'T00:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric' })}
            </text>
          )
        })}
        {hp && (
          <>
            <line x1={hp.x} y1={pT} x2={hp.x} y2={pT + cH} stroke="var(--admin-text-muted)" strokeWidth="0.6" strokeDasharray="2,2" />
            <circle cx={hp.x} cy={hp.y} r="3" fill={color} stroke="var(--admin-surface)" strokeWidth="1.5" />
            {secondKey && hovered !== null && pts2[hovered] && (
              <circle cx={pts2[hovered].x} cy={pts2[hovered].y} r="2" fill={secondColor} stroke="var(--admin-surface)" strokeWidth="1.5" />
            )}
          </>
        )}
      </svg>
      {hd && hp && (
        <div className="ana-chart-tip" style={{ left: `${(hp.x / W) * 100}%`, top: `${(hp.y / H) * 100}%` }}>
          <div className="ana-tip-date">
            {new Date((hd.date as string) + 'T00:00:00').toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}
          </div>
          <div className="ana-tip-val">
            <span className="ana-tip-dot" style={{ background: color }} />
            {fmt(hd[valueKey] as number)} {valueKey}
          </div>
          {secondKey && (
            <div className="ana-tip-val">
              <span className="ana-tip-dot" style={{ background: secondColor }} />
              {fmt(hd[secondKey] as number)} {secondKey}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Main component ────────────────────────────────────────── */

export default function AnalyticsCharts() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [seo, setSeo] = useState<SeoData | null>(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(14)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch(`/api/admin/analytics?days=${days}`).then((r) => r.json()),
      fetch(`/api/admin/analytics/seo?days=${days}`).then((r) => r.json()).catch(() => ({ configured: false })),
    ]).then(([traffic, seoData]) => {
      setData(traffic)
      setSeo(seoData)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [days])

  if (loading) {
    return (
      <div className="ana-wrap">
        <div className="ana-loading">
          <div className="ana-loading-bar" />
          <span>Loading analytics...</span>
        </div>
      </div>
    )
  }

  if (!data || !data.summary) {
    return (
      <div className="ana-wrap">
        <div className="ana-empty">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--admin-text-muted)" strokeWidth="1.2">
            <path d="M3 3v18h18" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M7 16l4-6 4 3 5-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p>No analytics data yet</p>
          <span>Visits will appear here once your site gets traffic.</span>
        </div>
      </div>
    )
  }

  const { summary, daily, countries, topPages, ctaStats } = data
  const trend = pct(summary.todayViews, summary.yesterdayViews)
  const avgViews = daily.length > 0 ? Math.round(daily.reduce((s, d) => s + d.views, 0) / daily.length) : 0
  const topCountryViews = countries.length > 0 ? countries[0].views : 1
  const topPageViews = topPages.length > 0 ? topPages[0].views : 1
  const hasSeo = seo?.configured && seo.summary

  return (
    <div className="ana-wrap">
      {/* Header */}
      <div className="ana-header">
        <h2 className="ana-title">Analytics</h2>
        <div className="ana-period-tabs">
          {[7, 14, 30].map((d) => (
            <button key={d} className={`ana-period-tab ${days === d ? 'active' : ''}`} onClick={() => setDays(d)}>
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* ── Two-column layout: Traffic | Search ──────────────── */}
      <div className="ana-split">
        {/* LEFT: Traffic */}
        <div className="ana-col">
          {/* KPIs */}
          <div className="ana-kpi-row">
            <div className="ana-kpi">
              <span className="ana-kpi-val">{fmt(summary.todayViews)}</span>
              <span className="ana-kpi-label">Today</span>
              <span className={`ana-kpi-trend ${trend.cls}`}>{trend.text}</span>
            </div>
            <div className="ana-kpi-sep" />
            <div className="ana-kpi">
              <span className="ana-kpi-val">{fmt(summary.uniqueVisitors)}</span>
              <span className="ana-kpi-label">Visitors</span>
            </div>
            <div className="ana-kpi-sep" />
            <div className="ana-kpi">
              <span className="ana-kpi-val">{fmt(summary.totalViews)}</span>
              <span className="ana-kpi-label">Views</span>
              <span className="ana-kpi-sub">~{fmt(avgViews)}/d</span>
            </div>
          </div>

          {/* Traffic chart */}
          <div className="ana-card">
            <div className="ana-card-head">
              <span className="ana-card-title">Traffic</span>
              <div className="ana-chart-legend">
                <span className="ana-leg"><span className="ana-leg-line" style={{ background: '#14b8a6' }} /> Views</span>
                <span className="ana-leg"><span className="ana-leg-line" style={{ background: '#64748b', opacity: 0.5 }} /> Visitors</span>
              </div>
            </div>
            <MiniChart
              data={daily.map((d) => ({ date: d.date, views: d.views, visitors: d.visitors }))}
              valueKey="views"
              secondKey="visitors"
              color="#14b8a6"
              secondColor="#64748b"
            />
          </div>

          {/* Countries + Pages */}
          <div className="ana-grid-2">
            <div className="ana-card">
              <div className="ana-card-head">
                <span className="ana-card-title">Countries</span>
                <span className="ana-card-count">{countries.length}</span>
              </div>
              <div className="ana-list">
                {countries.slice(0, 5).map((c, i) => (
                  <div key={c.country} className="ana-row">
                    <span className="ana-row-rank">{i + 1}</span>
                    <span className="ana-row-flag">{flag(c.code)}</span>
                    <span className="ana-row-name">{c.country}</span>
                    <div className="ana-row-bar-bg"><div className="ana-row-bar" style={{ width: `${(c.views / topCountryViews) * 100}%` }} /></div>
                    <span className="ana-row-val">{fmt(c.views)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="ana-card">
              <div className="ana-card-head">
                <span className="ana-card-title">Top Pages</span>
                <span className="ana-card-count">{topPages.length}</span>
              </div>
              <div className="ana-list">
                {topPages.slice(0, 5).map((p, i) => (
                  <div key={p.path} className="ana-row">
                    <span className="ana-row-rank">{i + 1}</span>
                    <span className="ana-row-path">{p.path}</span>
                    <div className="ana-row-bar-bg"><div className="ana-row-bar ana-row-bar--b" style={{ width: `${(p.views / topPageViews) * 100}%` }} /></div>
                    <span className="ana-row-val">{fmt(p.views)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CTA Clicks */}
          {ctaStats && (
            <div className="ana-card">
              <div className="ana-card-head">
                <span className="ana-card-title">CTA Clicks</span>
              </div>
              <div style={{ padding: '12px 14px', display: 'flex', gap: 12 }}>
                <div className="ana-cta-stat">
                  <div className="ana-cta-icon" style={{ background: 'color-mix(in srgb, var(--admin-accent) 12%, transparent)' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--admin-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                  </div>
                  <div className="ana-cta-info">
                    <span className="ana-cta-label">Resume Downloads</span>
                    <span className="ana-cta-val">{fmt(ctaStats.cvDownloads.total)}</span>
                    <span className="ana-cta-today">{ctaStats.cvDownloads.today} today</span>
                  </div>
                </div>
                <div className="ana-cta-stat">
                  <div className="ana-cta-icon" style={{ background: 'color-mix(in srgb, var(--admin-info) 12%, transparent)' }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="var(--admin-info)">
                      <path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854V1.146zm4.943 12.248V6.169H2.542v7.225h2.401zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248-.822 0-1.359.54-1.359 1.248 0 .694.521 1.248 1.327 1.248h.016zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016l.016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225h2.4z"/>
                    </svg>
                  </div>
                  <div className="ana-cta-info">
                    <span className="ana-cta-label">LinkedIn Clicks</span>
                    <span className="ana-cta-val">{fmt(ctaStats.linkedinClicks.total)}</span>
                    <span className="ana-cta-today">{ctaStats.linkedinClicks.today} today</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Search / SEO */}
        <div className="ana-col">
          {!hasSeo ? (
            <SeoSetupCard />
          ) : (
            <SeoColumn seo={seo!} days={days} />
          )}
        </div>
      </div>
    </div>
  )
}

/* ── SEO Column (right side) ───────────────────────────────── */

function SeoColumn({ seo, days }: { seo: SeoData; days: number }) {
  const s = seo.summary!
  const queries = seo.queries || []
  const pages = seo.pages || []
  const daily = seo.daily || []

  return (
    <>
      {/* KPIs */}
      <div className="ana-kpi-row">
        <div className="ana-kpi">
          <span className="ana-kpi-val">{fmt(s.totalClicks)}</span>
          <span className="ana-kpi-label">Clicks</span>
        </div>
        <div className="ana-kpi-sep" />
        <div className="ana-kpi">
          <span className="ana-kpi-val">{fmt(s.totalImpressions)}</span>
          <span className="ana-kpi-label">Impr.</span>
        </div>
        <div className="ana-kpi-sep" />
        <div className="ana-kpi">
          <span className="ana-kpi-val">{s.avgCtr}%</span>
          <span className="ana-kpi-label">CTR</span>
        </div>
        <div className="ana-kpi-sep" />
        <div className="ana-kpi">
          <span className="ana-kpi-val">{s.avgPosition}</span>
          <span className="ana-kpi-label">Pos.</span>
          <span className={`ana-kpi-trend ${s.avgPosition <= 10 ? 'up' : s.avgPosition <= 20 ? '' : 'down'}`}>
            {s.avgPosition <= 10 ? 'Pg 1' : s.avgPosition <= 20 ? 'Pg 2' : `Pg ${Math.ceil(s.avgPosition / 10)}`}
          </span>
        </div>
      </div>

      {/* Search chart */}
      {daily.length > 0 && (
        <div className="ana-card">
          <div className="ana-card-head">
            <span className="ana-card-title">Search</span>
            <div className="ana-chart-legend">
              <span className="ana-leg"><span className="ana-leg-line" style={{ background: 'var(--admin-success)' }} /> Clicks</span>
              <span className="ana-leg"><span className="ana-leg-line" style={{ background: 'var(--admin-warning)', opacity: 0.5 }} /> Impr.</span>
            </div>
          </div>
          <MiniChart
            data={daily.map((d) => ({ date: d.date, clicks: d.clicks, impressions: d.impressions }))}
            valueKey="clicks"
            secondKey="impressions"
            color="var(--admin-success)"
            secondColor="var(--admin-warning)"
          />
        </div>
      )}

      {/* Queries */}
      <div className="ana-card">
        <div className="ana-card-head">
          <span className="ana-card-title">Top Queries</span>
          <span className="ana-card-count">{queries.length}</span>
        </div>
        {queries.length === 0 ? (
          <div className="ana-card-empty">No query data yet</div>
        ) : (
          <div className="ana-seo-table">
            <div className="ana-seo-thead">
              <span className="ana-seo-th ana-seo-th--query">Query</span>
              <span className="ana-seo-th">Clicks</span>
              <span className="ana-seo-th">Pos.</span>
            </div>
            {queries.slice(0, 6).map((q) => (
              <div key={q.query} className="ana-seo-tr">
                <span className="ana-seo-td ana-seo-td--query" title={q.query}>{q.query}</span>
                <span className="ana-seo-td">{fmt(q.clicks)}</span>
                <span className={`ana-seo-td ana-seo-pos ${q.position <= 3 ? 'top' : q.position <= 10 ? 'good' : ''}`}>
                  {q.position}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pages */}
      <div className="ana-card">
        <div className="ana-card-head">
          <span className="ana-card-title">Search Pages</span>
          <span className="ana-card-count">{pages.length}</span>
        </div>
        {pages.length === 0 ? (
          <div className="ana-card-empty">No page data yet</div>
        ) : (
          <div className="ana-seo-table">
            <div className="ana-seo-thead">
              <span className="ana-seo-th ana-seo-th--query">Page</span>
              <span className="ana-seo-th">Clicks</span>
              <span className="ana-seo-th">Pos.</span>
            </div>
            {pages.slice(0, 6).map((p) => {
              let short = p.page
              try { short = new URL(p.page).pathname } catch { /* keep full */ }
              return (
                <div key={p.page} className="ana-seo-tr">
                  <span className="ana-seo-td ana-seo-td--query ana-seo-td--mono" title={p.page}>{short}</span>
                  <span className="ana-seo-td">{fmt(p.clicks)}</span>
                  <span className={`ana-seo-td ana-seo-pos ${p.position <= 3 ? 'top' : p.position <= 10 ? 'good' : ''}`}>
                    {p.position}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}

/* ── SEO Setup Card (compact) ──────────────────────────────── */

function SeoSetupCard() {
  return (
    <div className="ana-card ana-setup">
      <div className="ana-setup-icon">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--admin-text-muted)" strokeWidth="1.5">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </div>
      <h3 className="ana-setup-title">Google Search Console</h3>
      <p className="ana-setup-desc">Connect to track your search rankings, clicks, and top queries.</p>
      <div className="ana-setup-steps">
        <div className="ana-setup-step">
          <span className="ana-setup-num">1</span>
          <div>
            <strong>Create a Service Account</strong>
            <span>Google Cloud Console &rarr; IAM &rarr; Service Accounts</span>
          </div>
        </div>
        <div className="ana-setup-step">
          <span className="ana-setup-num">2</span>
          <div>
            <strong>Add to Search Console</strong>
            <span>Settings &rarr; Users &rarr; Add service account as Owner</span>
          </div>
        </div>
        <div className="ana-setup-step">
          <span className="ana-setup-num">3</span>
          <div>
            <strong>Set Environment Variables</strong>
            <code className="ana-setup-code">GOOGLE_SERVICE_ACCOUNT_EMAIL{'\n'}GOOGLE_SERVICE_ACCOUNT_KEY{'\n'}GOOGLE_SEARCH_CONSOLE_SITE</code>
          </div>
        </div>
      </div>
    </div>
  )
}
