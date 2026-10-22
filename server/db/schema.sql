-- MumzAssist.A PostgreSQL Schema
-- Normalized relational schema with strict constraints, foreign keys, and indexes

CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(64),
    preferred_language VARCHAR(32) DEFAULT 'English',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS knowledge_base_articles (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(64) NOT NULL,
    supported_languages JSONB NOT NULL DEFAULT '["English"]'::jsonb,
    content TEXT NOT NULL,
    keywords JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agents (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(64) NOT NULL DEFAULT 'Support Specialist',
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tickets (
    id VARCHAR(64) PRIMARY KEY,
    customer_id VARCHAR(64) REFERENCES customers(id) ON DELETE SET NULL,
    original_message TEXT NOT NULL,
    detected_language VARCHAR(32) NOT NULL DEFAULT 'English',
    selected_language VARCHAR(32),
    category VARCHAR(64) NOT NULL DEFAULT 'General inquiry',
    priority VARCHAR(32) NOT NULL DEFAULT 'Medium',
    sentiment VARCHAR(32) NOT NULL DEFAULT 'neutral',
    status VARCHAR(32) NOT NULL DEFAULT 'open',
    summary TEXT NOT NULL DEFAULT '',
    assigned_agent_id VARCHAR(64) REFERENCES agents(id) ON DELETE SET NULL,
    requires_human_review BOOLEAN NOT NULL DEFAULT FALSE,
    review_reason TEXT,
    suggested_response TEXT,
    response_status VARCHAR(32) NOT NULL DEFAULT 'draft', -- draft, approved, edited, rejected
    first_responded_at TIMESTAMPTZ,
    triage_status VARCHAR(32) NOT NULL DEFAULT 'completed', -- pending, processing, completed, failed, pending_retry
    idempotency_key VARCHAR(128),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Schema migration helpers for existing databases
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS triage_status VARCHAR(32) NOT NULL DEFAULT 'completed';
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(128);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tickets_idempotency ON tickets(idempotency_key) WHERE idempotency_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS ticket_analyses (
    id VARCHAR(64) PRIMARY KEY,
    ticket_id VARCHAR(64) NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    detected_language VARCHAR(32) NOT NULL,
    category VARCHAR(64) NOT NULL,
    priority VARCHAR(32) NOT NULL,
    sentiment VARCHAR(32) NOT NULL,
    intent TEXT NOT NULL,
    key_entities JSONB NOT NULL DEFAULT '{}'::jsonb,
    recommended_action TEXT NOT NULL,
    suggested_response TEXT NOT NULL,
    confidence NUMERIC(4, 2) NOT NULL DEFAULT 0.85,
    uncertainty_explanation TEXT,
    requires_human_review BOOLEAN NOT NULL DEFAULT FALSE,
    review_reason TEXT,
    supporting_article_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    model_version VARCHAR(64) NOT NULL DEFAULT 'gemini-3.8-flash',
    raw_output JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ticket_article_references (
    id VARCHAR(64) PRIMARY KEY,
    ticket_id VARCHAR(64) NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    article_id VARCHAR(64) NOT NULL REFERENCES knowledge_base_articles(id) ON DELETE CASCADE,
    relevance_score NUMERIC(4, 2) NOT NULL DEFAULT 1.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ticket_events (
    id VARCHAR(64) PRIMARY KEY,
    ticket_id VARCHAR(64) NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    event_type VARCHAR(64) NOT NULL, -- created, analyzed, status_changed, assigned, response_approved, response_edited, escalated, human_review_flagged
    description TEXT NOT NULL,
    actor VARCHAR(128) NOT NULL DEFAULT 'System (AI)',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Optimized indexes for fast queries, filtering, and reporting
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_category ON tickets(category);
CREATE INDEX IF NOT EXISTS idx_tickets_language ON tickets(detected_language);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_human_review ON tickets(requires_human_review);
CREATE INDEX IF NOT EXISTS idx_analyses_ticket_id ON ticket_analyses(ticket_id);
CREATE INDEX IF NOT EXISTS idx_events_ticket_id ON ticket_events(ticket_id);
CREATE INDEX IF NOT EXISTS idx_kb_category ON knowledge_base_articles(category);
CREATE INDEX IF NOT EXISTS idx_kb_active ON knowledge_base_articles(is_active);
