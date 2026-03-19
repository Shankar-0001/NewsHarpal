import { createClient } from '@/lib/supabase/server'

export const revalidate = 3600

export default async function sitemap() {
  const supabase = await createClient()
  const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://ekahnews.com'

  const [
    { data: categories },
    { data: articles },
    { data: tagLinks },
  ] = await Promise.all([
    supabase
      .from('categories')
      .select('slug, updated_at'),
    supabase
      .from('articles')
      .select('slug, updated_at, published_at, categories(slug)')
      .eq('status', 'published')
      .order('published_at', { ascending: false }),
    supabase
      .from('article_tags')
      .select('tag_id, articles!inner(status)')
      .eq('articles.status', 'published'),
  ])

  const tagIds = [...new Set((tagLinks || []).map((row) => row.tag_id).filter(Boolean))]
  const { data: tags } = tagIds.length
    ? await supabase
      .from('tags')
      .select('id, slug, updated_at')
      .in('id', tagIds)
    : { data: [] }

  const categoryHubEntries = categories?.map((category) => ({
    url: `${siteUrl}/category/${category.slug}`,
    lastModified: new Date(category.updated_at),
    changeFrequency: 'daily',
    priority: 0.7,
  })) || []

  const tagEntries = tags?.map((tag) => ({
    url: `${siteUrl}/tags/${tag.slug}`,
    lastModified: new Date(tag.updated_at),
    changeFrequency: 'weekly',
    priority: 0.5,
  })) || []

  const articleEntries = articles?.map((article) => ({
    url: `${siteUrl}/${article.categories?.slug || 'news'}/${article.slug}`,
    lastModified: new Date(article.updated_at || article.published_at || Date.now()),
    changeFrequency: 'daily',
    priority: 0.8,
  })) || []

  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${siteUrl}/web-stories`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.6,
    },
    {
      url: `${siteUrl}/about-us`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${siteUrl}/editorial-policy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${siteUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${siteUrl}/corrections-policy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${siteUrl}/advertise`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${siteUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    ...categoryHubEntries,
    ...articleEntries,
    ...tagEntries,
  ]
}


