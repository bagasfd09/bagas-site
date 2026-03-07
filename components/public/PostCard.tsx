import Link from 'next/link'

interface PostCardProps {
  post: {
    id: string
    title: string
    slug: string
    description?: string | null
    icon?: string | null
    type: string
    featured?: boolean
  }
}

export default function PostCard({ post }: PostCardProps) {
  const href = post.type === 'note' ? `/notes/${post.slug}` : `/blog/${post.slug}`
  const icon = post.icon || '📄'

  return (
    <Link
      href={href}
      className={`deep-dive-card${post.featured ? ' deep-dive-card--featured' : ''}`}
    >
      <span className="dd-icon" role="img" aria-hidden="true">
        {icon}
      </span>
      <span className="dd-title">{post.title}</span>
    </Link>
  )
}
