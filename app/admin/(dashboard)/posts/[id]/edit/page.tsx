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
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Edit Post</h1>
        <p className="text-sm text-gray-500 mt-0.5">{post.title}</p>
      </div>
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
    </div>
  )
}
