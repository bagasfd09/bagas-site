interface Skill {
  id: string
  name: string
  slug: string
  icon: string | null
  url: string | null
  category: string
  level?: string
  yearsOfExp: number | null
}

function formatYears(years: number | null): string | null {
  if (years === null || years === undefined) return null
  if (years < 1) return '< 1 year'
  if (years === 1) return '1 year'
  if (years % 1 !== 0) return `${years} years`
  return `${Math.round(years)} years`
}

const isConfident = (level?: string) => level === 'advanced' || level === 'expert'

export default function SkillsGrid({ skills }: { skills: Skill[] }) {
  return (
    <div className="skill-grid">
      {skills.map((skill) => {
        const confident = isConfident(skill.level)
        const inner = (
          <>
            <div className="skill-icon-wrap">
              {skill.icon ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={skill.icon} alt={skill.name} className="skill-icon" />
              ) : (
                <span className="skill-icon-placeholder">{skill.name[0]}</span>
              )}
              {confident && <span className="skill-confident-dot" title="Confident" />}
            </div>
            <span className="skill-name">{skill.name}</span>
            {skill.yearsOfExp != null && (
              <span className="skill-years">{formatYears(skill.yearsOfExp)}</span>
            )}
          </>
        )

        return skill.url ? (
          <a
            key={skill.id}
            href={skill.url}
            target={skill.url.startsWith('/') ? undefined : '_blank'}
            rel={skill.url.startsWith('/') ? undefined : 'noopener noreferrer'}
            className={`skill-card${confident ? ' skill-card--confident' : ''}`}
          >
            {inner}
          </a>
        ) : (
          <div key={skill.id} className={`skill-card${confident ? ' skill-card--confident' : ''}`}>
            {inner}
          </div>
        )
      })}
    </div>
  )
}
