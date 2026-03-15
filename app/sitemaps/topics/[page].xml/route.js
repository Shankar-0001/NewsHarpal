import { createClient } from '@/lib/supabase/server'
import { absoluteUrl } from '@/lib/site-config'
import { urlsetXml, xmlResponse } from '@/lib/sitemap-utils'

const PAGE_SIZE = 1200

function toPageNumber(raw) {
  const page = Number.parseInt(raw, 10)
  return Number.isFinite(page) && page > 0 ? page : 1
}

function buildTopicEntries(slug, lastmod, priority = 0.6) {
  return [
    {
      loc: absoluteUrl(`/topic/${slug}`),
      lastmod,
      changefreq: 'weekly',
      priority,
    },
    {
      loc: absoluteUrl(`/trending/${slug}`),
      lastmod,
      changefreq: 'daily',
      priority: Math.max(priority, 0.7),
    },
    {
      loc: absoluteUrl(`/explained/${slug}`),
      lastmod,
      changefreq: 'weekly',
      priority,
    },
  ]
}

export async function GET(_request, context) {
  const page = toPageNumber(context?.params?.page)
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1
  const supabase = await createClient()

  const { data: trendRows } = await supabase
    .from('trending_topics')
    .select('slug, updated_at')
    .order('updated_at', { ascending: false })
    .range(from, to)

  const trendEntries = (trendRows || []).flatMap((row) =>
    buildTopicEntries(
      row.slug,
      new Date(row.updated_at || Date.now()).toISOString(),
      0.7
    )
  )

  const dedup = new Map()
  ;[...trendEntries].forEach((entry) => {
    if (!dedup.has(entry.loc)) dedup.set(entry.loc, entry)
  })

  return xmlResponse(urlsetXml([...dedup.values()]))
}
