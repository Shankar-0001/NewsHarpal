-- Align article/media schema with the dashboard publish flow.
ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS canonical_url TEXT,
  ADD COLUMN IF NOT EXISTS schema_type TEXT NOT NULL DEFAULT 'NewsArticle',
  ADD COLUMN IF NOT EXISTS structured_data JSONB;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'articles_schema_type_check'
  ) THEN
    ALTER TABLE public.articles
      ADD CONSTRAINT articles_schema_type_check
      CHECK (schema_type IN ('NewsArticle', 'BlogPosting'));
  END IF;
END $$;

ALTER TABLE public.media_library
  ADD COLUMN IF NOT EXISTS file_path TEXT,
  ADD COLUMN IF NOT EXISTS original_width INTEGER,
  ADD COLUMN IF NOT EXISTS original_height INTEGER;
