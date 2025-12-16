-- Migration: 005_api_usage_tracking.sql
-- Description: Add API usage and cost tracking tables
-- Date: December 2025

-- ============================================
-- API USAGE & COST TRACKING
-- ============================================

-- Track every API call with cost attribution
CREATE TABLE IF NOT EXISTS api_usage (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    user_id INTEGER REFERENCES family_members(id),

    -- API identification
    provider TEXT NOT NULL CHECK (provider IN ('groq', 'cohere', 'openai', 'anthropic')),
    endpoint TEXT NOT NULL,  -- e.g., 'chat', 'embed', 'rerank'
    model TEXT NOT NULL,     -- e.g., 'llama-3.3-70b-versatile', 'embed-v4.0'

    -- Usage metrics
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    total_tokens INTEGER GENERATED ALWAYS AS (input_tokens + output_tokens) STORED,

    -- Cost tracking (in USD, stored as cents for precision)
    cost_cents INTEGER DEFAULT 0,

    -- Request metadata
    request_id UUID,
    latency_ms INTEGER,
    success BOOLEAN DEFAULT true,
    error_message TEXT,

    -- Context
    operation TEXT,  -- e.g., 'rag_query', 'embed_document', 'suggest_tags'
    metadata JSONB,

    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_api_usage_tenant ON api_usage(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_provider ON api_usage(provider, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_created ON api_usage(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_operation ON api_usage(operation, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_cost ON api_usage(cost_cents) WHERE cost_cents > 0;

-- Daily aggregated costs per tenant (for faster dashboard queries)
CREATE TABLE IF NOT EXISTS api_usage_daily (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    date DATE NOT NULL,
    provider TEXT NOT NULL,
    endpoint TEXT NOT NULL,

    -- Aggregated metrics
    request_count INTEGER DEFAULT 0,
    total_input_tokens INTEGER DEFAULT 0,
    total_output_tokens INTEGER DEFAULT 0,
    total_cost_cents INTEGER DEFAULT 0,
    avg_latency_ms INTEGER,
    error_count INTEGER DEFAULT 0,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(tenant_id, date, provider, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_api_usage_daily_tenant ON api_usage_daily(tenant_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_daily_date ON api_usage_daily(date DESC);

-- API pricing reference (current rates as of Dec 2025)
CREATE TABLE IF NOT EXISTS api_pricing (
    id SERIAL PRIMARY KEY,
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    endpoint TEXT NOT NULL,

    -- Pricing per 1M tokens (in cents)
    input_price_per_million_cents INTEGER NOT NULL,
    output_price_per_million_cents INTEGER NOT NULL,

    -- For flat-rate APIs (like rerank per request)
    price_per_request_cents INTEGER DEFAULT 0,

    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_to DATE,
    notes TEXT,

    created_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(provider, model, endpoint, effective_from)
);

-- Insert current pricing (as of Dec 2025)
INSERT INTO api_pricing (provider, model, endpoint, input_price_per_million_cents, output_price_per_million_cents, notes) VALUES
-- Groq (free tier, but track for when we upgrade)
('groq', 'llama-3.3-70b-versatile', 'chat', 59, 79, 'Groq Llama 3.3 70B - $0.59/M in, $0.79/M out'),
('groq', 'llama-3.1-8b-instant', 'chat', 5, 8, 'Groq Llama 3.1 8B - $0.05/M in, $0.08/M out'),

-- Cohere
('cohere', 'embed-v4.0', 'embed', 10, 0, 'Cohere Embed v4 - $0.10/M tokens'),
('cohere', 'rerank-v3.5', 'rerank', 0, 0, 'Cohere Rerank v3.5 - $2/1000 searches'),
('cohere', 'command-r-08-2024', 'chat', 150, 600, 'Cohere Command-R - $0.15/M in, $0.60/M out'),
('cohere', 'command-r-plus-08-2024', 'chat', 250, 1000, 'Cohere Command-R+ - $0.25/M in, $1.00/M out')
ON CONFLICT (provider, model, endpoint, effective_from) DO NOTHING;

-- Update rerank to use per-request pricing
UPDATE api_pricing SET price_per_request_cents = 0 WHERE model = 'rerank-v3.5';
-- Rerank is actually $2/1000 searches = $0.002 per search = 0.2 cents
-- We'll track this differently in the code

-- View: Daily costs summary
CREATE OR REPLACE VIEW api_costs_daily AS
SELECT
    date,
    tenant_id,
    SUM(request_count) as total_requests,
    SUM(total_input_tokens) as total_input_tokens,
    SUM(total_output_tokens) as total_output_tokens,
    SUM(total_cost_cents) as total_cost_cents,
    SUM(total_cost_cents)::NUMERIC / 100 as total_cost_usd
FROM api_usage_daily
GROUP BY date, tenant_id
ORDER BY date DESC, tenant_id;

-- View: Monthly costs by provider
CREATE OR REPLACE VIEW api_costs_monthly AS
SELECT
    DATE_TRUNC('month', date)::DATE as month,
    tenant_id,
    provider,
    SUM(request_count) as total_requests,
    SUM(total_cost_cents) as total_cost_cents,
    SUM(total_cost_cents)::NUMERIC / 100 as total_cost_usd
FROM api_usage_daily
GROUP BY DATE_TRUNC('month', date), tenant_id, provider
ORDER BY month DESC, tenant_id, provider;

-- View: System-wide costs (for admin)
CREATE OR REPLACE VIEW api_costs_system AS
SELECT
    DATE_TRUNC('month', date)::DATE as month,
    provider,
    endpoint,
    SUM(request_count) as total_requests,
    SUM(total_input_tokens) as total_input_tokens,
    SUM(total_output_tokens) as total_output_tokens,
    SUM(total_cost_cents) as total_cost_cents,
    SUM(total_cost_cents)::NUMERIC / 100 as total_cost_usd
FROM api_usage_daily
GROUP BY DATE_TRUNC('month', date), provider, endpoint
ORDER BY month DESC, provider, endpoint;

-- Function to aggregate daily usage (run at end of day or on-demand)
CREATE OR REPLACE FUNCTION aggregate_api_usage_daily(target_date DATE DEFAULT CURRENT_DATE)
RETURNS INTEGER AS $$
DECLARE
    rows_inserted INTEGER;
BEGIN
    INSERT INTO api_usage_daily (
        tenant_id, date, provider, endpoint,
        request_count, total_input_tokens, total_output_tokens,
        total_cost_cents, avg_latency_ms, error_count
    )
    SELECT
        tenant_id,
        target_date,
        provider,
        endpoint,
        COUNT(*) as request_count,
        SUM(input_tokens) as total_input_tokens,
        SUM(output_tokens) as total_output_tokens,
        SUM(cost_cents) as total_cost_cents,
        AVG(latency_ms)::INTEGER as avg_latency_ms,
        COUNT(*) FILTER (WHERE NOT success) as error_count
    FROM api_usage
    WHERE DATE(created_at) = target_date
    GROUP BY tenant_id, provider, endpoint
    ON CONFLICT (tenant_id, date, provider, endpoint)
    DO UPDATE SET
        request_count = EXCLUDED.request_count,
        total_input_tokens = EXCLUDED.total_input_tokens,
        total_output_tokens = EXCLUDED.total_output_tokens,
        total_cost_cents = EXCLUDED.total_cost_cents,
        avg_latency_ms = EXCLUDED.avg_latency_ms,
        error_count = EXCLUDED.error_count,
        updated_at = NOW();

    GET DIAGNOSTICS rows_inserted = ROW_COUNT;
    RETURN rows_inserted;
END;
$$ LANGUAGE plpgsql;

-- Log this migration
INSERT INTO system_logs (level, category, message, metadata)
VALUES ('info', 'system', 'Applied migration 005_api_usage_tracking', '{"version": "005"}');
