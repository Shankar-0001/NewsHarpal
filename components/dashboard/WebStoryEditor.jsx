'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { slugFromText } from '@/lib/site-config'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import KeywordInput from '@/components/dashboard/KeywordInput'

function emptyContentSlide() {
  return {
    image: '',
    image_alt: '',
    description: '',
  }
}

function emptyCtaSlide() {
  return {
    image: '',
    image_alt: '',
    description: '',
    cta_text: '',
    cta_url: '',
    whatsapp_group_url: '',
  }
}

function normalizeContentSlides(slides = []) {
  const regularSlides = (slides || []).filter((slide) => !slide?.cta_url && !slide?.whatsapp_group_url)
  return regularSlides.length > 0
    ? regularSlides.map((slide) => ({
      image: slide?.image || '',
      image_alt: slide?.image_alt || '',
      description: slide?.description || '',
    }))
    : [emptyContentSlide(), emptyContentSlide(), emptyContentSlide(), emptyContentSlide()]
}

function normalizeReadMoreSlide(slides = []) {
  const existing = (slides || []).find((slide) => slide?.cta_url || slide?.cta_text)
  return existing
    ? {
      image: existing?.image || '',
      image_alt: existing?.image_alt || '',
      description: existing?.description || '',
      cta_text: existing?.cta_text || '',
      cta_url: existing?.cta_url || '',
      whatsapp_group_url: '',
    }
    : emptyCtaSlide()
}

function normalizeWhatsappSlide(slides = []) {
  const existing = (slides || []).find((slide) => slide?.whatsapp_group_url)
  return existing
    ? {
      image: existing?.image || '',
      image_alt: existing?.image_alt || '',
      description: existing?.description || '',
      cta_text: '',
      cta_url: '',
      whatsapp_group_url: existing?.whatsapp_group_url || '',
    }
    : emptyCtaSlide()
}

export default function WebStoryEditor({ mode = 'create', storyId = null }) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [categories, setCategories] = useState([])
  const [authors, setAuthors] = useState([])

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [seoDescription, setSeoDescription] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [authorId, setAuthorId] = useState('')
  const [relatedArticleSlug, setRelatedArticleSlug] = useState('')
  const [tagsText, setTagsText] = useState('')
  const [keywords, setKeywords] = useState([])
  const [contentSlides, setContentSlides] = useState([emptyContentSlide(), emptyContentSlide(), emptyContentSlide(), emptyContentSlide()])
  const [readMoreSlide, setReadMoreSlide] = useState(emptyCtaSlide())
  const [whatsappSlide, setWhatsappSlide] = useState(emptyCtaSlide())

  useEffect(() => {
    const bootstrap = async () => {
      const { data: authData } = await supabase.auth.getUser()
      if (!authData?.user) return

      const [{ data: userRow }, { data: categoryRows }, { data: authorRows }] = await Promise.all([
        supabase.from('users').select('role').eq('id', authData.user.id).single(),
        supabase.from('categories').select('id, name').order('name'),
        supabase.from('authors').select('id, name').order('name'),
      ])

      setCategories(categoryRows || [])
      setAuthors(authorRows || [])

      if (mode === 'create' && userRow?.role !== 'admin') {
        const { data: ownAuthor } = await supabase.from('authors').select('id').eq('user_id', authData.user.id).single()
        setAuthorId(ownAuthor?.id || '')
      }

      if (mode === 'edit' && storyId) {
        const response = await fetch(`/api/web-stories/${storyId}`)
        const payload = await response.json()
        const story = payload?.data?.story
        if (!story) return

        setTitle(story.title || '')
        setSlug(story.slug || '')
        setSeoDescription(story.seo_description || '')
        setCoverImage(story.cover_image || '')
        setCategoryId(story.category_id || '')
        setAuthorId(story.author_id || '')
        setRelatedArticleSlug(story.related_article_slug || '')
        setTagsText(Array.isArray(story.tags) ? story.tags.join(', ') : '')
        setKeywords(Array.isArray(story.keywords) ? story.keywords : [])
        setContentSlides(normalizeContentSlides(story.slides))
        setReadMoreSlide(normalizeReadMoreSlide(story.slides))
        setWhatsappSlide(normalizeWhatsappSlide(story.slides))
      }
    }

    bootstrap()
  }, [mode, storyId])

  const setContentSlide = (idx, patch) => {
    setContentSlides((prev) => prev.map((slide, index) => (index === idx ? { ...slide, ...patch } : slide)))
  }

  const addContentSlide = () => {
    setContentSlides((prev) => [...prev, emptyContentSlide()])
  }

  const removeContentSlide = (idx) => {
    setContentSlides((prev) => (prev.length <= 4 ? prev : prev.filter((_, index) => index !== idx)))
  }

  const moveContentSlide = (idx, dir) => {
    setContentSlides((prev) => {
      const nextIndex = idx + dir
      if (nextIndex < 0 || nextIndex >= prev.length) return prev
      const clone = [...prev]
      const temp = clone[idx]
      clone[idx] = clone[nextIndex]
      clone[nextIndex] = temp
      return clone
    })
  }

  const uploadMedia = async (file) => {
    if (!file) return ''
    const formData = new FormData()
    formData.append('file', file)

    if (file.type.startsWith('image/')) {
      try {
        const dimensions = await new Promise((resolve, reject) => {
          const img = new Image()
          img.onload = () => resolve({ width: img.width, height: img.height })
          img.onerror = () => reject(new Error('Could not read image dimensions'))
          img.src = URL.createObjectURL(file)
        })
        formData.append('dimensions', JSON.stringify(dimensions))
      } catch {
        // Continue without dimensions metadata
      }
    }

    setUploading(true)
    const response = await fetch('/api/media', { method: 'POST', body: formData })
    setUploading(false)
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      alert(payload?.error?.message || payload?.error || 'Upload failed')
      return ''
    }
    return payload?.data?.media?.file_url || ''
  }

  const save = async () => {
    const normalizedTitle = title.trim()
    const normalizedSlug = slugFromText(slug || normalizedTitle || 'web-story')
    const trimmedTags = tagsText.split(',').map((tag) => tag.trim()).filter(Boolean)
    const preparedContentSlides = contentSlides
      .map((slide) => ({
        image: slide.image || '',
        image_alt: slide.image_alt || normalizedTitle,
        headline: normalizedTitle,
        description: slide.description || '',
        cta_text: '',
        cta_url: '',
        whatsapp_group_url: '',
        seo_description: '',
      }))
      .filter((slide) => slide.image)

    if (!normalizedTitle) {
      alert('Story title is required')
      return
    }

    if (preparedContentSlides.length < 4) {
      alert('Please add at least 4 content slides with images')
      return
    }

    const fallbackImage = coverImage || preparedContentSlides[0]?.image || ''
    const finalSlides = [
      ...preparedContentSlides,
      {
        image: readMoreSlide.image || fallbackImage,
        image_alt: readMoreSlide.image_alt || normalizedTitle,
        headline: normalizedTitle,
        description: readMoreSlide.description || '',
        cta_text: readMoreSlide.cta_text || 'Read more',
        cta_url: readMoreSlide.cta_url || '',
        whatsapp_group_url: '',
        seo_description: '',
      },
      {
        image: whatsappSlide.image || fallbackImage,
        image_alt: whatsappSlide.image_alt || normalizedTitle,
        headline: normalizedTitle,
        description: whatsappSlide.description || '',
        cta_text: '',
        cta_url: '',
        whatsapp_group_url: whatsappSlide.whatsapp_group_url || '',
        seo_description: '',
      },
    ].filter((slide) => slide.image)

    setLoading(true)

    const payload = {
      title: normalizedTitle,
      slug: normalizedSlug,
      cover_image: coverImage || preparedContentSlides[0]?.image || '',
      category_id: categoryId || null,
      author_id: authorId || null,
      related_article_slug: relatedArticleSlug || null,
      seo_description: seoDescription || null,
      tags: trimmedTags,
      keywords,
      slides: finalSlides,
    }

    const endpoint = mode === 'edit' ? `/api/web-stories/${storyId}` : '/api/web-stories'
    const method = mode === 'edit' ? 'PATCH' : 'POST'

    const response = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    setLoading(false)
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}))
      alert(payload?.error || 'Failed to save web story')
      return
    }

    router.push('/dashboard/web-stories')
    router.refresh()
  }

  const derivedSlug = slugFromText(slug || title || 'web-story')

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Story Setup</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            One heading, one meta description, one keyword/tag set for the full web story. This is cleaner for CMS use and better aligned with story-level SEO.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label htmlFor="story_title">Main Heading</Label>
            <Input id="story_title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter the web story heading" />
          </div>

          <div>
            <Label htmlFor="story_slug">Slug</Label>
            <Input id="story_slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder={derivedSlug} />
          </div>

          <div>
            <Label htmlFor="cover_image">Cover Image URL</Label>
            <Input id="cover_image" value={coverImage} onChange={(e) => setCoverImage(e.target.value)} placeholder="https://..." />
            <Input
              id="cover_image_file"
              type="file"
              accept="image/*"
              className="mt-2"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                const url = await uploadMedia(file)
                if (url) {
                  setCoverImage(url)
                }
              }}
            />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="story_seo_description">Meta Description</Label>
            <Textarea
              id="story_seo_description"
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              placeholder="Short search description for the whole web story"
            />
          </div>

          <div>
            <Label>Category</Label>
            <Select value={categoryId || undefined} onValueChange={setCategoryId}>
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Author</Label>
            <Select value={authorId || undefined} onValueChange={setAuthorId}>
              <SelectTrigger><SelectValue placeholder="Select author" /></SelectTrigger>
              <SelectContent>
                {authors.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="related_article_slug">Related Article Slug</Label>
            <Input id="related_article_slug" value={relatedArticleSlug} onChange={(e) => setRelatedArticleSlug(e.target.value)} placeholder="optional-related-article-slug" />
          </div>

          <div>
            <Label htmlFor="story_tags">Tags</Label>
            <Input id="story_tags" value={tagsText} onChange={(e) => setTagsText(e.target.value)} placeholder="news, latest, update" />
          </div>
        </div>

        <div className="mt-6">
          <KeywordInput
            label="Story Keywords"
            value={keywords}
            onChange={setKeywords}
            description="Add up to 10 keywords for the whole story. These feed metadata and structured data."
          />
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Content Slides</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Add as many main slides as you want. Each slide needs an image and the bottom overlay text that should appear over the image.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={addContentSlide}>Add Slide</Button>
        </div>

        <div className="space-y-5">
          {contentSlides.map((slide, idx) => (
            <div key={idx} className="rounded-xl border p-4 dark:border-gray-700">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Slide {idx + 1}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Main heading is shared from story setup</p>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" onClick={() => moveContentSlide(idx, -1)}>Up</Button>
                  <Button type="button" variant="ghost" onClick={() => moveContentSlide(idx, 1)}>Down</Button>
                  <Button type="button" variant="ghost" onClick={() => removeContentSlide(idx)} disabled={contentSlides.length <= 4}>Remove</Button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div>
                  <Label htmlFor={`content_image_${idx}`}>Image URL</Label>
                  <Input id={`content_image_${idx}`} value={slide.image} onChange={(e) => setContentSlide(idx, { image: e.target.value })} placeholder="https://..." />
                  <Input
                    id={`content_file_${idx}`}
                    type="file"
                    accept="image/*"
                    className="mt-2"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      const url = await uploadMedia(file)
                      if (url) {
                        setContentSlide(idx, {
                          image: url,
                          image_alt: slide.image_alt || title || `Slide ${idx + 1} image`,
                        })
                        if (!coverImage && idx === 0) {
                          setCoverImage(url)
                        }
                      }
                    }}
                  />
                </div>

                <div>
                  <Label htmlFor={`content_alt_${idx}`}>Image Alt Text</Label>
                  <Input id={`content_alt_${idx}`} value={slide.image_alt} onChange={(e) => setContentSlide(idx, { image_alt: e.target.value })} placeholder="Describe the image for accessibility" />
                </div>
              </div>

              <div className="mt-4">
                <Label htmlFor={`content_description_${idx}`}>Visible Bottom Text</Label>
                <Textarea
                  id={`content_description_${idx}`}
                  value={slide.description}
                  onChange={(e) => setContentSlide(idx, { description: e.target.value })}
                  placeholder="Short overlay text visible at the bottom of the image"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Ending Slides</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            These two slides stay at the end of the web story: one for Read More and one for Join WhatsApp.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="rounded-xl border p-4 dark:border-gray-700">
            <h3 className="font-medium text-gray-900 dark:text-white">Read More Slide</h3>
            <div className="mt-4 space-y-4">
              <div>
                <Label htmlFor="readmore_image">Background Image URL</Label>
                <Input id="readmore_image" value={readMoreSlide.image} onChange={(e) => setReadMoreSlide((prev) => ({ ...prev, image: e.target.value }))} placeholder={coverImage || 'Uses cover image if left empty'} />
              </div>
              <div>
                <Label htmlFor="readmore_alt">Image Alt Text</Label>
                <Input id="readmore_alt" value={readMoreSlide.image_alt} onChange={(e) => setReadMoreSlide((prev) => ({ ...prev, image_alt: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="readmore_description">Bottom Text</Label>
                <Textarea id="readmore_description" value={readMoreSlide.description} onChange={(e) => setReadMoreSlide((prev) => ({ ...prev, description: e.target.value }))} placeholder="Optional short line for this CTA slide" />
              </div>
              <div>
                <Label htmlFor="readmore_text">Button Text</Label>
                <Input id="readmore_text" value={readMoreSlide.cta_text} onChange={(e) => setReadMoreSlide((prev) => ({ ...prev, cta_text: e.target.value }))} placeholder="Read these stories" />
              </div>
              <div>
                <Label htmlFor="readmore_url">Button URL</Label>
                <Input id="readmore_url" value={readMoreSlide.cta_url} onChange={(e) => setReadMoreSlide((prev) => ({ ...prev, cta_url: e.target.value }))} placeholder="https://ekahnews.com/..." />
              </div>
            </div>
          </div>

          <div className="rounded-xl border p-4 dark:border-gray-700">
            <h3 className="font-medium text-gray-900 dark:text-white">WhatsApp Slide</h3>
            <div className="mt-4 space-y-4">
              <div>
                <Label htmlFor="whatsapp_image">Background Image URL</Label>
                <Input id="whatsapp_image" value={whatsappSlide.image} onChange={(e) => setWhatsappSlide((prev) => ({ ...prev, image: e.target.value }))} placeholder={coverImage || 'Uses cover image if left empty'} />
              </div>
              <div>
                <Label htmlFor="whatsapp_alt">Image Alt Text</Label>
                <Input id="whatsapp_alt" value={whatsappSlide.image_alt} onChange={(e) => setWhatsappSlide((prev) => ({ ...prev, image_alt: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="whatsapp_description">Bottom Text</Label>
                <Textarea id="whatsapp_description" value={whatsappSlide.description} onChange={(e) => setWhatsappSlide((prev) => ({ ...prev, description: e.target.value }))} placeholder="Optional short line for this CTA slide" />
              </div>
              <div>
                <Label htmlFor="whatsapp_url">WhatsApp Community URL</Label>
                <Input id="whatsapp_url" value={whatsappSlide.whatsapp_group_url} onChange={(e) => setWhatsappSlide((prev) => ({ ...prev, whatsapp_group_url: e.target.value }))} placeholder="https://chat.whatsapp.com/..." />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="flex items-center justify-between gap-4 rounded-2xl border bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div>
          <p className="font-medium text-gray-900 dark:text-white">Ready to publish</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            This setup saves one story heading and story-level SEO, with content slides first and CTA slides at the end.
          </p>
        </div>
        <Button onClick={save} disabled={loading || uploading}>
          {uploading ? 'Uploading...' : loading ? 'Saving...' : mode === 'edit' ? 'Update Story' : 'Create Story'}
        </Button>
      </div>
    </div>
  )
}
