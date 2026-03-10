import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import DashboardTraffic, { DashboardStats } from '@/components/admin/DashboardTraffic'

export const dynamic = 'force-dynamic'

async function getDashboardData() {
  const [
    totalPosts,
    publishedPosts,
    totalNotes,
    publishedNotes,
    totalSkills,
    totalProjects,
    recentPosts,
    recentNotes,
    recentProjects,
  ] = await Promise.all([
    prisma.post.count({ where: { type: 'post' } }),
    prisma.post.count({ where: { type: 'post', published: true } }),
    prisma.post.count({ where: { type: 'note' } }),
    prisma.post.count({ where: { type: 'note', published: true } }),
    prisma.skill.count(),
    prisma.project.count(),
    prisma.post.findMany({
      where: { type: 'post' },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: { id: true, title: true, published: true, updatedAt: true, type: true },
    }),
    prisma.post.findMany({
      where: { type: 'note' },
      orderBy: { updatedAt: 'desc' },
      take: 3,
      select: { id: true, title: true, published: true, updatedAt: true, type: true },
    }),
    prisma.project.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 3,
      select: { id: true, name: true, updatedAt: true },
    }),
  ])

  const recentActivity = [
    ...recentPosts.map((p) => ({ id: p.id, title: p.title, published: p.published, updatedAt: p.updatedAt, contentType: p.type })),
    ...recentNotes.map((n) => ({ id: n.id, title: n.title, published: n.published, updatedAt: n.updatedAt, contentType: 'note' })),
    ...recentProjects.map((p) => ({ id: p.id, title: p.name, published: true, updatedAt: p.updatedAt, contentType: 'project' })),
  ]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 6)

  return {
    counts: { totalPosts, publishedPosts, totalNotes, publishedNotes, totalSkills, totalProjects },
    recentActivity,
  }
}

function typeInfo(contentType: string) {
  if (contentType === 'post') return { label: 'Post', color: '#8a6d3b' }
  if (contentType === 'note') return { label: 'Note', color: '#b4762c' }
  return { label: 'Project', color: '#5a8a5e' }
}

function editHref(contentType: string, id: string) {
  if (contentType === 'project') return `/admin/projects/${id}/edit`
  if (contentType === 'note') return `/admin/notes/${id}/edit`
  return `/admin/posts/${id}/edit`
}

function relTime(date: Date) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export default async function AdminDashboard() {
  const { counts, recentActivity } = await getDashboardData()

  const contentRows = [
    { label: 'Posts', count: counts.publishedPosts, sub: 'published', href: '/admin/posts', color: '#b4762c' },
    { label: 'Notes', count: counts.publishedNotes, sub: 'published', href: '/admin/notes', color: '#c9a96e' },
    { label: 'Skills', count: counts.totalSkills, sub: 'total', href: '/admin/skills', color: '#8a7a62' },
    { label: 'Projects', count: counts.totalProjects, sub: 'total', href: '/admin/projects', color: '#5c4e3c' },
  ]

  return (
    <div className="adm-page-in" style={{ display: 'flex', flexDirection: 'column', gap: 24, minHeight: 'calc(100vh - 72px)' }}>
      {/* Header */}
      <div className="adm-dash-header">
        <div>
          <h1 className="adm-dash-title">{getGreeting()}, Commander</h1>
          <p className="adm-dash-subtitle">Here&apos;s what&apos;s happening on your site</p>
        </div>
        <div className="adm-dash-quick">
          <Link href="/admin/posts/new" className="adm-quick-btn adm-quick-btn--outline">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 2v12M2 8h12" strokeLinecap="round" /></svg>
            New Post
          </Link>
          <Link href="/admin/notes/new" className="adm-quick-btn">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 2v12M2 8h12" strokeLinecap="round" /></svg>
            New Note
          </Link>
        </div>
      </div>

      {/* Stats row (client component, fetches analytics) */}
      <DashboardStats publishedPosts={counts.publishedPosts} />

      {/* Bottom grid: Traffic card (flex:3) | Content Overview + Recent Activity (flex:2) */}
      <div className="adm-dash-bottom">
        {/* Left: Traffic card */}
        <div className="adm-dash-bottom-left">
          <DashboardTraffic />
        </div>

        {/* Right: Content Overview + Recent Activity stacked */}
        <div className="adm-dash-bottom-right">
          {/* Content Overview */}
          <div className="adm-activity">
            <div className="adm-activity-header">
              <h2 className="adm-activity-title">Content Overview</h2>
            </div>
            <div style={{ padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: 0 }}>
              {contentRows.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="adm-content-row"
                >
                  <span className="adm-content-dot" style={{ background: item.color }} />
                  <span className="adm-content-label">{item.label}</span>
                  <span className="adm-content-count">{item.count}</span>
                  <span className="adm-content-sub">{item.sub}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="adm-activity">
            <div className="adm-activity-header">
              <h2 className="adm-activity-title">Recent Activity</h2>
              <span className="adm-activity-count">{recentActivity.length} items</span>
            </div>
            <div className="adm-activity-list">
              {recentActivity.length === 0 ? (
                <div className="adm-activity-empty">
                  <p>No activity yet. Create your first post!</p>
                </div>
              ) : (
                recentActivity.map((item, i) => {
                  const { label, color } = typeInfo(item.contentType)
                  return (
                    <Link
                      key={`${item.contentType}-${item.id}`}
                      href={editHref(item.contentType, item.id)}
                      className="adm-activity-row"
                      style={{ animationDelay: `${i * 40}ms` }}
                    >
                      <span className="adm-activity-badge" style={{ background: `color-mix(in srgb, ${color} 15%, transparent)`, color }}>{label}</span>
                      <span className="adm-activity-name">{item.title}</span>
                      <span className="adm-activity-time">{relTime(item.updatedAt)}</span>
                    </Link>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
