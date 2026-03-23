import { createClient } from '@/lib/supabase/server'
import { absoluteUrl } from '@/lib/site-config'
import { urlsetXml, xmlResponse } from '@/lib/sitemap-utils'

const MAX_URLS = 50000

export async function GET() {
  const supabase = await createClient()
  const { data: rows } = await supabase
    .from('articles')
    .select('slug, updated_at, published_at, categories(slug)')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(MAX_URLS)

  const entries = (rows || []).map((article) => ({
    loc: absoluteUrl(`/${article.categories?.slug || 'news'}/${article.slug}`),
    lastmod: new Date(article.updated_at || article.published_at || Date.now()).toISOString(),
    changefreq: 'daily',
    priority: 0.8,
  }))

  return xmlResponse(urlsetXml(entries))
}
