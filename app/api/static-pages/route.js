import { apiResponse } from '@/lib/api-utils'
import { requireAdmin } from '@/lib/auth-utils'
import { createClient } from '@/lib/supabase/server'
import {
  STATIC_PAGE_DEFINITIONS,
  STATIC_PAGE_SLUGS,
  getStaticPageDefinition,
  mergeStaticPage,
} from '@/lib/static-pages'

export async function GET(request) {
  try {
    await requireAdmin()
    const admin = await createClient()
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')

    const { data, error } = await admin
      .from('static_pages')
      .select('slug, title, seo_title, seo_description, content_html, content_json, updated_at')

    if (error) return apiResponse(400, null, error.message)

    const bySlug = new Map((data || []).map((row) => [row.slug, row]))

    const pages = STATIC_PAGE_DEFINITIONS
      .filter((def) => !slug || def.slug === slug)
      .map((def) => mergeStaticPage(def, bySlug.get(def.slug) || null))

    if (slug && pages.length === 0) {
      return apiResponse(404, null, 'Static page not found')
    }

    return apiResponse(200, { pages })
  } catch (error) {
    if (error.name === 'AuthError') {
      const status = error.message.includes('Admin') ? 403 : 401
      return apiResponse(status, null, error.message)
    }
    return apiResponse(500, null, error.message || 'Failed to load static pages')
  }
}

export async function PUT(request) {
  try {
    await requireAdmin()
    const admin = await createClient()
    const payload = await request.json()
    const slug = payload?.slug?.trim()

    if (!slug) return apiResponse(400, null, 'Slug is required')
    if (!STATIC_PAGE_SLUGS.has(slug)) return apiResponse(400, null, 'Invalid static page slug')

    const definition = getStaticPageDefinition(slug)
    if (definition?.editable === false) {
      return apiResponse(400, null, 'This page is auto-generated and cannot be edited.')
    }

    const title = payload?.title?.trim()
    if (!title) return apiResponse(400, null, 'Title is required')

    const updatePayload = {
      slug,
      title,
      seo_title: payload?.seo_title?.trim() || null,
      seo_description: payload?.seo_description?.trim() || null,
      content_html: payload?.content_html || '',
      content_json: payload?.content_json || null,
    }

    const { data, error } = await admin
      .from('static_pages')
      .upsert(updatePayload, { onConflict: 'slug' })
      .select('slug, title, seo_title, seo_description, content_html, content_json, updated_at')
      .single()

    if (error) return apiResponse(400, null, error.message)

    return apiResponse(200, { page: mergeStaticPage(definition, data) })
  } catch (error) {
    if (error.name === 'AuthError') {
      const status = error.message.includes('Admin') ? 403 : 401
      return apiResponse(status, null, error.message)
    }
    return apiResponse(500, null, error.message || 'Failed to update static page')
  }
}

export async function DELETE(request) {
  try {
    await requireAdmin()
    const admin = await createClient()
    const payload = await request.json()
    const slug = payload?.slug?.trim()

    if (!slug) return apiResponse(400, null, 'Slug is required')
    if (!STATIC_PAGE_SLUGS.has(slug)) return apiResponse(400, null, 'Invalid static page slug')

    const definition = getStaticPageDefinition(slug)
    if (definition?.editable === false) {
      return apiResponse(400, null, 'This page is auto-generated and cannot be edited.')
    }

    const { error } = await admin
      .from('static_pages')
      .delete()
      .eq('slug', slug)

    if (error) return apiResponse(400, null, error.message)
    return apiResponse(200, { deleted: true })
  } catch (error) {
    if (error.name === 'AuthError') {
      const status = error.message.includes('Admin') ? 403 : 401
      return apiResponse(status, null, error.message)
    }
    return apiResponse(500, null, error.message || 'Failed to reset static page')
  }
}
