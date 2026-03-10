import { getServerSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminThemeProvider from '@/components/admin/AdminThemeProvider'

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession()

  if (!session) {
    redirect('/admin/login')
  }

  return (
    <AdminThemeProvider>
      <AdminSidebar username={session.username} />
      <main
        className="md:ml-[230px] pt-[52px] md:pt-0 min-h-screen"
        style={{ background: 'var(--admin-bg)' }}
      >
        <div style={{ padding: '36px' }}>{children}</div>
      </main>
    </AdminThemeProvider>
  )
}
