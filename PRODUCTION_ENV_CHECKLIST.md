# Production Environment Checklist

Use this checklist before deploying to the main server.

## Domain & URLs
- [ ] `NEXT_PUBLIC_BASE_URL` is set to `https://ekahnews.com`
- [ ] No preview/localhost URLs appear in CMS content
- [ ] Custom domain is connected and SSL is active

## Supabase Configuration
- [ ] `NEXT_PUBLIC_SUPABASE_URL` set to production project
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` set to production key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` set (server-only, not exposed)
- [ ] `static_pages` migration applied (010)
- [ ] `archived` status migration applied (011)
- [ ] RLS enabled on all public tables
- [ ] Admin user exists in `public.users` with role = `admin`

## Storage
- [ ] `media` bucket exists and is public
- [ ] Storage policies applied for upload/read/delete

## Ads
- [ ] `NEXT_PUBLIC_ADS_ENABLED` set to `true` (if running ads)
- [ ] `NEXT_PUBLIC_ADSENSE_CLIENT_ID` set to real AdSense ID
- [ ] Ad slots replaced with production IDs

## SEO & Crawlability
- [ ] `/sitemap.xml` accessible
- [ ] `/news-sitemap.xml` accessible
- [ ] `/article-sitemap.xml` accessible
- [ ] `/category-sitemap.xml` accessible
- [ ] `/topic-sitemap.xml` accessible
- [ ] `/web-stories-sitemap.xml` accessible
- [ ] `/robots.txt` accessible and references correct domain

## Build & Runtime
- [ ] `npm run build` succeeds
- [ ] `npm run start` succeeds
- [ ] Homepage, article page, and dashboard load without errors

## Monitoring & Backups
- [ ] Error tracking enabled (Sentry or equivalent)
- [ ] DB backups enabled in Supabase

