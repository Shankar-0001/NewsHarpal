-- Add alt text for featured images (accessibility/SEO)
ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS featured_image_alt TEXT;
