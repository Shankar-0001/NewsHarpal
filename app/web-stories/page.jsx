import { createClient } from '@/lib/supabase/server'
import PublicHeader from '@/components/layout/PublicHeader'
import WebStoryCard from '@/components/content/WebStoryCard'

export const revalidate = 900

export default async function WebStoriesPage() {
  const supabase = await createClient()

  const [{ data: categories }, { data: stories }] = await Promise.all([
    supabase.from('categories').select('id, name, slug').order('name'),
    supabase
      .from('web_stories')
      .select('id, title, slug, cover_image, created_at, authors(name), categories(name, slug)')
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <PublicHeader categories={categories || []} />

      <main className="w-full max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Web Stories</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {stories?.map((story) => (
            <WebStoryCard key={story.id} story={story} />
          ))}
        </div>
      </main>
    </div>
  )
}
