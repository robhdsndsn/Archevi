-- Family Second Brain Database Schema
-- PostgreSQL with pgvector extension

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Family documents table with vector embeddings
CREATE TABLE family_documents (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL, -- 'recipes', 'medical', 'financial', 'family_history', 'general'
    source_file TEXT,        -- Original filename if uploaded
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by TEXT,         -- User who added it
    embedding vector(1024)   -- Cohere embed-english-v3.0 dimension
);

-- Create HNSW index for fast similarity search
CREATE INDEX ON family_documents
USING hnsw (embedding vector_cosine_ops);

-- Create regular indexes
CREATE INDEX idx_documents_category ON family_documents(category);
CREATE INDEX idx_documents_created_at ON family_documents(created_at DESC);

-- Conversation history table
CREATE TABLE conversations (
    id SERIAL PRIMARY KEY,
    session_id UUID NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    sources JSONB,           -- Array of source document IDs and snippets
    created_at TIMESTAMP DEFAULT NOW(),
    user_email TEXT
);

-- Indexes for conversation retrieval
CREATE INDEX idx_conversations_session ON conversations(session_id, created_at);
CREATE INDEX idx_conversations_user ON conversations(user_email, created_at DESC);

-- Document metadata for tracking uploads
CREATE TABLE document_metadata (
    id SERIAL PRIMARY KEY,
    document_id INTEGER REFERENCES family_documents(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    value TEXT,
    UNIQUE(document_id, key)
);

-- Usage tracking (optional, for monitoring costs)
CREATE TABLE api_usage_log (
    id SERIAL PRIMARY KEY,
    operation TEXT NOT NULL, -- 'embed', 'rerank', 'generate'
    tokens_used INTEGER,
    cost_usd DECIMAL(10, 6),
    created_at TIMESTAMP DEFAULT NOW()
);
