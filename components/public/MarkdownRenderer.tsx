import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github.css'

interface MarkdownRendererProps {
  content: string
  className?: string
  allowBlobUrls?: boolean
}

// Default urlTransform blocks blob: URLs — this one allows them for local preview
function allowBlobUrlTransform(url: string): string {
  if (url.startsWith('blob:')) return url
  // Default behavior: allow http, https, mailto
  const protocols = ['http', 'https', 'mailto']
  const colon = url.indexOf(':')
  if (colon === -1 || colon > 10) return url
  const protocol = url.slice(0, colon).toLowerCase()
  return protocols.includes(protocol) ? url : ''
}

export default function MarkdownRenderer({ content, className, allowBlobUrls }: MarkdownRendererProps) {
  return (
    <div className={`prose ${className || ''}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        urlTransform={allowBlobUrls ? allowBlobUrlTransform : undefined}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
