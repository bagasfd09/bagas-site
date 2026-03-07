import Link from 'next/link'

interface PostRow {
  id: string
  title: string
  slug: string
  type: string
  tags?: string[]
  createdAt: Date | string
}

function formatDate(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function PostRowList({ posts }: { posts: PostRow[] }) {
  return (
    <div>
      {posts.map((post) => {
        const href = post.type === 'note' ? `/notes/${post.slug}` : `/blog/${post.slug}`
        const tags = post.tags || []
        return (
          <Link key={post.id} href={href} className="post-row-link">
            <span className="post-row-link-title">{post.title}</span>
            <span className="post-row-link-meta">
              {tags.length > 0 && (
                <span className="post-row-tags">
                  {tags.slice(0, 2).map((tag) => (
                    <span key={tag} className="post-row-tag">{tag}</span>
                  ))}
                </span>
              )}
              <span className="post-row-link-date">{formatDate(post.createdAt)}</span>
            </span>
          </Link>
        )
      })}
    </div>
  )
}
