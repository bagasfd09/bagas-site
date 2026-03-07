import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import SkillForm from '@/components/admin/SkillForm'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditSkillPage({ params }: Props) {
  const { id } = await params
  const skill = await prisma.skill.findUnique({ where: { id } })

  if (!skill) notFound()

  return (
    <div>
      <SkillForm
        skill={{
          id: skill.id,
          name: skill.name,
          slug: skill.slug,
          icon: skill.icon || '',
          url: skill.url || '',
          category: skill.category,
          level: skill.level,
          yearsOfExp: skill.yearsOfExp,
          sortOrder: skill.sortOrder,
          featured: skill.featured,
        }}
      />
    </div>
  )
}
