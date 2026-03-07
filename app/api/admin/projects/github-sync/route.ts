import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  try {
    const cleaned = url.replace(/\.git$/, '').replace(/\/$/, '')

    if (cleaned.includes('github.com')) {
      const urlObj = new URL(cleaned.startsWith('http') ? cleaned : `https://${cleaned}`)
      const parts = urlObj.pathname.split('/').filter(Boolean)
      if (parts.length >= 2) {
        return { owner: parts[0], repo: parts[1] }
      }
    }

    const parts = cleaned.split('/').filter(Boolean)
    if (parts.length === 2) {
      return { owner: parts[0], repo: parts[1] }
    }

    return null
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  try {
    const { projectId, repoUrl } = await request.json()

    if (!projectId || !repoUrl) {
      return NextResponse.json(
        { error: 'projectId and repoUrl are required' },
        { status: 400 }
      )
    }

    const parsed = parseGitHubUrl(repoUrl)
    if (!parsed) {
      return NextResponse.json(
        { error: 'Invalid GitHub URL. Use format: https://github.com/owner/repo' },
        { status: 400 }
      )
    }

    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'bagas-portfolio-site',
    }

    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`
    }

    const response = await fetch(
      `https://api.github.com/repos/${parsed.owner}/${parsed.repo}`,
      { headers }
    )

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: `Repository ${parsed.owner}/${parsed.repo} not found. Is it public?` },
          { status: 404 }
        )
      }
      if (response.status === 403) {
        return NextResponse.json(
          { error: 'GitHub API rate limit exceeded. Try again later or add GITHUB_TOKEN to .env' },
          { status: 429 }
        )
      }
      return NextResponse.json(
        { error: `GitHub API error: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()

    await prisma.project.update({
      where: { id: projectId },
      data: {
        githubStars: data.stargazers_count,
        githubForks: data.forks_count,
        githubCreatedAt: new Date(data.created_at),
        githubUpdatedAt: new Date(data.pushed_at),
        githubLanguage: data.language,
        githubSyncedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      github: {
        stars: data.stargazers_count,
        forks: data.forks_count,
        createdAt: data.created_at,
        updatedAt: data.pushed_at,
        language: data.language,
        description: data.description,
      },
    })
  } catch (error) {
    console.error('GitHub sync error:', error)
    return NextResponse.json({ error: 'Failed to sync with GitHub' }, { status: 500 })
  }
}
