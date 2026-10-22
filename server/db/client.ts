import { PGlite } from '@electric-sql/pglite';
import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Pool } = pg;

export interface QueryResult<T = any> {
  rows: T[];
  rowCount?: number;
}

export interface DbClient {
  query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>>;
  close(): Promise<void>;
  isHosted: boolean;
  isNeon: boolean;
  provider: string;
  databaseName: string;
  connectionError: string | null;
  connectedAt: string;
}

let dbInstance: DbClient | null = null;
let lastConnectionError: string | null = null;

export async function getDb(): Promise<DbClient> {
  if (dbInstance) return dbInstance;

  const databaseUrl = process.env.DATABASE_URL;

  if (
    databaseUrl &&
    databaseUrl.trim().length > 0 &&
    !databaseUrl.includes('placeholder') &&
    !databaseUrl.includes('mock')
  ) {
    const isNeonHost = databaseUrl.includes('neon.tech');
    const providerName = isNeonHost ? 'Neon PostgreSQL' : 'Hosted PostgreSQL';
    console.log(`[Database] Attempting connection to ${providerName}...`);

    try {
      const pool = new Pool({
        connectionString: databaseUrl,
        ssl: databaseUrl.includes('localhost') ? false : { rejectUnauthorized: false },
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 8000,
      });

      // Verify connection and get database name
      const checkRes = await pool.query('SELECT current_database() as db, version() as ver');
      const dbName = checkRes.rows[0]?.db || 'postgres';
      console.log(`[Database] Successfully connected to ${providerName} (Database: ${dbName}).`);

      dbInstance = {
        query: async <T = any>(text: string, params?: any[]): Promise<QueryResult<T>> => {
          const res = await pool.query(text, params);
          return { rows: res.rows as T[], rowCount: res.rowCount ?? 0 };
        },
        close: async () => {
          await pool.end();
          dbInstance = null;
        },
        isHosted: true,
        isNeon: isNeonHost,
        provider: providerName,
        databaseName: dbName,
        connectionError: null,
        connectedAt: new Date().toISOString(),
      };

      await runMigrations(dbInstance);
      return dbInstance;
    } catch (err: any) {
      lastConnectionError = err.message || 'Connection failed';
      console.warn(`[Database] Failed to connect to ${providerName} (${err.message}). Falling back to local embedded PostgreSQL.`);
    }
  }

  // Embedded PostgreSQL instance powered by PGlite (local development & hermetic evaluation)
  console.log('[Database] Initializing local embedded PostgreSQL engine (PGlite)...');
  let pglite: PGlite;
  try {
    const dataDir = path.resolve(process.cwd(), '.pglite_data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    pglite = new PGlite(dataDir);
    await pglite.waitReady;
    console.log('[Database] Embedded PostgreSQL engine ready (disk persistence).');
  } catch (err: any) {
    console.warn('[Database] Disk PGlite locked or unavailable, initializing in-memory PostgreSQL engine:', err.message);
    pglite = new PGlite();
    await pglite.waitReady;
    console.log('[Database] Embedded PostgreSQL engine ready (in-memory mode).');
  }

  dbInstance = {
    query: async <T = any>(text: string, params?: any[]): Promise<QueryResult<T>> => {
      const res = await pglite.query<T>(text, params);
      return {
        rows: res.rows,
        rowCount: res.rows?.length ?? 0,
      };
    },
    close: async () => {
      await pglite.close();
      dbInstance = null;
    },
    isHosted: false,
    isNeon: false,
    provider: 'Embedded PostgreSQL (PGlite)',
    databaseName: 'mumzassist_local',
    connectionError: lastConnectionError,
    connectedAt: new Date().toISOString(),
  };

  await runMigrations(dbInstance);
  return dbInstance;
}

export const EMBEDDED_SCHEMA_SQL = `
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
    response_status VARCHAR(32) NOT NULL DEFAULT 'draft',
    first_responded_at TIMESTAMPTZ,
    triage_status VARCHAR(32) NOT NULL DEFAULT 'completed',
    idempotency_key VARCHAR(128),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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
    event_type VARCHAR(64) NOT NULL,
    description TEXT NOT NULL,
    actor VARCHAR(128) NOT NULL DEFAULT 'System (AI)',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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
`;

export async function runMigrations(db: DbClient): Promise<void> {
  const schemaPath = path.resolve(process.cwd(), 'server/db/schema.sql');
  let schemaSql = EMBEDDED_SCHEMA_SQL;

  if (fs.existsSync(schemaPath)) {
    try {
      schemaSql = fs.readFileSync(schemaPath, 'utf-8');
    } catch {
      schemaSql = EMBEDDED_SCHEMA_SQL;
    }
  }
  
  const statements = schemaSql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const statement of statements) {
    try {
      await db.query(statement);
    } catch (err: any) {
      if (!err.message?.includes('already exists') && !err.message?.includes('duplicate key')) {
        console.warn(`[Database Migration warning] ${err.message}`);
      }
    }
  }
  console.log('[Database] Relational migrations verified and applied successfully.');
}

// Live database diagnostics
export async function getDatabaseStatus() {
  const db = await getDb();
  let livePingSuccess = false;
  let latencyMs = 0;
  let tableCount = 0;

  try {
    const t0 = performance.now();
    const pingRes = await db.query('SELECT 1 as ping, current_database() as db, COUNT(*) as tbl_count FROM information_schema.tables WHERE table_schema = $1', ['public']);
    latencyMs = Math.round(performance.now() - t0);
    livePingSuccess = pingRes.rowCount !== undefined && pingRes.rowCount > 0;
    tableCount = parseInt(pingRes.rows[0]?.tbl_count || '0', 10);
  } catch (err) {
    livePingSuccess = false;
  }

  return {
    isHosted: db.isHosted,
    isNeon: db.isNeon,
    provider: db.provider,
    databaseName: db.databaseName,
    connectionError: db.connectionError,
    livePing: livePingSuccess,
    latencyMs,
    tableCount,
    hasDatabaseUrlConfigured: Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length > 0),
    isConfiguredForNeon: Boolean(process.env.DATABASE_URL?.includes('neon.tech')),
  };
}
