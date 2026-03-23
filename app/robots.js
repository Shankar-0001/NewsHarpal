import { SITE_URL } from '@/lib/site-config'

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard/', '/api/'],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/dashboard/', '/api/'],
      },
    ],
    sitemap: [
      `${SITE_URL}/sitemap.xml`,
      `${SITE_URL}/article-sitemap.xml`,
      `${SITE_URL}/news-sitemap.xml`,
      `${SITE_URL}/category-sitemap.xml`,
      `${SITE_URL}/topic-sitemap.xml`,
      `${SITE_URL}/web-stories-sitemap.xml`,
    ],
  }
}
