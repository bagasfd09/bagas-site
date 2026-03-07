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
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Edit Note</h1>
        <p className="text-sm text-gray-500 mt-0.5">{note.title}</p>
      </div>
      <PostForm
        post={{
          id: note.id,
          title: note.title,
          slug: note.slug,
          content: note.content,
          description: note.description || '',
          icon: note.icon || '',
          tags: note.tags,
          category: note.category,
          type: note.type,
          published: note.published,
          featured: note.featured,
        }}
        type="note"
      />
    </div>
  )
}
