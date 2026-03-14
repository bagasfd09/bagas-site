import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Articles on software engineering, backend development, Go, TypeScript, system design, and web development by Bagas — a software engineer from Indonesia.',
  alternates: { canonical: '/blog' },
  openGraph: {
    title: 'Blog — bagas.dev',
    description: 'Technical articles and personal essays on software engineering and backend development.',
  },
}

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children
}
