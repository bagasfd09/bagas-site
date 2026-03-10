import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: 'main' },
    })

    if (!settings) {
      return NextResponse.json({ error: 'Settings not found' }, { status: 404 })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    const {
      name, siteName, tagline, heroIntro, heroImage, cvUrl, bio, sidebarBio,
      github, linkedin, twitter, email, bluesky, rssEnabled,
      showExperience, showBlog, showNotes, showSkills, showProjects,
      orderExperience, orderBlog, orderNotes, orderSkills, orderProjects,
    } = data

    const settings = await prisma.siteSettings.upsert({
      where: { id: 'main' },
      update: {
        name,
        siteName,
        tagline,
        heroIntro: heroIntro || '',
        heroImage: heroImage || null,
        cvUrl: cvUrl || '',
        bio,
        sidebarBio,
        github: github || '',
        linkedin: linkedin || '',
        twitter: twitter || '',
        email: email || '',
        bluesky: bluesky || '',
        rssEnabled: rssEnabled ?? true,
        showExperience: showExperience ?? true,
        showBlog: showBlog ?? true,
        showNotes: showNotes ?? true,
        showSkills: showSkills ?? true,
        showProjects: showProjects ?? true,
        orderExperience: orderExperience ?? 0,
        orderBlog: orderBlog ?? 1,
        orderNotes: orderNotes ?? 2,
        orderSkills: orderSkills ?? 3,
        orderProjects: orderProjects ?? 4,
      },
      create: {
        id: 'main',
        name: name || 'Bagas',
        siteName: siteName || 'bagas.dev',
        tagline: tagline || '',
        heroIntro: heroIntro || '',
        heroImage: heroImage || null,
        cvUrl: cvUrl || '',
        bio: bio || '',
        sidebarBio: sidebarBio || '',
        github: github || '',
        linkedin: linkedin || '',
        twitter: twitter || '',
        email: email || '',
        bluesky: bluesky || '',
        rssEnabled: rssEnabled ?? true,
        showExperience: showExperience ?? true,
        showBlog: showBlog ?? true,
        showNotes: showNotes ?? true,
        showSkills: showSkills ?? true,
        showProjects: showProjects ?? true,
        orderExperience: orderExperience ?? 0,
        orderBlog: orderBlog ?? 1,
        orderNotes: orderNotes ?? 2,
        orderSkills: orderSkills ?? 3,
        orderProjects: orderProjects ?? 4,
      },
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
