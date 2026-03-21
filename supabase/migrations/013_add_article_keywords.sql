ALTER TABLE public.articles
ADD COLUMN IF NOT EXISTS keywords TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

CREATE INDEX IF NOT EXISTS idx_articles_keywords_gin
ON public.articles
USING GIN (keywords);
