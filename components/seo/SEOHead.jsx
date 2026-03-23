'use client'

import Head from 'next/head'
import { resolveCanonicalUrl } from '@/lib/site-config'

export default function SEOHead({
  title,
  description,
  canonical,
  ogType = 'website',
  ogImage,
  article,
  author,
  publishedTime,
  modifiedTime,
  tags = [],
}) {
  const siteName = 'EkahNews'
  const fullTitle = title ? `${title} | ${siteName}` : siteName
  const canonicalUrl = resolveCanonicalUrl(canonical, '/')

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      <meta name="robots" content="max-image-preview:large, index, follow" />
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={title || siteName} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content={siteName} />
      {ogImage && <meta property="og:image" content={ogImage} />}
      {ogImage && <meta property="og:image:width" content="1200" />}
      {ogImage && <meta property="og:image:height" content="630" />}
      {article && (
        <>
          <meta property="article:published_time" content={publishedTime} />
          {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
          {author && <meta property="article:author" content={author} />}
          {tags.map((tag) => (
            <meta key={tag} property="article:tag" content={tag} />
          ))}
        </>
      )}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title || siteName} />
      <meta name="twitter:description" content={description} />
      {ogImage && <meta name="twitter:image" content={ogImage} />}
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
    </Head>
  )
}

