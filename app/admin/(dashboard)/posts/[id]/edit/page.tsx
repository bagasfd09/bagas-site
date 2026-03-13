import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import PostForm from '@/components/admin/PostForm'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditPostPage({ params }: Props) {
  const { id } = await params
  const post = await prisma.post.findUnique({ where: { id } })

  if (!post || post.type !== 'post') notFound()

  return (
    <PostForm
      post={{
        id: post.id,
        title: post.title,
        slug: post.slug,
        content: post.content,
        description: post.description || '',
        icon: post.icon || '',
        tags: post.tags,
        category: post.category,
        type: post.type,
        published: post.published,
        featured: post.featured,
      }}
      type="post"
    />
  )
}
