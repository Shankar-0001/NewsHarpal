import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import PublicHeader from '@/components/layout/PublicHeader'
import StructuredData from '@/components/seo/StructuredData'
import WebStoryViewer from '@/components/content/WebStoryViewer'
import { absoluteUrl, buildLanguageAlternates } from '@/lib/site-config'
import { keywordsToMetadataValue, normalizeManualKeywords } from '@/lib/keywords'
import Link from 'next/link'

function getStorySlides(story) {
  return Array.isArray(story?.slides) ? story.slides.filter((slide) => slide?.image) : []
}

function toRelativeInternalUrl(absoluteHref = '') {
  const siteRoot = absoluteUrl('/')
  return absoluteHref.startsWith(siteRoot) ? absoluteHref.replace(siteRoot, '/') : absoluteHref
}

export const revalidate = 600

export async function generateMetadata({ params }) {
  const supabase = await createClient()
  const { data: story } = await supabase
    .from('web_stories')
    .select('title, slug, cover_image, slides, keywords, cta_text, cta_url, whatsapp_group_url, ad_slot, seo_description')
    .eq('slug', params.slug)
    .maybeSingle()

  if (!story) return { title: 'Story Not Found | EkahNews' }

  const slides = getStorySlides(story)
  const firstDesc = slides[0]?.description || ''
  const description = story.seo_description || firstDesc || `Visual story: ${story.title}`
  const keywordValues = normalizeManualKeywords(story.keywords || [])

  return {
    title: `${story.title} | Web Story`,
    description,
    keywords: keywordsToMetadataValue(keywordValues),
    alternates: {
      canonical: absoluteUrl(`/web-stories/${story.slug}`),
      languages: buildLanguageAlternates(`/web-stories/${story.slug}`),
    },
    openGraph: {
      title: story.title,
      description,
      type: 'article',
      images: story.cover_image ? [{ url: story.cover_image, width: 1200, height: 2133, alt: story.title }] : [],
      url: absoluteUrl(`/web-stories/${story.slug}`),
    },
    twitter: {
      card: 'summary_large_image',
      title: story.title,
      description,
      images: story.cover_image ? [story.cover_image] : [],
    },
    robots: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
    },
  }
}

export default async function WebStoryDetailPage({ params }) {
  const supabase = await createClient()

  const [{ data: categories }, { data: story }] = await Promise.all([
    supabase.from('categories').select('id, name, slug').order('name'),
    supabase
      .from('web_stories')
      .select('id, title, slug, cover_image, slides, keywords, related_article_slug, cta_text, cta_url, whatsapp_group_url, ad_slot, seo_description, created_at, updated_at, authors(name, slug), categories(name, slug)')
      .eq('slug', params.slug)
      .maybeSingle(),
  ])

  if (!story) notFound()

  const slides = getStorySlides(story)
  const articleUrl = story.related_article_slug
    ? absoluteUrl(`/${story.categories?.slug || 'news'}/${story.related_article_slug}`)
    : ''
  const keywordValues = normalizeManualKeywords(story.keywords || [])
  const description = story.seo_description || slides[0]?.description || story.title

  const breadcrumbItems = [
    { name: 'Home', url: absoluteUrl('/') },
    { name: 'Web Stories', url: absoluteUrl('/web-stories') },
    { name: story.title, url: absoluteUrl(`/web-stories/${story.slug}`) },
  ]

  const ldArticle = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: story.title,
    description,
    image: story.cover_image ? [story.cover_image] : [],
    author: { '@type': 'Person', name: story.authors?.name || 'EkahNews' },
    datePublished: story.created_at,
    dateModified: story.updated_at || story.created_at,
    mainEntityOfPage: absoluteUrl(`/web-stories/${story.slug}`),
    publisher: {
      '@type': 'Organization',
      name: 'EkahNews',
      logo: { '@type': 'ImageObject', url: absoluteUrl('/logo.png') },
    },
    keywords: keywordsToMetadataValue(keywordValues),
    articleSection: story.categories?.name || 'Web Stories',
    isAccessibleForFree: true,
  }

  const ldPage = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: story.title,
    url: absoluteUrl(`/web-stories/${story.slug}`),
    description,
  }

  const ldBreadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }

  const ldStorySeries = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWorkSeries',
    name: story.title,
    description,
    image: story.cover_image ? [story.cover_image] : [],
    url: absoluteUrl(`/web-stories/${story.slug}`),
    creator: {
      '@type': 'Person',
      name: story.authors?.name || 'EkahNews',
    },
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <StructuredData data={ldArticle} />
      <StructuredData data={ldPage} />
      <StructuredData data={ldBreadcrumbs} />
      <StructuredData data={ldStorySeries} />
      <PublicHeader categories={categories || []} />
      <main className="container mx-auto px-4 py-8">
        <article className="mx-auto max-w-5xl">
          <h1 className="sr-only">{story.title}</h1>

          <WebStoryViewer story={story} articleUrl={articleUrl} />

          {keywordValues.length > 0 && (
            <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Story Topics</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {keywordValues.slice(0, 8).map((keyword) => (
                  <span
                    key={keyword}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </section>
          )}

          {articleUrl && (
            <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Continue Reading</h2>
              <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-400">
                Explore the full related article for deeper reporting and context.
              </p>
              <Link href={toRelativeInternalUrl(articleUrl)} className="mt-4 inline-flex text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400">
                Read the full article
              </Link>
            </section>
          )}
        </article>
      </main>
    </div>
  )
}
