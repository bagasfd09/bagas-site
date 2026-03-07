import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const projects = await prisma.project.findMany({
      where: { repo: { not: null } },
      select: { id: true, repo: true, name: true },
    })

    if (projects.length === 0) {
      return NextResponse.json({ success: true, synced: 0, message: 'No projects with GitHub repos' })
    }

    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'bagas-portfolio-site',
    }

    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`
    }

    const results: Array<{ id: string; name: string; status: string; stars?: number; reason?: string }> = []

    for (const project of projects) {
      try {
        const repoUrl = project.repo!
        const cleaned = repoUrl.replace(/\.git$/, '').replace(/\/$/, '')
        const urlObj = new URL(cleaned.startsWith('http') ? cleaned : `https://${cleaned}`)
        const parts = urlObj.pathname.split('/').filter(Boolean)

        if (parts.length < 2) {
          results.push({ id: project.id, name: project.name, status: 'skipped', reason: 'Invalid URL' })
          continue
        }

        const response = await fetch(
          `https://api.github.com/repos/${parts[0]}/${parts[1]}`,
          { headers }
        )

        if (!response.ok) {
          results.push({ id: project.id, name: project.name, status: 'error', reason: `HTTP ${response.status}` })
          continue
        }

        const data = await response.json()

        await prisma.project.update({
          where: { id: project.id },
          data: {
            githubStars: data.stargazers_count,
            githubForks: data.forks_count,
            githubCreatedAt: new Date(data.created_at),
            githubUpdatedAt: new Date(data.pushed_at),
            githubLanguage: data.language,
            githubSyncedAt: new Date(),
          },
        })

        results.push({ id: project.id, name: project.name, status: 'synced', stars: data.stargazers_count })

        // Small delay to be nice to GitHub API
        await new Promise((resolve) => setTimeout(resolve, 200))
      } catch (err) {
        results.push({ id: project.id, name: project.name, status: 'error', reason: String(err) })
      }
    }

    return NextResponse.json({
      success: true,
      synced: results.filter((r) => r.status === 'synced').length,
      total: projects.length,
      results,
    })
  } catch (error) {
    console.error('Batch sync error:', error)
    return NextResponse.json({ error: 'Batch sync failed' }, { status: 500 })
  }
}
