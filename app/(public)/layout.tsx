import { prisma } from '@/lib/prisma'
import Sidebar from '@/components/public/Sidebar'
import PageTracker from '@/components/public/PageTracker'

async function getSettings() {
  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: 'main' },
    })
    return (
      settings || {
        name: 'Bagas',
        siteName: 'bagas.dev',
        sidebarBio:
          "I'm Bagas, software developer and open-source enthusiast from Indonesia. This is my corner of the universe. 🚀",
        github: 'https://github.com/bagas',
        linkedin: 'https://linkedin.com/in/bagas',
        twitter: 'https://twitter.com/bagas',
        email: 'bagas@example.com',
        bluesky: '',
        rssEnabled: true,
      }
    )
  } catch {
    return {
      name: 'Bagas',
      siteName: 'bagas.dev',
      sidebarBio:
        "I'm Bagas, software developer and open-source enthusiast from Indonesia. This is my corner of the universe. 🚀",
      github: 'https://github.com/bagas',
      linkedin: 'https://linkedin.com/in/bagas',
      twitter: 'https://twitter.com/bagas',
      email: 'bagas@example.com',
      bluesky: '',
      rssEnabled: true,
    }
  }
}

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const settings = await getSettings()

  return (
    <div className="min-h-screen">
      <PageTracker />
      <Sidebar settings={settings} />

      {/* Main content - offset by sidebar width on desktop, top bar on mobile */}
      <main
        className="md:ml-[300px] pt-14 md:pt-0 min-h-screen"
        style={{ backgroundColor: 'var(--bg)' }}
      >
        <div className="max-w-[740px] mx-auto px-6 py-10 md:py-14">
          {children}
        </div>
      </main>
    </div>
  )
}
