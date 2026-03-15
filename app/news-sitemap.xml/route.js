import { createClient } from '@/lib/supabase/server'
import { sitemapIndexXml, xmlResponse } from '@/lib/sitemap-utils'

const PAGE_SIZE = 1000
const NEWS_WINDOW_MS = 2 * 24 * 60 * 60 * 1000

export async function GET() {
  const supabase = await createClient()
  const cutoffIso = new Date(Date.now() - NEWS_WINDOW_MS).toISOString()

  const { count } = await supabase
    .from('articles')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'published')
    .gte('published_at', cutoffIso)

  const totalPages = Math.max(1, Math.ceil((count || 0) / PAGE_SIZE))
  const paths = Array.from({ length: totalPages }, (_, idx) => `/sitemaps/news/${idx + 1}.xml`)

  return xmlResponse(sitemapIndexXml(paths))
}

