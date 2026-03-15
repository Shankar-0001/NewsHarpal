"use client"

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import ArticleEngagementInline from './ArticleEngagementInline'

export default function ArticleSummaryToggles({ summaryPoints = [], aeoSnapshot = {}, articleId, articleUrl, articleTitle }) {
  const [openSection, setOpenSection] = useState(null)

  const hasSummary = summaryPoints.length > 0
  const hasContext = Boolean(aeoSnapshot?.whatChanged || aeoSnapshot?.whyItMatters || aeoSnapshot?.keyContext)

  if (!hasSummary && !hasContext && !articleId) return null

  return (
    <div className="mb-8">
      <div className="flex flex-wrap items-center gap-3">
        {hasSummary && (
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-pink-700 bg-pink-700 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-600"
            aria-expanded={openSection === 'summary'}
            onClick={() => setOpenSection(openSection === 'summary' ? null : 'summary')}
          >
            60 Second Summary
            <ChevronDown className={`h-4 w-4 transition-transform ${openSection === 'summary' ? 'rotate-180' : ''}`} />
          </button>
        )}
        {hasContext && (
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-pink-700 bg-pink-700 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-600"
            aria-expanded={openSection === 'context'}
            onClick={() => setOpenSection(openSection === 'context' ? null : 'context')}
          >
            Quick Context
            <ChevronDown className={`h-4 w-4 transition-transform ${openSection === 'context' ? 'rotate-180' : ''}`} />
          </button>
        )}
        {articleId && (
          <ArticleEngagementInline articleId={articleId} articleUrl={articleUrl} articleTitle={articleTitle} />
        )}
      </div>
      {hasSummary && openSection === 'summary' && (
        <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-sm text-blue-900/90 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-100/90">
          <ul className="list-disc pl-5 space-y-1.5">
            {summaryPoints.map((point, idx) => (
              <li key={`${point}-${idx}`}>{point}</li>
            ))}
          </ul>
        </div>
      )}
      {hasContext && openSection === 'context' && (
        <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50/70 p-4 text-sm text-amber-900/90 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100/90">
          <ul className="list-disc pl-5 space-y-1.5">
            {aeoSnapshot?.whatChanged && <li><strong>What changed:</strong> {aeoSnapshot.whatChanged}</li>}
            {aeoSnapshot?.whyItMatters && <li><strong>Why it matters:</strong> {aeoSnapshot.whyItMatters}</li>}
            {aeoSnapshot?.keyContext && <li><strong>Key context:</strong> {aeoSnapshot.keyContext}</li>}
          </ul>
        </div>
      )}
    </div>
  )
}
