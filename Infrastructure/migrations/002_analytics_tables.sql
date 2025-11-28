-- Migration: 002_analytics_tables.sql
-- Description: Add analytics and monitoring tables
-- Date: May 2025

-- ============================================
-- ANALYTICS & MONITORING TABLES
-- ============================================

-- System event logging (replaces need for ELK)
CREATE TABLE IF NOT EXISTS system_logs (
    id SERIAL PRIMARY KEY,
    level TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error', 'fatal')),
    category TEXT NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB,
    user_id INTEGER REFERENCES family_members(id),
    session_id UUID,
    ip_address TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for log querying
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_category ON system_logs(category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_created ON system_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_user ON system_logs(user_id, created_at DESC) WHERE user_id IS NOT NULL;

-- Model selection tracking for cost optimization
CREATE TABLE IF NOT EXISTS model_usage (
    id SERIAL PRIMARY KEY,
    session_id UUID,
    query_length INTEGER,
    model_selected TEXT NOT NULL,
    selection_reason TEXT,
    top_relevance FLOAT,
    avg_relevance FLOAT,
    response_tokens INTEGER,
    latency_ms INTEGER,
    user_rating INTEGER CHECK (user_rating BETWEEN 1 AND 5),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for model usage analysis
CREATE INDEX IF NOT EXISTS idx_model_usage_model ON model_usage(model_selected, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_model_usage_relevance ON model_usage(top_relevance);
CREATE INDEX IF NOT EXISTS idx_model_usage_created ON model_usage(created_at DESC);

-- Health check history
CREATE TABLE IF NOT EXISTS health_checks (
    id SERIAL PRIMARY KEY,
    service TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('up', 'down', 'degraded')),
    response_time_ms INTEGER,
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for health monitoring
CREATE INDEX IF NOT EXISTS idx_health_checks_service ON health_checks(service, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_health_checks_status ON health_checks(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_health_checks_created ON health_checks(created_at DESC);

-- Views for analytics
CREATE OR REPLACE VIEW logs_retention_summary AS
SELECT
    'system_logs' as table_name,
    COUNT(*) as row_count,
    MIN(created_at) as oldest_record,
    MAX(created_at) as newest_record,
    pg_size_pretty(pg_total_relation_size('system_logs')) as table_size
FROM system_logs
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

-- Log this migration
INSERT INTO system_logs (level, category, message, metadata)
VALUES ('info', 'system', 'Applied migration 002_analytics_tables', '{"version": "002"}');
