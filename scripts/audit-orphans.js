import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'
import path from 'node:path'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

function unique(values = []) {
  return [...new Set(values.filter(Boolean))]
}

async function main() {
  const { data: articles, error: articlesError } = await supabase
    .from('articles')
    .select('id, title, slug, category_id, published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(5000)

  if (articlesError) throw articlesError

  const { data: categories, error: categoriesError } = await supabase
    .from('categories')
    .select('id, slug')

  if (categoriesError) throw categoriesError

  const { data: tagLinks, error: tagLinksError } = await supabase
    .from('article_tags')
    .select('article_id, tag_id')

  if (tagLinksError) throw tagLinksError

  const categoryMap = new Map((categories || []).map((c) => [c.id, c.slug]))
  const categoryCounts = new Map()
  for (const article of articles || []) {
    if (!article.category_id) continue
    categoryCounts.set(article.category_id, (categoryCounts.get(article.category_id) || 0) + 1)
  }

  const tagCounts = new Map()
  const tagMapByArticle = new Map()
  for (const link of tagLinks || []) {
    tagCounts.set(link.tag_id, (tagCounts.get(link.tag_id) || 0) + 1)
    if (!tagMapByArticle.has(link.article_id)) tagMapByArticle.set(link.article_id, [])
    tagMapByArticle.get(link.article_id).push(link.tag_id)
  }

  const homepageLatest = new Set((articles || []).slice(0, 10).map((a) => a.id))
  const results = []

  for (const article of articles || []) {
    const categorySlug = categoryMap.get(article.category_id || '') || null
    const hasCategoryLink = !!categorySlug
    const hasCategoryPeers = article.category_id ? (categoryCounts.get(article.category_id) || 0) > 1 : false
    const tagIds = unique(tagMapByArticle.get(article.id) || [])
    const hasTagLink = tagIds.length > 0
    const hasTagPeers = tagIds.some((id) => (tagCounts.get(id) || 0) > 1)
    const onHomepage = homepageLatest.has(article.id)

    const hasAnyLinkSource = onHomepage || hasCategoryLink || hasTagLink || hasCategoryPeers || hasTagPeers

    results.push({
      id: article.id,
      title: article.title,
      slug: article.slug,
      categorySlug,
      published_at: article.published_at,
      onHomepage,
      hasCategoryLink,
      hasCategoryPeers,
      hasTagLink,
      hasTagPeers,
      orphan: !hasAnyLinkSource,
    })
  }

  const orphans = results.filter((row) => row.orphan)
  const outputDir = path.join(process.cwd(), 'reports')
  fs.mkdirSync(outputDir, { recursive: true })

  fs.writeFileSync(
    path.join(outputDir, 'orphan-report.json'),
    JSON.stringify({ generatedAt: new Date().toISOString(), total: results.length, orphans }, null, 2),
    'utf8'
  )

  const mdLines = [
    `# Orphan Article Report`,
    ``,
    `Generated: ${new Date().toISOString()}`,
    ``,
    `Total published articles scanned: ${results.length}`,
    `Orphans detected: ${orphans.length}`,
    ``,
  ]

  if (orphans.length) {
    mdLines.push(`## Orphan Articles`)
    mdLines.push(``)
    for (const orphan of orphans) {
      mdLines.push(`- ${orphan.title} (/${orphan.categorySlug || 'news'}/${orphan.slug})`)
    }
  } else {
    mdLines.push(`No orphans detected with current signals.`)
  }

  fs.writeFileSync(path.join(outputDir, 'orphan-report.md'), mdLines.join('\n'), 'utf8')

  console.log(`Orphan report written to reports/orphan-report.md`)
}

main().catch((error) => {
  console.error('Orphan audit failed:', error)
  process.exit(1)
})
