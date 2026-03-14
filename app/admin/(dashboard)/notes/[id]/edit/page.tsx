import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import PostForm from '@/components/admin/PostForm'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditNotePage({ params }: Props) {
  const { id } = await params
  const note = await prisma.post.findUnique({ where: { id } })

  if (!note || note.type !== 'note') notFound()

  return (
    <PostForm
      post={{
        id: note.id,
        title: note.title,
        slug: note.slug,
        content: note.content,
        description: note.description || '',
        thumbnail: note.thumbnail || '',
        icon: note.icon || '',
        tags: note.tags,
        category: note.category,
        type: note.type,
        published: note.published,
        featured: note.featured,
      }}
      type="note"
    />
  )
}
