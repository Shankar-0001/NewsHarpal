'use client'

import Script from 'next/script'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

const PLACEHOLDER_CLIENT_IDS = new Set(['ca-pub-0000000000000000', 'ca-pub-1234567890123456'])

function isAmpStoryPath(pathname = '') {
  return pathname.startsWith('/web-stories/') && pathname !== '/web-stories'
}

function getProductionHostname() {
  const siteUrl = process.env.NEXT_PUBLIC_BASE_URL
  if (!siteUrl) return ''

  try {
    return new URL(siteUrl).hostname
  } catch {
    return ''
  }
}

export default function OptionalGlobalScripts() {
  const pathname = usePathname() || ''
  const [isProductionHost, setIsProductionHost] = useState(false)

  useEffect(() => {
    const productionHostname = getProductionHostname()
    if (!productionHostname || typeof window === 'undefined') {
      setIsProductionHost(true)
      return
    }

    setIsProductionHost(window.location.hostname === productionHostname)
  }, [])

  if (isAmpStoryPath(pathname)) {
    return null
  }

  const adsEnabled = process.env.NEXT_PUBLIC_ADS_ENABLED === 'true'
  const adsenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID
  const hasValidAdsenseClientId = !!adsenseClientId && !PLACEHOLDER_CLIENT_IDS.has(adsenseClientId)
  const adsenseScriptSrc = hasValidAdsenseClientId
    ? `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClientId}`
    : null
  const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
  const shouldLoadAnalytics = Boolean(gaMeasurementId && isProductionHost)

  return (
    <>
      {shouldLoadAnalytics && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
            strategy="afterInteractive"
          />
          <Script
            src={`/analytics.js?id=${gaMeasurementId}`}
            strategy="afterInteractive"
          />
        </>
      )}
      {adsEnabled && adsenseScriptSrc && (
        <Script
          src={adsenseScriptSrc}
          strategy="lazyOnload"
          crossOrigin="anonymous"
        />
      )}
    </>
  )
}