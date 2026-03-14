import Link from 'next/link'
import Image from 'next/image'

interface BlogPost {
  id: string
  title: string
  slug: string
  description?: string | null
  thumbnail?: string | null
  tags: string[]
  featured: boolean
  createdAt: Date | string
}

function formatDate(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatShortDate(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function estimateReadTime(description?: string | null): string {
  // Rough estimate based on description length as proxy
  const mins = Math.max(3, Math.ceil((description?.length || 100) / 30))
  return `${mins} min read`
}

export default function BlogMagazine({ posts }: { posts: BlogPost[] }) {
  if (posts.length === 0) return null

  // Featured = first post marked as featured, or just the newest
  const featuredPost = posts.find((p) => p.featured) || posts[0]
  const otherPosts = posts.filter((p) => p.id !== featuredPost.id).slice(0, 3)

  return (
    <div className="blog-magazine">
      {/* Featured post — large card with image */}
      <Link href={`/blog/${featuredPost.slug}`} className="blog-featured">
        <div className="blog-featured-image">
          {featuredPost.thumbnail ? (
            <Image
              src={featuredPost.thumbnail}
              alt={featuredPost.title}
              fill
              sizes="(max-width: 768px) 100vw, 700px"
              style={{ objectFit: 'cover' }}
            />
          ) : (
            <div className="blog-featured-placeholder">
              <svg width="48" height="48" viewBox="0 0 64 64" fill="none">
                <rect x="8" y="12" width="48" height="36" rx="4" stroke="currentColor" strokeWidth="1.5" fill="none" />
                <rect x="14" y="18" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="1" fill="currentColor" opacity="0.12" />
                <path d="M14 38h36M14 42h24" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
              </svg>
            </div>
          )}
          <span className="blog-featured-badge">Featured</span>
        </div>
        <div className="blog-featured-content">
          <div className="blog-featured-meta">
            <time>{formatDate(featuredPost.createdAt)}</time>
            <span className="blog-meta-dot">·</span>
            <span>{estimateReadTime(featuredPost.description)}</span>
          </div>
          <h3 className="blog-featured-title">{featuredPost.title}</h3>
          {featuredPost.description && (
            <p className="blog-featured-desc">{featuredPost.description}</p>
          )}
          {featuredPost.tags.length > 0 && (
            <div className="blog-tags">
              {featuredPost.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="blog-tag">{tag}</span>
              ))}
            </div>
          )}
        </div>
      </Link>

      {/* Other posts — small cards row with thumbnails */}
      {otherPosts.length > 0 && (
        <div className="blog-small-cards">
          {otherPosts.map((post) => (
            <Link key={post.id} href={`/blog/${post.slug}`} className="blog-small-card">
              <div className="blog-small-image">
                {post.thumbnail ? (
                  <Image
                    src={post.thumbnail}
                    alt={post.title}
                    fill
                    sizes="(max-width: 768px) 50vw, 220px"
                    style={{ objectFit: 'cover' }}
                  />
                ) : (
                  <div className="blog-small-placeholder">
                    <svg width="24" height="24" viewBox="0 0 48 48" fill="none">
                      <rect x="8" y="12" width="32" height="24" rx="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
                      <path d="M16 24h16M16 28h10" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="blog-small-content">
                <time className="blog-small-date">{formatShortDate(post.createdAt)}</time>
                <h4 className="blog-small-title">{post.title}</h4>
                {post.tags.length > 0 && (
                  <div className="blog-tags">
                    {post.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className="blog-tag">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
