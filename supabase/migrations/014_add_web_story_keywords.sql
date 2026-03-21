ALTER TABLE public.web_stories
ADD COLUMN IF NOT EXISTS keywords TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

CREATE INDEX IF NOT EXISTS idx_web_stories_keywords_gin
ON public.web_stories
USING GIN (keywords);
