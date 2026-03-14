import PageTracker from '@/components/public/PageTracker'

export default function BlogGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--content-bg)' }}>
      <PageTracker />
      {children}
    </div>
  )
}
