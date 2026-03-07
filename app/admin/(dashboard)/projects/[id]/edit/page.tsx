import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import ProjectForm from '@/components/admin/ProjectForm'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditProjectPage({ params }: Props) {
  const { id } = await params
  const project = await prisma.project.findUnique({ where: { id } })

  if (!project) notFound()

  return (
    <div>
      <ProjectForm
        project={{
          id: project.id,
          name: project.name,
          slug: project.slug,
          description: project.description,
          image: project.image || '',
          repo: project.repo || '',
          demoUrl: project.demoUrl || '',
          articleUrl: project.articleUrl || '',
          year: project.year ?? '',
          tech: project.tech,
          featured: project.featured,
          sortOrder: project.sortOrder,
          githubStars: project.githubStars,
          githubForks: project.githubForks,
          githubCreatedAt: project.githubCreatedAt?.toISOString() ?? null,
          githubUpdatedAt: project.githubUpdatedAt?.toISOString() ?? null,
          githubLanguage: project.githubLanguage,
          githubSyncedAt: project.githubSyncedAt?.toISOString() ?? null,
        }}
      />
    </div>
  )
}
