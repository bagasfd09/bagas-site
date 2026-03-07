import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Notes',
  description: 'Developer notes, guides, and quick references on TypeScript, Prisma, Next.js, Docker, Git, and other web development tools by Bagas.',
  alternates: { canonical: '/notes' },
  openGraph: {
    title: 'Notes — bagas.dev',
    description: 'Guides, references, and tutorials on modern web development.',
  },
}

export default function NotesLayout({ children }: { children: React.ReactNode }) {
  return children
}
