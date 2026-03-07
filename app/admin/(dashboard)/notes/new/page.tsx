import PostForm from '@/components/admin/PostForm'

export default function NewNotePage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">New Note</h1>
      </div>
      <PostForm type="note" />
    </div>
  )
}
