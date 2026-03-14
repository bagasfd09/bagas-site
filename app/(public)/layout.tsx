import { prisma } from '@/lib/prisma'
import Sidebar from '@/components/public/Sidebar'
import PageTracker from '@/components/public/PageTracker'

export const dynamic = 'force-dynamic'

const DEFAULTS = {
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
  showExperience: true,
  showBlog: true,
  showNotes: true,
  showSkills: true,
  showProjects: true,
  navExperience: true,
  navBlog: true,
  navNotes: true,
  navSkills: true,
  navProjects: true,
  navAbout: true,
  navOrderExperience: 0,
  navOrderBlog: 1,
  navOrderNotes: 2,
  navOrderSkills: 3,
  navOrderProjects: 4,
  navOrderAbout: 5,
}

async function getSettings() {
  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: 'main' },
    })
    return settings || DEFAULTS
  } catch {
    return DEFAULTS
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
        style={{ backgroundColor: 'var(--content-bg)' }}
      >
        <div className="max-w-[740px] mx-auto px-6 py-10 md:py-14">
          {children}
        </div>
      </main>
    </div>
  )
}
