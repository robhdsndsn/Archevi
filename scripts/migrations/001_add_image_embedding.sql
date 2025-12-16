-- Migration: Add image embedding support to family_documents
-- Date: 2025-12-05
-- Feature: 8a0 - Image embedding and photo search (lean approach)

-- Add image_embedding column for visual search
-- Using same dimension as text embedding (1024) for Cohere Embed v4
ALTER TABLE family_documents
ADD COLUMN IF NOT EXISTS image_embedding vector(1024);

-- Add flag to track if document has visual search enabled
ALTER TABLE family_documents
ADD COLUMN IF NOT EXISTS has_image_embedding BOOLEAN DEFAULT FALSE;

-- Add image_url to store the original image (for display)
ALTER TABLE family_documents
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add content_type to distinguish text vs image documents
ALTER TABLE family_documents
ADD COLUMN IF NOT EXISTS content_type VARCHAR(20) DEFAULT 'text';

-- Create HNSW index for image embedding similarity search
CREATE INDEX IF NOT EXISTS idx_documents_image_embedding
ON family_documents USING hnsw (image_embedding vector_cosine_ops)
WHERE image_embedding IS NOT NULL;

-- Add comment explaining the columns
COMMENT ON COLUMN family_documents.image_embedding IS 'Cohere Embed v4 image embedding for visual search (opt-in)';
COMMENT ON COLUMN family_documents.has_image_embedding IS 'True if user enabled visual search for this document';
COMMENT ON COLUMN family_documents.image_url IS 'Base64 data URL or storage path for the original image';
COMMENT ON COLUMN family_documents.content_type IS 'text, image, or mixed (text document with image attachment)';
