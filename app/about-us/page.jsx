import { createClient } from '@/lib/supabase/server'
import PublicHeader from '@/components/layout/PublicHeader'
import StructuredData from '@/components/seo/StructuredData'
import { absoluteUrl } from '@/lib/site-config'
import { getRenderableHtml, getStaticPageDefinition, getStaticPageOverride } from '@/lib/static-pages'

export async function generateMetadata() {
  const definition = getStaticPageDefinition('about-us')
  const override = await getStaticPageOverride('about-us')

  return {
    title: override?.seo_title || definition?.seoTitle || 'About Us - EkahNews',
    description: override?.seo_description
      || definition?.seoDescription
      || 'Learn about EkahNews, our newsroom values, and our commitment to responsible journalism.',
  }
}

export default async function AboutUsPage() {
  const supabase = await createClient()
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug')
    .order('name')

  const override = await getStaticPageOverride('about-us')
  const pageTitle = override?.title || 'About EkahNews'
  const contentHtml = override?.content_html ? getRenderableHtml(override.content_html) : null
  const pageUrl = absoluteUrl('/about-us')
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: pageTitle,
    url: pageUrl,
    isPartOf: {
      '@type': 'WebSite',
      name: 'EkahNews',
      url: absoluteUrl('/'),
    },
    about: {
      '@type': 'Organization',
      name: 'EkahNews',
      url: absoluteUrl('/'),
    },
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <StructuredData data={schema} />
      <PublicHeader categories={categories || []} />
      <main className="w-full max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{pageTitle}</h1>
        {contentHtml ? (
          <div
            className="mt-6 prose prose-slate dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />
        ) : (
          <div className="mt-6 space-y-4 text-gray-700 dark:text-gray-300">
            <p>
              EkahNews delivers timely, reliable coverage across major categories with a focus on clarity, context, and
              public value. Our newsroom prioritizes accuracy, transparency, and reader trust.
            </p>
            <p>
              We combine human editorial judgment with data-informed workflows to surface stories that matter while
              maintaining strong editorial standards.
            </p>
            <p>
              If you have questions about our coverage or want to suggest a story, please reach out via our contact page.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}

