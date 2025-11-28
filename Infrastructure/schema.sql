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

-- Family members table for authentication and user management
CREATE TABLE family_members (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
    password_hash TEXT,
    avatar_url TEXT,
    family_id TEXT NOT NULL DEFAULT 'default',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_active TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,

    -- Invite system
    invite_token TEXT UNIQUE,
    invite_expires TIMESTAMP,
    invited_by INTEGER REFERENCES family_members(id),

    -- Security
    failed_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP
);

-- Indexes for family_members
CREATE INDEX idx_family_members_email ON family_members(email);
CREATE INDEX idx_family_members_family_id ON family_members(family_id);
CREATE INDEX idx_family_members_invite_token ON family_members(invite_token) WHERE invite_token IS NOT NULL;

-- Refresh tokens table for JWT session management
CREATE TABLE refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES family_members(id) ON DELETE CASCADE,
    token_hash TEXT UNIQUE NOT NULL,
    device_info TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP
);

-- Index for token lookup
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id, revoked_at);
CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash) WHERE revoked_at IS NULL;

-- ============================================
-- ANALYTICS & MONITORING TABLES (May 2025)
-- ============================================

-- System event logging (replaces need for ELK)
-- Structured logs for errors, warnings, and important events
CREATE TABLE system_logs (
    id SERIAL PRIMARY KEY,
    level TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error', 'fatal')),
    category TEXT NOT NULL,       -- 'api', 'auth', 'query', 'system', 'health'
    message TEXT NOT NULL,
    metadata JSONB,               -- Stack traces, request context, extra data
    user_id INTEGER REFERENCES family_members(id),
    session_id UUID,              -- Link to conversation if applicable
    ip_address TEXT,              -- For security auditing (anonymize for privacy)
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for log querying
CREATE INDEX idx_system_logs_level ON system_logs(level, created_at DESC);
CREATE INDEX idx_system_logs_category ON system_logs(category, created_at DESC);
CREATE INDEX idx_system_logs_created ON system_logs(created_at DESC);
CREATE INDEX idx_system_logs_user ON system_logs(user_id, created_at DESC) WHERE user_id IS NOT NULL;

-- Model selection tracking for cost optimization
-- Tracks which model was selected and why, for threshold tuning
CREATE TABLE model_usage (
    id SERIAL PRIMARY KEY,
    session_id UUID,              -- Link to conversation
    query_length INTEGER,         -- Number of tokens in query
    model_selected TEXT NOT NULL, -- 'command-r' or 'command-a-03-2025'
    selection_reason TEXT,        -- 'high_relevance', 'low_relevance', 'fallback'
    top_relevance FLOAT,          -- Relevance score that triggered selection
    avg_relevance FLOAT,          -- Average of top 3 docs
    response_tokens INTEGER,      -- Output token count
    latency_ms INTEGER,           -- Response time
    user_rating INTEGER CHECK (user_rating BETWEEN 1 AND 5), -- Optional feedback
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for model usage analysis
CREATE INDEX idx_model_usage_model ON model_usage(model_selected, created_at DESC);
CREATE INDEX idx_model_usage_relevance ON model_usage(top_relevance);
CREATE INDEX idx_model_usage_created ON model_usage(created_at DESC);

-- Health check history for uptime monitoring
CREATE TABLE health_checks (
    id SERIAL PRIMARY KEY,
    service TEXT NOT NULL,        -- 'windmill', 'postgres', 'cohere_embed', 'cohere_chat', 'cohere_rerank'
    status TEXT NOT NULL CHECK (status IN ('up', 'down', 'degraded')),
    response_time_ms INTEGER,
    error_message TEXT,
    metadata JSONB,               -- Additional diagnostic info
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for health monitoring
CREATE INDEX idx_health_checks_service ON health_checks(service, created_at DESC);
CREATE INDEX idx_health_checks_status ON health_checks(status, created_at DESC);
CREATE INDEX idx_health_checks_created ON health_checks(created_at DESC);

-- Retention policy helper view (for data cleanup jobs)
CREATE OR REPLACE VIEW logs_retention_summary AS
SELECT
    'system_logs' as table_name,
    COUNT(*) as row_count,
    MIN(created_at) as oldest_record,
    MAX(created_at) as newest_record,
    pg_size_pretty(pg_total_relation_size('system_logs')) as table_size
UNION ALL
SELECT
    'model_usage',
    COUNT(*),
    MIN(created_at),
    MAX(created_at),
    pg_size_pretty(pg_total_relation_size('model_usage'))
FROM model_usage
UNION ALL
SELECT
    'health_checks',
    COUNT(*),
    MIN(created_at),
    MAX(created_at),
    pg_size_pretty(pg_total_relation_size('health_checks'))
FROM health_checks;

-- Privacy-conscious aggregation view (no PII exposed)
CREATE OR REPLACE VIEW model_usage_stats AS
SELECT
    DATE(created_at) as date,
    model_selected,
    COUNT(*) as query_count,
    AVG(top_relevance)::NUMERIC(4,3) as avg_relevance,
    AVG(latency_ms)::INTEGER as avg_latency_ms,
    AVG(response_tokens)::INTEGER as avg_response_tokens,
    COUNT(CASE WHEN user_rating >= 4 THEN 1 END) as positive_ratings,
    COUNT(CASE WHEN user_rating <= 2 THEN 1 END) as negative_ratings
FROM model_usage
GROUP BY DATE(created_at), model_selected
ORDER BY date DESC, model_selected;
