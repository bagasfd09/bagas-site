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
    const { name, siteName, tagline, heroIntro, heroImage, bio, sidebarBio, github, linkedin, twitter, email, bluesky, rssEnabled } = data

    const settings = await prisma.siteSettings.upsert({
      where: { id: 'main' },
      update: {
        name,
        siteName,
        tagline,
        heroIntro: heroIntro || '',
        heroImage: heroImage || null,
        bio,
        sidebarBio,
        github: github || '',
        linkedin: linkedin || '',
        twitter: twitter || '',
        email: email || '',
        bluesky: bluesky || '',
        rssEnabled: rssEnabled ?? true,
      },
      create: {
        id: 'main',
        name: name || 'Bagas',
        siteName: siteName || 'bagas.dev',
        tagline: tagline || '',
        heroIntro: heroIntro || '',
        heroImage: heroImage || null,
        bio: bio || '',
        sidebarBio: sidebarBio || '',
        github: github || '',
        linkedin: linkedin || '',
        twitter: twitter || '',
        email: email || '',
        bluesky: bluesky || '',
        rssEnabled: rssEnabled ?? true,
      },
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
