import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import ExperienceForm from '@/components/admin/ExperienceForm'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditExperiencePage({ params }: Props) {
  const { id } = await params
  const experience = await prisma.experience.findUnique({ where: { id } })

  if (!experience) notFound()

  return (
    <div>
      <ExperienceForm
        experience={{
          id: experience.id,
          title: experience.title,
          company: experience.company,
          companyLogo: experience.companyLogo,
          location: experience.location,
          startDate: experience.startDate.toISOString(),
          endDate: experience.endDate?.toISOString() || null,
          current: experience.current,
          description: experience.description,
          tech: experience.tech,
          projects: (experience.projects || []) as { name: string; logo: string; url: string }[],
          sortOrder: experience.sortOrder,
        }}
      />
    </div>
  )
}
