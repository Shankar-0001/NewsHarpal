-- Add archived status to article_status enum
ALTER TYPE article_status ADD VALUE IF NOT EXISTS 'archived';
