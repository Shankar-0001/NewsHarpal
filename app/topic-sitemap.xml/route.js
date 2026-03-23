import { createClient } from '@/lib/supabase/server'
import { absoluteUrl } from '@/lib/site-config'
import { urlsetXml, xmlResponse } from '@/lib/sitemap-utils'

const MAX_URLS = 50000
const MIN_MATCH_COUNT = 3

function keywordPattern(slug = '') {
  const cleaned = String(slug)
    .replace(/-/g, ' ')
    .replace(/[^a-z0-9\s-]/gi, ' ')
    .trim()

  if (!cleaned) return null
  return `%${cleaned}%`
}

export async function GET() {
  const supabase = await createClient()
  const { data: trendRows } = await supabase
    .from('trending_topics')
    .select('slug, updated_at')
    .order('updated_at', { ascending: false })
    .limit(MAX_URLS)

  const eligibleRows = await Promise.all((trendRows || []).map(async (row) => {
    if (!row?.slug) return null

    const pattern = keywordPattern(row.slug)
    if (!pattern) return null

    const { count, error } = await supabase
      .from('articles')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published')
      .or(`title.ilike.${pattern},excerpt.ilike.${pattern}`)

    if (error || (count || 0) < MIN_MATCH_COUNT) {
      return null
    }

    return row
  }))

  const entries = eligibleRows
    .filter(Boolean)
    .map((row) => ({
      loc: absoluteUrl(`/topic/${row.slug}`),
      lastmod: new Date(row.updated_at || Date.now()).toISOString(),
      changefreq: 'weekly',
      priority: 0.7,
    }))

  return xmlResponse(urlsetXml(entries))
}
