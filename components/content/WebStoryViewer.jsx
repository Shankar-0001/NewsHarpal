'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Heart } from 'lucide-react'
import Image from 'next/image'
import { getAnchorPropsForHref } from '@/lib/link-policy'

const AUTO_MS = 5000

export default function WebStoryViewer({ story, articleUrl }) {
  const slides = useMemo(() => (Array.isArray(story?.slides) ? story.slides : []), [story])
  const [index, setIndex] = useState(0)
  const [metrics, setMetrics] = useState({ views: 0, likes: 0, shares: 0 })
  const [touchStartX, setTouchStartX] = useState(null)

  const authorName = story?.authors?.name || 'EkahNews'
  const current = slides[index] || {}
  const isCoverSlide = index === 0
  const isWhatsappSlide = Boolean(current?.whatsapp_group_url)
  const isReadMoreSlide = !isWhatsappSlide && Boolean(current?.cta_text || current?.cta_url)
  const progressWidth = `${((index + 1) / Math.max(1, slides.length)) * 100}%`
  const ctaHref = current?.cta_url || articleUrl || '#'
  const ctaLinkProps = getAnchorPropsForHref(ctaHref)
  const whatsappLinkProps = getAnchorPropsForHref(current?.whatsapp_group_url || '')

  useEffect(() => {
    if (!story?.id) return
    fetch(`/api/engagement?id=${story.id}&type=story`)
      .then((res) => res.json())
      .then((payload) => setMetrics(payload?.data?.metrics || { views: 0, likes: 0, shares: 0 }))
      .catch(() => null)

    fetch('/api/engagement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: story.id, type: 'story', action: 'view' }),
    }).catch(() => null)
  }, [story?.id])

  useEffect(() => {
    if (slides.length < 2) return
    const timer = setTimeout(() => {
      setIndex((prev) => (prev + 1) % slides.length)
    }, AUTO_MS)
    return () => clearTimeout(timer)
  }, [index, slides.length])

  const handleLike = async () => {
    const response = await fetch('/api/engagement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: story.id, type: 'story', action: 'like' }),
    })
    const payload = await response.json()
    if (payload?.data?.metrics) setMetrics(payload.data.metrics)
  }

  const next = () => setIndex((prev) => Math.min(slides.length - 1, prev + 1))
  const prev = () => setIndex((prev) => Math.max(0, prev - 1))

  return (
    <div className="mx-auto max-w-sm md:max-w-md lg:max-w-lg">
      <div className="mb-3 h-1.5 w-full rounded bg-gray-200 dark:bg-gray-700">
        <div className="h-full rounded bg-blue-600 transition-all" style={{ width: progressWidth }} />
      </div>

      <div
        className="relative overflow-hidden rounded-2xl border border-gray-200 bg-black aspect-[9/16] dark:border-gray-700"
        onTouchStart={(e) => setTouchStartX(e.changedTouches[0]?.clientX ?? null)}
        onTouchEnd={(e) => {
          const endX = e.changedTouches[0]?.clientX
          if (touchStartX == null || typeof endX !== 'number') return
          const delta = endX - touchStartX
          if (delta > 40) prev()
          if (delta < -40) next()
          setTouchStartX(null)
        }}
      >
        {current?.image ? (
          <Image
            src={current.image}
            alt={current.image_alt || story.title}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 420px"
            priority={index === 0}
          />
        ) : (
          <div className="h-full w-full bg-gray-800" />
        )}

        <button className="absolute inset-y-0 left-0 w-1/2" onClick={prev} aria-label="Previous slide" />
        <button className="absolute inset-y-0 right-0 w-1/2" onClick={next} aria-label="Next slide" />

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/55 to-transparent p-4 text-white">
          <div className="mb-2 flex items-center justify-between gap-2 text-xs text-gray-200">
            <span>{isCoverSlide ? authorName : `Slide ${index + 1}`}</span>
            <span>Slide {index + 1} of {slides.length}</span>
          </div>

          {isCoverSlide && !isReadMoreSlide && !isWhatsappSlide && (
            <>
              <h2 className="text-lg font-bold leading-snug">{story.title}</h2>
              <p className="mt-1 text-sm text-gray-200">{authorName}</p>
            </>
          )}

          {!isReadMoreSlide && !isWhatsappSlide && current?.description && (
            <p className="mt-2 text-sm leading-6 text-gray-100">{current.description}</p>
          )}

          {isReadMoreSlide && (
            <div className="mt-3 space-y-3 text-center">
              {current?.description && (
                <p className="text-sm leading-6 text-gray-100">{current.description}</p>
              )}
              <a
                href={ctaHref}
                {...ctaLinkProps}
                className="inline-flex rounded-full bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-400"
              >
                {current.cta_text || 'Read More'}
              </a>
            </div>
          )}

          {isWhatsappSlide && (
            <div className="mt-3 space-y-3 text-center">
              {current?.description && (
                <p className="text-sm leading-6 text-gray-100">{current.description}</p>
              )}
              {current.whatsapp_group_url ? (
                <a
                  href={current.whatsapp_group_url}
                  {...whatsappLinkProps}
                  className="inline-flex rounded-full bg-green-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-400"
                >
                  Join Our WhatsApp Community
                </a>
              ) : (
                <span className="inline-flex rounded-full bg-green-500 px-4 py-2 text-sm font-semibold text-white">
                  Join Our WhatsApp Community
                </span>
              )}
            </div>
          )}

          <div className="mt-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-gray-200">
              <span>{metrics.views || 0} views</span>
              <span>{metrics.likes || 0} likes</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={handleLike}><Heart className="mr-1 h-4 w-4" />Like</Button>
            </div>
          </div>
        </div>

        <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1 text-white" aria-label="Previous">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1 text-white" aria-label="Next">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
