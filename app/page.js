import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Calendar, Radio, TrendingUp, User } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { HeaderAd, InArticleAd } from '@/components/ads/AdComponent'
import StructuredData, { OrganizationSchema, WebSiteSchema } from '@/components/seo/StructuredData'
import PublicHeader from '@/components/layout/PublicHeader'
import BreakingNewsTicker from '@/components/common/BreakingNewsTicker'
import Image from 'next/image'
import { calculateReadingTime } from '@/lib/content-utils'
import ArticleMiniCard from '@/components/content/ArticleMiniCard'
import WebStoryCard from '@/components/content/WebStoryCard'

// Revalidate homepage every 10 minutes (ISR)
export const revalidate = 600
const HOMEPAGE_CATEGORY_LIMIT = 6
const CATEGORY_ARTICLE_LIMIT = 5

const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://ekahnews.com'
const ogImage = `${siteUrl}/logo.png`

export const metadata = {
  title: 'EkahNews - Latest News and Insights',
  description: 'Your source for the latest news, trending stories, and expert insights across multiple categories.',
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    title: 'EkahNews - Latest News and Insights',
    description: 'Your source for the latest news, trending stories, and expert insights.',
    type: 'website',
    url: siteUrl,
    images: [{ url: ogImage }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EkahNews - Latest News and Insights',
    description: 'Your source for the latest news, trending stories, and expert insights across multiple categories.',
    images: [ogImage],
  },
}

export default async function HomePage() {
  const supabase = await createClient()
  const adsEnabled = process.env.NEXT_PUBLIC_ADS_ENABLED === 'true'
  let articles = []
  let categories = []
  let engagement = []
  let webStories = []
  let homepageCategoryBlocks = []

  try {
    const [articlesRes, categoriesRes, engagementRes, storiesRes, categoryStatsRes] = await Promise.all([
      supabase
        .from('articles')
        .select(`
          id,
          title,
          slug,
          excerpt,
          featured_image_url,
          published_at,
          authors (name),
          categories (name, slug)
        `)
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(10),
      supabase
        .from('categories')
        .select('id, name, slug')
        .order('name'),
      supabase
        .from('article_engagement')
        .select('article_id, views, likes, shares')
        .limit(10),
      supabase
        .from('web_stories')
        .select('id, title, slug, cover_image, created_at')
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('articles')
        .select('id, category_id, published_at')
        .eq('status', 'published')
        .not('category_id', 'is', null)
        .order('published_at', { ascending: false }),
    ])

    articles = articlesRes.data || []
    categories = categoriesRes.data || []
    engagement = engagementRes.data || []
    webStories = storiesRes.data || []

    const categoryMetaById = new Map((categoriesRes.data || []).map((category) => [category.id, category]))
    const categoryStats = new Map()

    for (const article of categoryStatsRes.data || []) {
      if (!article?.category_id) continue
      const existing = categoryStats.get(article.category_id) || {
        count: 0,
        latestPublishedAt: article.published_at || null,
      }

      categoryStats.set(article.category_id, {
        count: existing.count + 1,
        latestPublishedAt: existing.latestPublishedAt || article.published_at || null,
      })
    }

    const selectedCategoryIds = [...categoryStats.entries()]
      .filter(([categoryId, stats]) => categoryMetaById.has(categoryId) && stats.count >= CATEGORY_ARTICLE_LIMIT)
      .sort((a, b) => {
        const dateA = new Date(a[1].latestPublishedAt || 0).getTime()
        const dateB = new Date(b[1].latestPublishedAt || 0).getTime()
        if (dateB !== dateA) return dateB - dateA
        return (categoryMetaById.get(a[0])?.name || '').localeCompare(categoryMetaById.get(b[0])?.name || '')
      })
      .slice(0, HOMEPAGE_CATEGORY_LIMIT)
      .map(([categoryId]) => categoryId)

    if (selectedCategoryIds.length > 0) {
      const { data: categoryArticles } = await supabase
        .from('articles')
        .select(`
          id,
          title,
          slug,
          excerpt,
          featured_image_url,
          published_at,
          category_id,
          authors (name),
          categories (name, slug)
        `)
        .eq('status', 'published')
        .in('category_id', selectedCategoryIds)
        .order('published_at', { ascending: false })

      const selectedCategorySet = new Set(selectedCategoryIds)
      const articlesByCategoryId = new Map()
      for (const article of categoryArticles || []) {
        const categoryId = article.category_id
        if (!categoryId || !selectedCategorySet.has(categoryId)) continue

        const items = articlesByCategoryId.get(categoryId) || []
        if (items.length < CATEGORY_ARTICLE_LIMIT) {
          items.push(article)
          articlesByCategoryId.set(categoryId, items)
        }
      }

      homepageCategoryBlocks = selectedCategoryIds
        .map((categoryId) => {
          const category = categoryMetaById.get(categoryId)
          const categoryArticlesForBlock = articlesByCategoryId.get(categoryId) || []
          if (!category || categoryArticlesForBlock.length < CATEGORY_ARTICLE_LIMIT) return null

          return {
            ...category,
            articles: categoryArticlesForBlock,
          }
        })
        .filter(Boolean)
    }
  } catch (error) {
    console.error('Homepage data fetch failed:', error)
  }

  const featuredArticle = articles?.[0]
  const breakingNews = (articles || [])
    .slice(0, 5)
    .map((article) => ({
      id: article.id,
      title: article.title,
      slug: article.slug,
      categories: { slug: article.categories?.slug || 'news' },
    }))
  const engagementMap = new Map((engagement || []).map((row) => [row.article_id, row]))
  const trendingBySignals = [...(articles || [])]
    .map((article) => {
      const m = engagementMap.get(article.id) || { views: 0, likes: 0, shares: 0 }
      return { ...article, _score: (m.views || 0) + (m.likes || 0) * 3 + (m.shares || 0) * 5 }
    })
    .sort((a, b) => b._score - a._score)
    .slice(0, 5)
  const finalTrending = trendingBySignals.length > 0 ? trendingBySignals : (articles || []).slice(0, 5)
  const mostShared = [...(articles || [])]
    .map((article) => {
      const m = engagementMap.get(article.id) || { shares: 0 }
      return { ...article, _shares: m.shares || 0 }
    })
    .sort((a, b) => b._shares - a._shares)
    .slice(0, 6)
  const heroSecondaryArticles = (articles || []).slice(1, 4)
  const latestLeadArticles = (articles || []).slice(1, 3)
  const latestFeedArticles = (articles || []).slice(3, 9)


  return (
    <>
      <StructuredData data={OrganizationSchema()} />
      <StructuredData data={WebSiteSchema()} />

      <div className="bg-gray-50 dark:bg-gray-900">
        <PublicHeader categories={categories || []} />

        {/* Breaking News Ticker */}
        {breakingNews && breakingNews.length > 0 && (
          <BreakingNewsTicker news={breakingNews} />
        )}

        {/* Hero Section with Featured Article */}
        {featuredArticle && (
          <div className="bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.14),_transparent_34%),linear-gradient(180deg,_#ffffff_0%,_#f8fafc_52%,_#eef2ff_100%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(96,165,250,0.18),_transparent_24%),linear-gradient(180deg,_#0f172a_0%,_#020617_100%)] py-10 md:py-14 border-b border-slate-200/70 dark:border-slate-800">
            <div className="w-full max-w-6xl mx-auto px-4">
              <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.35fr)_340px] gap-8">
                <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] gap-6 items-stretch">
                  <Link
                    href={`/${featuredArticle.categories?.slug || 'news'}/${featuredArticle.slug}`}
                    prefetch
                    className="group relative min-h-[440px] overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_18px_50px_-28px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-slate-900"
                  >
                    {featuredArticle.featured_image_url && (
                      <>
                        <Image
                          src={featuredArticle.featured_image_url}
                          alt={featuredArticle.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                          priority
                          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 60vw, 700px"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/68 to-slate-900/10" />
                      </>
                    )}
                    <div className="absolute inset-x-0 bottom-0 p-6 md:p-8 text-white">
                      <div className="flex flex-wrap items-center gap-3 mb-4">
                        <Badge className="bg-red-600 hover:bg-red-600 text-white border-0 px-3 py-1">
                          Lead Story
                        </Badge>
                        {featuredArticle.categories && (
                          <Badge variant="secondary" className="bg-white/16 text-white border-white/15">
                            {featuredArticle.categories.name}
                          </Badge>
                        )}
                      </div>
                      <h1 className="text-[32px] md:text-[48px] font-bold leading-[1.05] tracking-tight max-w-3xl">
                        {featuredArticle.title}
                      </h1>
                      <p className="mt-4 max-w-2xl text-[17px] md:text-[19px] text-slate-100/92 leading-relaxed">
                        {featuredArticle.excerpt}
                      </p>
                      <div className="mt-6 flex flex-wrap items-center gap-5 text-sm text-slate-200">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>{featuredArticle.authors?.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDistanceToNow(new Date(featuredArticle.published_at), { addSuffix: true })}</span>
                        </div>
                      </div>
                      <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white">
                        Read Full Coverage
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>
                  </Link>

                  <div className="space-y-4">
                    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                      <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-3">
                        <Radio className="h-4 w-4" />
                        <span className="text-xs font-semibold uppercase tracking-[0.22em]">Developing Now</span>
                      </div>
                      <div className="space-y-4">
                        {heroSecondaryArticles.map((article, index) => (
                          <Link key={article.id} href={`/${article.categories?.slug || 'news'}/${article.slug}`} className="block group">
                            <div className="flex gap-3">
                              <span className="text-2xl font-serif text-slate-300 dark:text-slate-700">{String(index + 1).padStart(2, '0')}</span>
                              <div className="min-w-0">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                                  {article.categories?.name || 'News'}
                                </p>
                                <h2 className="mt-1 text-base font-semibold leading-snug text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                  {article.title}
                                </h2>
                                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                                  {formatDistanceToNow(new Date(article.published_at), { addSuffix: true })}
                                </p>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>

                <div className="space-y-6">
                  <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center gap-2 mb-5">
                      <TrendingUp className="h-5 w-5 text-orange-500" />
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white">Trending Pulse</h2>
                    </div>
                    <div className="space-y-4">
                      {finalTrending.map((article, index) => (
                        <Link key={article.id} href={`/${article.categories?.slug || 'news'}/${article.slug}`} className="group flex gap-3">
                          <span className="text-sm font-semibold text-orange-500">{index + 1}</span>
                          <div className="min-w-0">
                            <h3 className="font-semibold leading-snug text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                              {article.title}
                            </h3>
                            <p className="mt-1 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                              {article.categories?.name || 'News'}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">Most Shared</h2>
                    <div className="space-y-3">
                      {mostShared.slice(0, 5).map((article) => (
                        <Link key={article.id} href={`/${article.categories?.slug || 'news'}/${article.slug}`} className="block text-sm leading-6 text-slate-700 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400">
                          {article.title}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="w-full max-w-6xl mx-auto px-4 py-12 md:py-16">
          {/* Header Ad */}
          {adsEnabled && (
            <div className="hidden md:block pb-4">
              <HeaderAd />
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.4fr)_340px] gap-8">
            <div className="space-y-10">
              <section>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Fresh Coverage</p>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mt-1">Latest Articles</h2>
                  </div>
                  <Link href="/search" className="hidden md:inline-flex text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
                    Browse all stories
                  </Link>
                </div>

                {latestLeadArticles.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {latestLeadArticles.map((article) => (
                      <Link key={article.id} href={`/${article.categories?.slug || 'news'}/${article.slug}`} className="group">
                        <article className="h-full overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
                          {article.featured_image_url && (
                            <div className="relative aspect-[16/10] overflow-hidden">
                              <Image
                                src={article.featured_image_url}
                                alt={article.title}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                                sizes="(max-width: 768px) 100vw, 50vw"
                              />
                            </div>
                          )}
                          <div className="p-5">
                            <div className="flex items-center justify-between gap-3">
                              <Badge variant="secondary">{article.categories?.name || 'News'}</Badge>
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                {formatDistanceToNow(new Date(article.published_at), { addSuffix: true })}
                              </span>
                            </div>
                            <h3 className="mt-4 text-2xl font-bold leading-tight text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                              {article.title}
                            </h3>
                            <p className="mt-3 text-slate-600 dark:text-slate-400 line-clamp-3">
                              {article.excerpt}
                            </p>
                            <div className="mt-4 flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                              <span className="inline-flex items-center gap-2"><User className="h-4 w-4" />{article.authors?.name}</span>
                              <span>{calculateReadingTime(article.excerpt || article.title || '')} min read</span>
                            </div>
                          </div>
                        </article>
                      </Link>
                    ))}
                  </div>
                )}

                {articles && articles.length > 0 ? (
                  <div className="space-y-5">
                    {latestFeedArticles.map((article, idx) => (
                      <div key={article.id}>
                        <Link href={`/${article.categories?.slug || 'news'}/${article.slug}`}>
                          <Card className="overflow-hidden rounded-[22px] hover:shadow-lg transition-shadow cursor-pointer dark:bg-gray-800 dark:border-gray-700">
                            <div className="flex flex-col md:flex-row">
                              {article.featured_image_url && (
                                <div className="relative w-full md:w-64 h-48 md:h-auto">
                                  <Image
                                    src={article.featured_image_url}
                                    alt={article.title}
                                    fill
                                    className="object-cover md:rounded-l-[22px] md:rounded-t-none"
                                    sizes="(max-width: 768px) 100vw, 256px"
                                  />
                                </div>
                              )}
                              <CardContent className="flex-1 p-5 md:p-6">
                                <div className="flex items-center gap-2 mb-3">
                                  {article.categories && (
                                    <Badge variant="secondary" className="dark:bg-gray-700">
                                      {article.categories.name}
                                    </Badge>
                                  )}
                                </div>
                                <h3 className="text-xl font-bold mb-2 dark:text-white leading-snug">{article.title}</h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                                  {article.excerpt}
                                </p>
                                <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-gray-500 dark:text-gray-400">
                                  <div className="flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    <span>{article.authors?.name}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    <span>{formatDistanceToNow(new Date(article.published_at), { addSuffix: true })}</span>
                                  </div>
                                </div>
                              </CardContent>
                            </div>
                          </Card>
                        </Link>
                        {adsEnabled && (idx + 1) % 3 === 0 && (
                          <div className="rounded-[22px] border dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                            <InArticleAd />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-600 dark:text-gray-400 text-lg">
                      No articles published yet. Check back soon!
                    </p>
                  </div>
                )}
              </section>

              {homepageCategoryBlocks.length > 0 && (
                <section>
                  <div className="mb-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">News Desk</p>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mt-1">Category Fronts</h2>
                  </div>
                  <div className="space-y-10">
                    {homepageCategoryBlocks.map((block) => {
                      const [leadArticle, ...secondaryArticles] = block.articles
                      return (
                        <section key={block.id} className="rounded-[28px] border border-slate-200 bg-white p-5 md:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                          <div className="flex items-center justify-between mb-5">
                            <h3 className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white">{block.name}</h3>
                            <Link href={`/category/${block.slug}`} className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 text-sm hover:underline">
                              View All <ArrowRight className="h-4 w-4" />
                            </Link>
                          </div>

                          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] gap-6">
                            {leadArticle && (
                              <Link href={`/${leadArticle.categories?.slug || 'news'}/${leadArticle.slug}`} className="group">
                                <article className="overflow-hidden rounded-[22px] border border-slate-200 dark:border-slate-800">
                                  {leadArticle.featured_image_url && (
                                    <div className="relative aspect-[16/10]">
                                      <Image
                                        src={leadArticle.featured_image_url}
                                        alt={leadArticle.title}
                                        fill
                                        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                                        sizes="(max-width: 1280px) 100vw, 50vw"
                                      />
                                    </div>
                                  )}
                                  <div className="p-5">
                                    <h4 className="text-2xl font-bold leading-tight text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                      {leadArticle.title}
                                    </h4>
                                    <p className="mt-3 text-slate-600 dark:text-slate-400 line-clamp-3">
                                      {leadArticle.excerpt}
                                    </p>
                                  </div>
                                </article>
                              </Link>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {secondaryArticles.map((article) => (
                                <ArticleMiniCard key={article.id} article={article} compact />
                              ))}
                            </div>
                          </div>
                        </section>
                      )
                    })}
                  </div>
                </section>
              )}

              {webStories.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Swipe Format</p>
                      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mt-1">Top Web Stories</h2>
                    </div>
                    <Link href="/web-stories" className="text-blue-600 dark:text-blue-400 hover:underline">View all</Link>
                  </div>
                  <div className="flex gap-4 overflow-x-auto pb-2">
                    {webStories.slice(0, 5).map((story) => (
                      <div key={story.id} className="min-w-[180px] max-w-[180px]">
                        <WebStoryCard story={story} />
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            <aside className="space-y-6">
              <Card className="dark:bg-gray-800 dark:border-gray-700 rounded-[24px]">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4 dark:text-white">Fast Picks</h3>
                  <div className="space-y-4">
                    {articles.slice(0, 5).map((article) => (
                      <Link key={article.id} href={`/${article.categories?.slug || 'news'}/${article.slug}`} className="block group">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                          {article.categories?.name || 'News'}
                        </p>
                        <h4 className="mt-1 text-sm font-semibold leading-6 text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                          {article.title}
                        </h4>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="dark:bg-gray-800 dark:border-gray-700 rounded-[24px]">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4 dark:text-white">Categories</h3>
                  <div className="flex flex-wrap gap-2">
                    {categories?.map(category => (
                      <Link key={category.id} href={`/category/${category.slug}`}>
                        <Badge variant="outline" className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300">
                          {category.name}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {adsEnabled && (
                <div className="rounded-[24px] border dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                  <HeaderAd />
                </div>
              )}
            </aside>
          </div>

        </div>

      </div>
    </>
  )
}
