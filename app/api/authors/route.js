import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { apiResponse, logger } from '@/lib/api-utils'
import { validateAuthor, ValidationError } from '@/lib/validation'
import { requireAuth, requireAdmin } from '@/lib/auth-utils'

function getPaging(url) {
    const search = new URL(url).searchParams
    const page = Math.max(1, Number.parseInt(search.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, Number.parseInt(search.get('limit') || '20', 10)))
    const from = (page - 1) * limit
    const to = from + limit - 1
    return { page, limit, from, to }
}

export async function GET(request) {
    const requestId = 'GET-authors'

    try {
        await requireAdmin()
        const admin = createAdminClient()
        const url = new URL(request.url)
        const authorId = url.searchParams.get('id')

        if (authorId) {
            const { data: author, error } = await admin
                .from('authors')
                .select('id, name, slug, bio, title, email, avatar_url, social_links, user_id, users(email, role)')
                .eq('id', authorId)
                .maybeSingle()

            if (error) {
                logger.error(`[${requestId}] Database error`, error)
                return apiResponse(400, null, error.message)
            }

            return apiResponse(200, { author: author || null })
        }

        const { page, limit, from, to } = getPaging(request.url)
        const { data: authors, count, error } = await admin
            .from('authors')
            .select('id, name, slug, bio, title, email, avatar_url, social_links, user_id, users(email, role)', { count: 'exact' })
            .order('name')
            .range(from, to)

        if (error) {
            logger.error(`[${requestId}] Database error`, error)
            return apiResponse(400, null, error.message)
        }

        return apiResponse(200, {
            authors: authors || [],
            pagination: {
                page,
                limit,
                total: count || 0,
                pages: Math.ceil((count || 0) / limit),
            },
        })
    } catch (error) {
        if (error.name === 'AuthError') {
            const status = error.message.includes('Admin') ? 403 : 401
            return apiResponse(status, null, error.message)
        }

        logger.error(requestId, error)
        return apiResponse(500, null, 'Internal server error')
    }
}

export async function POST(request) {
    const requestId = 'POST-author'

    try {
        // 1. Authenticate
        const user = await requireAuth()
        logger.info(`[${requestId}] User authenticated`, { userId: user.userId })

        // 2. Parse & validate
        const authorData = await request.json()
        validateAuthor(authorData)

        // 3. Create author with user_id
        const supabase = await createClient()
        const { data: author, error } = await supabase
            .from('authors')
            .insert([{
                ...authorData,
                user_id: user.userId,
            }])
            .select('id, name, slug, bio, title, email, avatar_url, social_links, user_id')
            .single()

        if (error) {
            logger.error(`[${requestId}] Database error`, error)
            return apiResponse(400, null, error.message)
        }

        logger.info(`[${requestId}] Author created`, { authorId: author.id })
        return apiResponse(201, { author })
    } catch (error) {
        if (error.name === 'ValidationError') {
            return apiResponse(422, null, error.message)
        }
        if (error.name === 'AuthError') {
            return apiResponse(401, null, error.message)
        }

        logger.error(requestId, error)
        return apiResponse(500, null, 'Internal server error')
    }
}

export async function PATCH(request) {
    const requestId = 'PATCH-author'

    try {
        // 1. Authenticate (admin or owner)
        const user = await requireAuth()
        logger.info(`[${requestId}] User authenticated`, { userId: user.userId })

        // 2. Parse & validate
        const { id, ...updateData } = await request.json()
        if (!id) {
            return apiResponse(400, null, 'Author ID is required')
        }
        validateAuthor(updateData)

        // 3. Check permission (admin or owner)
        const supabase = await createClient()
        const { data: existingAuthor, error: fetchError } = await supabase
            .from('authors')
            .select('id, user_id')
            .eq('id', id)
            .maybeSingle()

        if (fetchError || !existingAuthor) {
            return apiResponse(404, null, 'Author not found')
        }

        const isOwner = existingAuthor.user_id === user.userId
        if (user.role !== 'admin' && !isOwner) {
            return apiResponse(403, null, 'You do not have permission to update this author')
        }

        // 4. Update
        const { data: author, error } = await supabase
            .from('authors')
            .update(updateData)
            .eq('id', id)
            .select('id, name, slug, bio, title, email, avatar_url, social_links, user_id')
            .maybeSingle()

        if (error) {
            logger.error(`[${requestId}] Database error`, error)
            return apiResponse(400, null, error.message)
        }

        logger.info(`[${requestId}] Author updated`, { authorId: id })

        const authorSlug = author?.slug || id
        revalidatePath(`/authors/${authorSlug}`)

        const { data: articleRows } = await supabase
            .from('articles')
            .select('slug, categories(slug)')
            .eq('author_id', id)
            .eq('status', 'published')
            .limit(200)

        ;(articleRows || []).forEach((row) => {
            const categorySlug = row.categories?.slug || 'news'
            revalidatePath(`/${categorySlug}/${row.slug}`)
        })

        return apiResponse(200, { author })
    } catch (error) {
        if (error.name === 'ValidationError') {
            return apiResponse(422, null, error.message)
        }
        if (error.name === 'AuthError') {
            return apiResponse(401, null, error.message)
        }

        logger.error(requestId, error)
        return apiResponse(500, null, 'Internal server error')
    }
}

export async function DELETE(request) {
    const requestId = 'DELETE-author'

    try {
        // 1. Require admin
        const user = await requireAdmin()
        logger.info(`[${requestId}] Admin authenticated`, { userId: user.userId })

        // 2. Get ID
        const { id } = await request.json()
        if (!id) {
            return apiResponse(400, null, 'Author ID is required')
        }

        // 3. Delete
        const supabase = await createClient()
        const { error } = await supabase
            .from('authors')
            .delete()
            .eq('id', id)

        if (error) {
            logger.error(`[${requestId}] Database error`, error)
            return apiResponse(400, null, error.message)
        }

        logger.info(`[${requestId}] Author deleted`, { authorId: id })
        return apiResponse(200, { success: true })
    } catch (error) {
        if (error.name === 'AuthError') {
            const status = error.message.includes('Admin') ? 403 : 401
            return apiResponse(status, null, error.message)
        }

        logger.error(requestId, error)
        return apiResponse(500, null, 'Internal server error')
    }
}



