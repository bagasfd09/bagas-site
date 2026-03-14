import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeSlug from 'rehype-slug'
import 'highlight.js/styles/github.css'
import CodeCopyButton from './CodeCopyButton'

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
        rehypePlugins={[rehypeHighlight, rehypeSlug]}
        urlTransform={allowBlobUrls ? allowBlobUrlTransform : undefined}
        components={{
          img: ({ src, alt, ...props }) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={alt || ''}
              loading="lazy"
              decoding="async"
              {...props}
            />
          ),
          pre: ({ children, ...props }) => {
            // Extract text content for copy button
            const getTextContent = (node: React.ReactNode): string => {
              if (typeof node === 'string') return node
              if (Array.isArray(node)) return node.map(getTextContent).join('')
              if (node && typeof node === 'object' && 'props' in node) {
                return getTextContent((node as React.ReactElement).props.children)
              }
              return ''
            }
            const code = getTextContent(children)
            return (
              <div className="code-block-wrapper">
                <pre {...props}>{children}</pre>
                <CodeCopyButton code={code} />
              </div>
            )
          },
          blockquote: ({ children, ...props }) => (
            <blockquote className="article-blockquote" {...props}>
              {children}
            </blockquote>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
