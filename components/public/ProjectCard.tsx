interface ProjectCardProps {
  project: {
    id: string
    name: string
    slug: string
    description: string
    year?: number | null
    image?: string | null
    repo?: string | null
    demoUrl?: string | null
    articleUrl?: string | null
    tech: string[]
    featured?: boolean
    githubStars?: number | null
    githubForks?: number | null
    githubLanguage?: string | null
  }
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const hasActions = project.demoUrl || project.repo || project.articleUrl

  return (
    <div className="project-card">
      {/* Project image */}
      {project.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={project.image}
          alt={`${project.name} screenshot`}
          className="pc-image"
        />
      ) : null}

      <div className="pc-body">
        {/* Header: year + stars */}
        <div className="pc-header">
          {project.year && <span className="pc-year">{project.year}</span>}
          {project.githubStars != null && project.githubStars > 0 && (
            <span className="pc-stars">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25z" />
              </svg>
              {project.githubStars.toLocaleString()}
            </span>
          )}
        </div>

        <h3 className="pc-name">{project.name}</h3>
        <p className="pc-desc">{project.description}</p>

        {/* GitHub meta row */}
        {(project.githubForks != null || project.githubLanguage) && (
          <div className="pc-meta">
            {project.githubLanguage && (
              <span className="pc-meta-item">
                <span className="pc-lang-dot" />
                {project.githubLanguage}
              </span>
            )}
            {project.githubForks != null && project.githubForks > 0 && (
              <span className="pc-meta-item">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 0-1.5 0v.878H6.75a.25.25 0 0 1-.25-.25v-.878a2.25 2.25 0 1 0-1.5 0ZM8 1.25a.75.75 0 1 1 0 1.5.75.75 0 0 1 0-1.5ZM4.25 4a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Zm7.5 0a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM8 9.5a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Zm0 1.5a.75.75 0 1 1 0 1.5.75.75 0 0 1 0-1.5Z" />
                </svg>
                {project.githubForks.toLocaleString()}
              </span>
            )}
          </div>
        )}

        {/* Tech stack pills */}
        {project.tech.length > 0 && (
          <div className="pc-tech">
            {project.tech.map((t) => (
              <span key={t} className="pc-tech-tag">{t}</span>
            ))}
          </div>
        )}

        {/* Action buttons — visually separated footer */}
        {hasActions && (
          <div className="pc-actions">
            {project.demoUrl && (
              <a
                href={project.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="pc-btn pc-btn-primary"
              >
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M6 3.5L11 8 6 12.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Demo
              </a>
            )}
            {project.repo && (
              <a
                href={project.repo}
                target="_blank"
                rel="noopener noreferrer"
                className="pc-btn pc-btn-secondary"
              >
                <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                </svg>
                Source
              </a>
            )}
            {project.articleUrl && (
              <a
                href={project.articleUrl.startsWith('/') ? project.articleUrl : project.articleUrl}
                target={project.articleUrl.startsWith('/') ? undefined : '_blank'}
                rel={project.articleUrl.startsWith('/') ? undefined : 'noopener noreferrer'}
                className="pc-btn pc-btn-secondary"
              >
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M2 4h12M2 8h8M2 12h10" strokeLinecap="round" />
                </svg>
                Article
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
