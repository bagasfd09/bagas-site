/* eslint-disable @next/next/no-img-element */

interface ExperienceProject {
  name: string
  logo?: string
  url?: string
}

interface Experience {
  id: string
  title: string
  company: string
  companyLogo: string | null
  location: string | null
  startDate: Date | string
  endDate: Date | string | null
  current: boolean
  description: string | null
  tech: string[]
  projects: unknown[]
}

interface CompanyGroup {
  company: string
  companyLogo: string | null
  location: string | null
  roles: Experience[]
  startDate: Date | string
  endDate: Date | string | null
  hasCurrent: boolean
}

function toProjects(raw: unknown[]): ExperienceProject[] {
  if (!raw || !Array.isArray(raw)) return []
  return raw
    .filter((p): p is Record<string, unknown> => typeof p === 'object' && p !== null)
    .map((p) => ({
      name: String(p.name || ''),
      logo: p.logo ? String(p.logo) : undefined,
      url: p.url ? String(p.url) : undefined,
    }))
    .filter((p) => p.name)
}

function formatDate(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

function calcDuration(start: Date | string, end: Date | string | null, current: boolean): string {
  const s = typeof start === 'string' ? new Date(start) : start
  const e = current ? new Date() : (end ? (typeof end === 'string' ? new Date(end) : end) : new Date())
  const months = (e.getFullYear() - s.getFullYear()) * 12 + e.getMonth() - s.getMonth()
  const yrs = Math.floor(months / 12)
  const mos = months % 12
  if (yrs === 0) return `${mos} mos`
  if (mos === 0) return `${yrs} yr${yrs > 1 ? 's' : ''}`
  return `${yrs} yr${yrs > 1 ? 's' : ''} ${mos} mos`
}

function groupByCompany(experiences: Experience[]): CompanyGroup[] {
  const groups: CompanyGroup[] = []
  for (const exp of experiences) {
    const last = groups[groups.length - 1]
    if (last && last.company === exp.company) {
      last.roles.push(exp)
      // Extend date range
      const expStart = typeof exp.startDate === 'string' ? new Date(exp.startDate) : exp.startDate
      const lastStart = typeof last.startDate === 'string' ? new Date(last.startDate) : last.startDate
      if (expStart < lastStart) last.startDate = exp.startDate
      if (!last.endDate || exp.current) last.endDate = exp.endDate
      if (exp.current) last.hasCurrent = true
    } else {
      groups.push({
        company: exp.company,
        companyLogo: exp.companyLogo,
        location: exp.location,
        roles: [exp],
        startDate: exp.startDate,
        endDate: exp.endDate,
        hasCurrent: exp.current,
      })
    }
  }
  return groups
}

function RoleProjects({ projects }: { projects: ExperienceProject[] }) {
  if (!projects || projects.length === 0) return null
  return (
    <div className="exp-projects">
      <span className="exp-projects-label">Projects</span>
      <div className="exp-projects-list">
        {projects.map((p) => {
          const inner = (
            <>
              {p.logo && (
                <img src={p.logo} alt="" className="exp-project-logo" />
              )}
              <span>{p.name}</span>
            </>
          )
          return p.url ? (
            <a key={p.name} href={p.url} target="_blank" rel="noopener noreferrer" className="exp-project-pill exp-project-pill--link">
              {inner}
            </a>
          ) : (
            <span key={p.name} className="exp-project-pill">
              {inner}
            </span>
          )
        })}
      </div>
    </div>
  )
}

export default function ExperienceTimeline({ experiences }: { experiences: Experience[] }) {
  const groups = groupByCompany(experiences)

  return (
    <div className="exp-timeline">
      {groups.map((group, gi) => {
        const isMultiRole = group.roles.length > 1
        const isLast = gi === groups.length - 1

        return (
          <div
            key={`${group.company}-${gi}`}
            className={`exp-company-block${group.hasCurrent ? ' exp-company-block--current' : ''}${isMultiRole ? ' exp-company-block--multi' : ''}`}
          >
            {/* Timeline column */}
            <div className="exp-timeline-col">
              <div className={`exp-company-dot${group.hasCurrent ? ' exp-company-dot--current' : ''}`} />
              {!isLast && (
                <div className={`exp-company-line${isMultiRole ? ' exp-company-line--thick' : ''}`} />
              )}
            </div>

            {/* Content column */}
            <div className="exp-company-content">
              {/* Company header */}
              <div className="exp-company-header">
                {group.companyLogo ? (
                  <img src={group.companyLogo} alt="" className="exp-company-logo" />
                ) : (
                  <div className="exp-company-logo-placeholder">
                    {group.company.charAt(0)}
                  </div>
                )}
                <div className="exp-company-info">
                  <span className="exp-company-name">{group.company}</span>
                  <span className="exp-company-tenure">
                    {formatDate(group.startDate)} — {group.hasCurrent ? 'Present' : group.endDate ? formatDate(group.endDate) : ''}
                    {' · '}
                    {calcDuration(group.startDate, group.endDate, group.hasCurrent)}
                  </span>
                </div>
              </div>

              {/* Roles */}
              {group.roles.map((role, ri) => (
                <div key={role.id} className="exp-role">
                  {isMultiRole && (
                    <div className="exp-role-dot-col">
                      <div className={`exp-role-dot${role.current ? ' exp-role-dot--current' : ''}`} />
                      {ri < group.roles.length - 1 && <div className="exp-role-line" />}
                    </div>
                  )}
                  <div className={`exp-role-content${isMultiRole ? ' exp-role-content--indented' : ''}`}>
                    <div className="exp-role-date-row">
                      <span className={`exp-date${role.current ? ' exp-date--current' : ''}`}>
                        {formatDate(role.startDate)} — {role.current ? 'Present' : role.endDate ? formatDate(role.endDate) : ''}
                      </span>
                      {role.current && <span className="exp-current-badge">Current</span>}
                    </div>
                    <h3 className="exp-title">{role.title}</h3>
                    {!isMultiRole && role.location && (
                      <span className="exp-location">{role.location}</span>
                    )}
                    {role.description && <p className="exp-desc">{role.description}</p>}
                    {role.tech.length > 0 && (
                      <div className="exp-tech">
                        {role.tech.map((t) => (
                          <span key={t} className="exp-tech-tag">{t}</span>
                        ))}
                      </div>
                    )}
                    <RoleProjects projects={toProjects(role.projects)} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
