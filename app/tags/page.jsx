import { createClient } from '@/lib/supabase/server'
import PublicHeader from '@/components/layout/PublicHeader'
import ArticleMiniCard from '@/components/content/ArticleMiniCard'
import { notFound } from 'next/navigation'

export const revalidate = 900

export default async function TagsIndexPage() {
  const supabase = await createClient()

  const [{ data: categories }, { data: tags }] = await Promise.all([
    supabase.from('categories').select('id, name, slug').order('name'),
    supabase.from('tags').select('id, name, slug').order('name').limit(10),
  ])

  if (!tags) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <PublicHeader categories={categories || []} />
      <main className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tags</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Browse all tags</p>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <a
              key={tag.id}
              href={`/tags/${tag.slug}`}
              className="px-3 py-1.5 rounded-full border text-sm text-blue-700 dark:text-blue-300 hover:underline"
            >
              {tag.name}
            </a>
          ))}
        </div>
      </main>
    </div>
  )
}
