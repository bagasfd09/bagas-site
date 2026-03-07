import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import AnalyticsCharts from '@/components/admin/AnalyticsCharts'

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
  if (contentType === 'post') return { label: 'Post', color: '#58a6ff' }
  if (contentType === 'note') return { label: 'Note', color: '#d29922' }
  return { label: 'Project', color: '#2ea043' }
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

  return (
    <div className="adm-page-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div className="adm-dash-header">
        <div>
          <h1 className="adm-dash-title">{getGreeting()}, Commander</h1>
          <p className="adm-dash-subtitle">Here&apos;s what&apos;s happening on your site</p>
        </div>
        <div className="adm-dash-quick">
          <Link href="/admin/posts/new" className="adm-quick-btn">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 2v12M2 8h12" strokeLinecap="round" /></svg>
            New Post
          </Link>
          <Link href="/admin/notes/new" className="adm-quick-btn">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 2v12M2 8h12" strokeLinecap="round" /></svg>
            New Note
          </Link>
        </div>
      </div>

      {/* Analytics section — client component */}
      <AnalyticsCharts />

      {/* Content overview + Recent activity side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="adm-dash-bottom-grid">
        {/* Content overview */}
        <div className="adm-activity">
          <div className="adm-activity-header">
            <h2 className="adm-activity-title">Content Overview</h2>
          </div>
          <div style={{ padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              { label: 'Posts', total: counts.totalPosts, sub: `${counts.publishedPosts} published`, href: '/admin/posts', color: '#58a6ff' },
              { label: 'Notes', total: counts.totalNotes, sub: `${counts.publishedNotes} published`, href: '/admin/notes', color: '#d29922' },
              { label: 'Skills', total: counts.totalSkills, sub: 'total', href: '/admin/skills', color: '#2ea043' },
              { label: 'Projects', total: counts.totalProjects, sub: 'total', href: '/admin/projects', color: '#bc4c00' },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="adm-content-row"
              >
                <span className="adm-content-dot" style={{ background: item.color }} />
                <span className="adm-content-label">{item.label}</span>
                <span className="adm-content-count">{item.total}</span>
                <span className="adm-content-sub">{item.sub}</span>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="adm-content-arrow">
                  <path d="M6 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div className="adm-activity">
          <div className="adm-activity-header">
            <h2 className="adm-activity-title">Recent Activity</h2>
            <span className="adm-activity-count">{recentActivity.length} items</span>
          </div>
          <div className="adm-activity-list">
            {recentActivity.length === 0 ? (
              <div className="adm-activity-empty">
                <svg width="32" height="32" viewBox="0 0 64 74" fill="none" opacity="0.3">
                  <path d="M32 4c0 0-16 12-16 36h8l8 16 8-16h8C48 16 32 4 32 4z" fill="var(--admin-text-muted)" />
                </svg>
                <p>No launches yet. Create your first post!</p>
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
                    <span className="adm-activity-meta">
                      {item.contentType !== 'project' && (
                        <span className="adm-activity-status" style={{ color: item.published ? 'var(--admin-success)' : 'var(--admin-warning)' }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: item.published ? 'var(--admin-success)' : 'var(--admin-warning)', display: 'inline-block' }} />
                          {item.published ? 'Live' : 'Draft'}
                        </span>
                      )}
                      <span className="adm-activity-time">{relTime(item.updatedAt)}</span>
                    </span>
                  </Link>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
