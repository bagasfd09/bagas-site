'use client'

import { useEffect, useState } from 'react'
import { formatDate } from '@/lib/utils'
import MarkdownRenderer from '@/components/public/MarkdownRenderer'

interface PreviewData {
  title: string
  content: string
  description: string
  tags: string[]
  type: string
}

export default function PostPreviewPage() {
  const [data, setData] = useState<PreviewData | null>(null)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('post-preview')
      if (raw) setData(JSON.parse(raw))
    } catch { /* ignore */ }
  }, [])

  if (!data) {
    return (
      <div className="preview-empty">
        <p>No preview data found. Open this from the post editor.</p>
      </div>
    )
  }

  const isNote = data.type === 'note'

  return (
    <div className="preview-page">
      <div className="preview-banner">
        <span>Live Preview</span>
        <span className="preview-banner-hint">This is how your {isNote ? 'note' : 'post'} will look to readers</span>
      </div>
      <div className="preview-container">
        <article className="article-page">
          <div className="article-header">
            <span className="article-back">&larr; Back to {isNote ? 'Notes' : 'Blog'}</span>
            <h1 className="article-title">{data.title || 'Untitled'}</h1>
            <div className="article-meta">
              <time>{formatDate(new Date())}</time>
              {data.tags.length > 0 && (
                <div className="article-tags">
                  {data.tags.map((tag) => (
                    <span key={tag} className="article-tag">{tag}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <MarkdownRenderer content={data.content} className="article-body" allowBlobUrls />
        </article>
      </div>
    </div>
  )
}
