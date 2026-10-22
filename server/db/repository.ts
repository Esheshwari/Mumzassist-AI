import { DbClient, getDb } from './client.js';

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  preferred_language: string;
  created_at: string;
}

export interface KnowledgeBaseArticle {
  id: string;
  title: string;
  category: string;
  supported_languages: string[];
  content: string;
  keywords: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar_url?: string;
  created_at: string;
}

export interface Ticket {
  id: string;
  customer_id: string;
  customer_name?: string;
  customer_email?: string;
  original_message: string;
  detected_language: string;
  selected_language?: string;
  category: string;
  priority: string;
  sentiment: string;
  status: 'open' | 'in_progress' | 'waiting_for_customer' | 'resolved' | 'escalated';
  summary: string;
  assigned_agent_id?: string | null;
  assigned_agent_name?: string;
  requires_human_review: boolean;
  review_reason?: string | null;
  suggested_response?: string;
  response_status: 'draft' | 'approved' | 'edited' | 'rejected';
  first_responded_at?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
  analyses?: TicketAnalysis[];
  article_references?: KnowledgeBaseArticle[];
  events?: TicketEvent[];
}

export interface TicketAnalysis {
  id: string;
  ticket_id: string;
  detected_language: string;
  category: string;
  priority: string;
  sentiment: string;
  intent: string;
  key_entities: Record<string, any>;
  recommended_action: string;
  suggested_response: string;
  confidence: number;
  uncertainty_explanation?: string;
  requires_human_review: boolean;
  review_reason?: string;
  supporting_article_ids: string[];
  model_version: string;
  raw_output?: any;
  created_at: string;
}

export interface TicketEvent {
  id: string;
  ticket_id: string;
  event_type: string;
  description: string;
  actor: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface DashboardMetrics {
  totalTickets: number;
  openTickets: number;
  urgentTickets: number;
  awaitingReviewTickets: number;
  averageFirstResponseTimeMinutes: number | null;
  ticketsByCategory: { category: string; count: number }[];
  ticketsByLanguage: { language: string; count: number }[];
  priorityDistribution: { priority: string; count: number }[];
  recentActivity: TicketEvent[];
}

// Customers
export async function findOrCreateCustomer(
  name: string,
  email?: string,
  phone?: string,
  preferredLanguage: string = 'English'
): Promise<Customer> {
  const db = await getDb();
  if (email) {
    const existing = await db.query<Customer>(
      'SELECT * FROM customers WHERE email = $1 LIMIT 1',
      [email]
    );
    if (existing.rows.length > 0) {
      return existing.rows[0];
    }
  }

  const id = `CUST-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
  const insert = await db.query<Customer>(
    `INSERT INTO customers (id, name, email, phone, preferred_language)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [id, name, email || null, phone || null, preferredLanguage]
  );
  return insert.rows[0];
}

// Knowledge Base
export async function getActiveKnowledgeBaseArticles(): Promise<KnowledgeBaseArticle[]> {
  const db = await getDb();
  const res = await db.query<any>(
    'SELECT * FROM knowledge_base_articles WHERE is_active = TRUE ORDER BY title ASC'
  );
  return res.rows.map(mapKbRow);
}

export async function searchKnowledgeBaseArticles(
  queryText?: string,
  category?: string,
  language?: string
): Promise<KnowledgeBaseArticle[]> {
  const db = await getDb();
  let sql = 'SELECT * FROM knowledge_base_articles WHERE is_active = TRUE';
  const params: any[] = [];

  if (category && category !== 'All') {
    params.push(category);
    sql += ` AND category = $${params.length}`;
  }

  if (queryText && queryText.trim()) {
    const words = queryText
      .toLowerCase()
      .replace(/[^\w\s\u0600-\u06FF\u0900-\u097F]/g, ' ')
      .trim()
      .split(/\s+/)
      .filter((w) => w.length >= 2);

    if (words.length > 0) {
      const orClauses = words.map((w) => {
        params.push(`%${w}%`);
        return `(LOWER(title) LIKE $${params.length} OR LOWER(content) LIKE $${params.length} OR LOWER(keywords::text) LIKE $${params.length})`;
      });
      sql += ` AND (${orClauses.join(' OR ')})`;
    }
  }

  sql += ' ORDER BY updated_at DESC';
  const res = await db.query<any>(sql, params);
  let rows = res.rows.map(mapKbRow);

  if (language && language !== 'All') {
    rows = rows.filter(
      (a) =>
        a.supported_languages.includes(language) ||
        a.supported_languages.includes('All')
    );
  }

  return rows;
}

export async function getKnowledgeBaseArticleById(id: string): Promise<KnowledgeBaseArticle | null> {
  const db = await getDb();
  const res = await db.query<any>(
    'SELECT * FROM knowledge_base_articles WHERE id = $1',
    [id]
  );
  if (res.rows.length === 0) return null;
  return mapKbRow(res.rows[0]);
}

export async function createKnowledgeBaseArticle(data: {
  title: string;
  category: string;
  supported_languages: string[];
  content: string;
  keywords: string[];
  is_active?: boolean;
}): Promise<KnowledgeBaseArticle> {
  const db = await getDb();
  const id = `KB-${Date.now().toString(36).toUpperCase()}`;
  const res = await db.query<any>(
    `INSERT INTO knowledge_base_articles (id, title, category, supported_languages, content, keywords, is_active)
     VALUES ($1, $2, $3, $4::jsonb, $5, $6::jsonb, $7)
     RETURNING *`,
    [
      id,
      data.title,
      data.category,
      JSON.stringify(data.supported_languages || ['English']),
      data.content,
      JSON.stringify(data.keywords || []),
      data.is_active ?? true,
    ]
  );
  return mapKbRow(res.rows[0]);
}

export async function updateKnowledgeBaseArticle(
  id: string,
  data: Partial<Omit<KnowledgeBaseArticle, 'id' | 'created_at' | 'updated_at'>>
): Promise<KnowledgeBaseArticle | null> {
  const db = await getDb();
  const existing = await getKnowledgeBaseArticleById(id);
  if (!existing) return null;

  const title = data.title ?? existing.title;
  const category = data.category ?? existing.category;
  const supported_languages = data.supported_languages ?? existing.supported_languages;
  const content = data.content ?? existing.content;
  const keywords = data.keywords ?? existing.keywords;
  const is_active = data.is_active ?? existing.is_active;

  const res = await db.query<any>(
    `UPDATE knowledge_base_articles
     SET title = $1, category = $2, supported_languages = $3::jsonb, content = $4, keywords = $5::jsonb, is_active = $6, updated_at = NOW()
     WHERE id = $7
     RETURNING *`,
    [
      title,
      category,
      JSON.stringify(supported_languages),
      content,
      JSON.stringify(keywords),
      is_active,
      id,
    ]
  );
  return mapKbRow(res.rows[0]);
}

function mapKbRow(row: any): KnowledgeBaseArticle {
  return {
    ...row,
    supported_languages: typeof row.supported_languages === 'string' ? JSON.parse(row.supported_languages) : (row.supported_languages || []),
    keywords: typeof row.keywords === 'string' ? JSON.parse(row.keywords) : (row.keywords || []),
  };
}

// Agents
export async function listAgents(): Promise<Agent[]> {
  const db = await getDb();
  const res = await db.query<Agent>('SELECT * FROM agents ORDER BY name ASC');
  return res.rows;
}

// Tickets
export async function createTicket(data: {
  customer_id?: string;
  original_message: string;
  detected_language?: string;
  selected_language?: string;
  category?: string;
  priority?: string;
  sentiment?: string;
  status?: Ticket['status'];
  summary?: string;
  requires_human_review?: boolean;
  review_reason?: string;
  suggested_response?: string;
  assigned_agent_id?: string;
}): Promise<Ticket> {
  const db = await getDb();
  const countRes = await db.query<{ count: string }>('SELECT COUNT(*) as count FROM tickets');
  const nextNum = parseInt(countRes.rows[0]?.count || '0', 10) + 1001;
  const id = `TIK-${nextNum}`;

  const res = await db.query<any>(
    `INSERT INTO tickets (
      id, customer_id, original_message, detected_language, selected_language,
      category, priority, sentiment, status, summary,
      requires_human_review, review_reason, suggested_response, assigned_agent_id
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING *`,
    [
      id,
      data.customer_id || null,
      data.original_message,
      data.detected_language || 'English',
      data.selected_language || null,
      data.category || 'General inquiry',
      data.priority || 'Medium',
      data.sentiment || 'neutral',
      data.status || 'open',
      data.summary || '',
      data.requires_human_review ?? false,
      data.review_reason || null,
      data.suggested_response || null,
      data.assigned_agent_id || null,
    ]
  );

  await addTicketEvent(id, 'created', 'Ticket created and registered in triage queue.', 'Customer');
  return getTicketById(id) as Promise<Ticket>;
}

export async function getTicketById(id: string): Promise<Ticket | null> {
  const db = await getDb();
  const ticketRes = await db.query<any>(
    `SELECT t.*, c.name as customer_name, c.email as customer_email, a.name as assigned_agent_name
     FROM tickets t
     LEFT JOIN customers c ON t.customer_id = c.id
     LEFT JOIN agents a ON t.assigned_agent_id = a.id
     WHERE t.id = $1`,
    [id]
  );

  if (ticketRes.rows.length === 0) return null;
  const ticket = ticketRes.rows[0];

  // Fetch analyses history
  const analysesRes = await db.query<any>(
    'SELECT * FROM ticket_analyses WHERE ticket_id = $1 ORDER BY created_at DESC',
    [id]
  );

  const analyses: TicketAnalysis[] = analysesRes.rows.map((row) => ({
    ...row,
    confidence: Number(row.confidence),
    key_entities: typeof row.key_entities === 'string' ? JSON.parse(row.key_entities) : row.key_entities,
    supporting_article_ids: typeof row.supporting_article_ids === 'string' ? JSON.parse(row.supporting_article_ids) : row.supporting_article_ids,
  }));

  // Fetch article references
  const articlesRes = await db.query<any>(
    `SELECT kb.* 
     FROM ticket_article_references tar
     JOIN knowledge_base_articles kb ON tar.article_id = kb.id
     WHERE tar.ticket_id = $1`,
    [id]
  );
  const articleReferences = articlesRes.rows.map(mapKbRow);

  // Fetch events / audit log
  const eventsRes = await db.query<TicketEvent>(
    'SELECT * FROM ticket_events WHERE ticket_id = $1 ORDER BY created_at ASC',
    [id]
  );

  return {
    ...ticket,
    analyses,
    article_references: articleReferences,
    events: eventsRes.rows,
  };
}

export async function listTickets(options: {
  page?: number;
  pageSize?: number;
  status?: string;
  priority?: string;
  category?: string;
  language?: string;
  requiresReview?: boolean;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}): Promise<{ tickets: Ticket[]; total: number; page: number; pageSize: number; totalPages: number }> {
  const db = await getDb();
  const page = Math.max(1, options.page || 1);
  const pageSize = Math.max(1, Math.min(100, options.pageSize || 15));
  const offset = (page - 1) * pageSize;

  let whereClauses: string[] = [];
  const params: any[] = [];

  if (options.status && options.status !== 'All') {
    params.push(options.status);
    whereClauses.push(`t.status = $${params.length}`);
  }

  if (options.priority && options.priority !== 'All') {
    params.push(options.priority);
    whereClauses.push(`t.priority = $${params.length}`);
  }

  if (options.category && options.category !== 'All') {
    params.push(options.category);
    whereClauses.push(`t.category = $${params.length}`);
  }

  if (options.language && options.language !== 'All') {
    params.push(options.language);
    whereClauses.push(`t.detected_language = $${params.length}`);
  }

  if (typeof options.requiresReview === 'boolean') {
    params.push(options.requiresReview);
    whereClauses.push(`t.requires_human_review = $${params.length}`);
  }

  if (options.search && options.search.trim()) {
    params.push(`%${options.search.toLowerCase().trim()}%`);
    whereClauses.push(`(
      LOWER(t.id) LIKE $${params.length} OR 
      LOWER(t.original_message) LIKE $${params.length} OR 
      LOWER(t.summary) LIKE $${params.length} OR
      LOWER(COALESCE(c.name, '')) LIKE $${params.length}
    )`);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  // Count total
  const countRes = await db.query<{ count: string }>(
    `SELECT COUNT(*) as count 
     FROM tickets t
     LEFT JOIN customers c ON t.customer_id = c.id
     ${whereSql}`,
    params
  );
  const total = parseInt(countRes.rows[0]?.count || '0', 10);

  // Fetch paginated rows
  const orderCol = options.sortBy === 'priority' ? `CASE t.priority 
    WHEN 'Critical' THEN 1 
    WHEN 'High' THEN 2 
    WHEN 'Medium' THEN 3 
    WHEN 'Low' THEN 4 
    ELSE 5 END` : 't.created_at';
  const sortDirection = options.sortOrder || 'DESC';

  const queryParams = [...params, pageSize, offset];
  const listSql = `
    SELECT t.*, c.name as customer_name, c.email as customer_email, a.name as assigned_agent_name
    FROM tickets t
    LEFT JOIN customers c ON t.customer_id = c.id
    LEFT JOIN agents a ON t.assigned_agent_id = a.id
    ${whereSql}
    ORDER BY ${orderCol} ${sortDirection}
    LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}
  `;

  const rowsRes = await db.query<any>(listSql, queryParams);

  return {
    tickets: rowsRes.rows,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize) || 1,
  };
}

export async function updateTicket(
  id: string,
  updates: Partial<Ticket>,
  actor: string = 'Agent'
): Promise<Ticket | null> {
  const db = await getDb();
  const current = await getTicketById(id);
  if (!current) return null;

  const setClauses: string[] = ['updated_at = NOW()'];
  const params: any[] = [id];

  if (updates.status !== undefined && updates.status !== current.status) {
    params.push(updates.status);
    setClauses.push(`status = $${params.length}`);
    await addTicketEvent(
      id,
      'status_changed',
      `Status changed from ${current.status} to ${updates.status}.`,
      actor,
      { previous: current.status, next: updates.status }
    );
    if (updates.status === 'resolved' && !current.resolved_at) {
      setClauses.push('resolved_at = NOW()');
    }
  }

  if (updates.priority !== undefined && updates.priority !== current.priority) {
    params.push(updates.priority);
    setClauses.push(`priority = $${params.length}`);
    await addTicketEvent(
      id,
      'priority_changed',
      `Priority changed from ${current.priority} to ${updates.priority}.`,
      actor
    );
  }

  if (updates.category !== undefined && updates.category !== current.category) {
    params.push(updates.category);
    setClauses.push(`category = $${params.length}`);
  }

  if (updates.assigned_agent_id !== undefined && updates.assigned_agent_id !== current.assigned_agent_id) {
    params.push(updates.assigned_agent_id);
    setClauses.push(`assigned_agent_id = $${params.length}`);
    await addTicketEvent(
      id,
      'assigned',
      `Assigned to agent ${updates.assigned_agent_id || 'Unassigned'}.`,
      actor
    );
  }

  if (updates.requires_human_review !== undefined && updates.requires_human_review !== current.requires_human_review) {
    params.push(updates.requires_human_review);
    setClauses.push(`requires_human_review = $${params.length}`);
  }

  if (updates.review_reason !== undefined) {
    params.push(updates.review_reason);
    setClauses.push(`review_reason = $${params.length}`);
  }

  if (updates.suggested_response !== undefined) {
    params.push(updates.suggested_response);
    setClauses.push(`suggested_response = $${params.length}`);
  }

  if (updates.response_status !== undefined && updates.response_status !== current.response_status) {
    params.push(updates.response_status);
    setClauses.push(`response_status = $${params.length}`);
    if (updates.response_status === 'approved' && !current.first_responded_at) {
      setClauses.push('first_responded_at = NOW()');
    }
    await addTicketEvent(
      id,
      `response_${updates.response_status}`,
      `AI suggested response marked as ${updates.response_status}.`,
      actor
    );
  }

  if (updates.summary !== undefined) {
    params.push(updates.summary);
    setClauses.push(`summary = $${params.length}`);
  }

  if (setClauses.length > 1) {
    await db.query(
      `UPDATE tickets SET ${setClauses.join(', ')} WHERE id = $1`,
      params
    );
  }

  return getTicketById(id);
}

export async function addTicketAnalysis(data: Omit<TicketAnalysis, 'id' | 'created_at'>): Promise<TicketAnalysis> {
  const db = await getDb();
  const id = `ANL-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

  const res = await db.query<any>(
    `INSERT INTO ticket_analyses (
      id, ticket_id, detected_language, category, priority, sentiment, intent,
      key_entities, recommended_action, suggested_response, confidence,
      uncertainty_explanation, requires_human_review, review_reason,
      supporting_article_ids, model_version, raw_output
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10, $11, $12, $13, $14, $15::jsonb, $16, $17::jsonb)
    RETURNING *`,
    [
      id,
      data.ticket_id,
      data.detected_language,
      data.category,
      data.priority,
      data.sentiment,
      data.intent,
      JSON.stringify(data.key_entities || {}),
      data.recommended_action,
      data.suggested_response,
      data.confidence,
      data.uncertainty_explanation || null,
      data.requires_human_review,
      data.review_reason || null,
      JSON.stringify(data.supporting_article_ids || []),
      data.model_version || 'gemini-3.8-flash',
      JSON.stringify(data.raw_output || {}),
    ]
  );

  // Update ticket with current analysis values
  await db.query(
    `UPDATE tickets SET
      detected_language = $1,
      category = $2,
      priority = $3,
      sentiment = $4,
      summary = $5,
      suggested_response = $6,
      requires_human_review = $7,
      review_reason = $8,
      updated_at = NOW()
     WHERE id = $9`,
    [
      data.detected_language,
      data.category,
      data.priority,
      data.sentiment,
      data.intent,
      data.suggested_response,
      data.requires_human_review,
      data.review_reason || null,
      data.ticket_id,
    ]
  );

  // Clear and update article references
  await db.query('DELETE FROM ticket_article_references WHERE ticket_id = $1', [data.ticket_id]);
  if (data.supporting_article_ids && data.supporting_article_ids.length > 0) {
    for (const artId of data.supporting_article_ids) {
      const refId = `REF-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`;
      await db.query(
        'INSERT INTO ticket_article_references (id, ticket_id, article_id, relevance_score) VALUES ($1, $2, $3, $4)',
        [refId, data.ticket_id, artId, 1.0]
      );
    }
  }

  await addTicketEvent(
    data.ticket_id,
    'analyzed',
    `Multilingual AI triage completed: ${data.detected_language} | ${data.category} | ${data.priority} (Confidence: ${Math.round(data.confidence * 100)}%)`,
    'Gemini AI',
    {
      confidence: data.confidence,
      requires_review: data.requires_human_review,
      reason: data.review_reason,
    }
  );

  return {
    ...res.rows[0],
    confidence: Number(res.rows[0].confidence),
    key_entities: typeof res.rows[0].key_entities === 'string' ? JSON.parse(res.rows[0].key_entities) : res.rows[0].key_entities,
    supporting_article_ids: typeof res.rows[0].supporting_article_ids === 'string' ? JSON.parse(res.rows[0].supporting_article_ids) : res.rows[0].supporting_article_ids,
  };
}

export async function addTicketEvent(
  ticketId: string,
  eventType: string,
  description: string,
  actor: string = 'System',
  metadata: Record<string, any> = {}
): Promise<TicketEvent> {
  const db = await getDb();
  const id = `EVT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

  const res = await db.query<TicketEvent>(
    `INSERT INTO ticket_events (id, ticket_id, event_type, description, actor, metadata)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb)
     RETURNING *`,
    [id, ticketId, eventType, description, actor, JSON.stringify(metadata)]
  );
  return res.rows[0];
}

// Main Dashboard Metrics (calculated strictly from PostgreSQL records)
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const db = await getDb();

  // 1. Total tickets
  const totalRes = await db.query<{ count: string }>('SELECT COUNT(*) as count FROM tickets');
  const totalTickets = parseInt(totalRes.rows[0]?.count || '0', 10);

  // 2. Open tickets
  const openRes = await db.query<{ count: string }>(
    "SELECT COUNT(*) as count FROM tickets WHERE status IN ('open', 'in_progress', 'waiting_for_customer')"
  );
  const openTickets = parseInt(openRes.rows[0]?.count || '0', 10);

  // 3. Urgent / high priority tickets
  const urgentRes = await db.query<{ count: string }>(
    "SELECT COUNT(*) as count FROM tickets WHERE priority IN ('Critical', 'High') AND status != 'resolved'"
  );
  const urgentTickets = parseInt(urgentRes.rows[0]?.count || '0', 10);

  // 4. Awaiting human review
  const reviewRes = await db.query<{ count: string }>(
    "SELECT COUNT(*) as count FROM tickets WHERE requires_human_review = TRUE AND status != 'resolved'"
  );
  const awaitingReviewTickets = parseInt(reviewRes.rows[0]?.count || '0', 10);

  // 5. Average first-response time in minutes (calculated only where timestamps exist)
  const avgTimeRes = await db.query<{ avg_minutes: string | null }>(
    `SELECT AVG(EXTRACT(EPOCH FROM (first_responded_at - created_at)) / 60) as avg_minutes
     FROM tickets
     WHERE first_responded_at IS NOT NULL AND first_responded_at >= created_at`
  );
  const avgMinutesRaw = avgTimeRes.rows[0]?.avg_minutes;
  const averageFirstResponseTimeMinutes = avgMinutesRaw !== null && avgMinutesRaw !== undefined
    ? Math.round(parseFloat(avgMinutesRaw) * 10) / 10
    : null;

  // 6. Tickets by category
  const catRes = await db.query<{ category: string; count: string }>(
    'SELECT category, COUNT(*) as count FROM tickets GROUP BY category ORDER BY count DESC'
  );
  const ticketsByCategory = catRes.rows.map((r) => ({
    category: r.category,
    count: parseInt(r.count, 10),
  }));

  // 7. Tickets by language
  const langRes = await db.query<{ detected_language: string; count: string }>(
    'SELECT detected_language, COUNT(*) as count FROM tickets GROUP BY detected_language ORDER BY count DESC'
  );
  const ticketsByLanguage = langRes.rows.map((r) => ({
    language: r.detected_language,
    count: parseInt(r.count, 10),
  }));

  // 8. Priority distribution
  const prioRes = await db.query<{ priority: string; count: string }>(
    'SELECT priority, COUNT(*) as count FROM tickets GROUP BY priority'
  );
  const priorityDistribution = prioRes.rows.map((r) => ({
    priority: r.priority,
    count: parseInt(r.count, 10),
  }));

  // 9. Recent activity
  const recentEvents = await db.query<TicketEvent>(
    'SELECT * FROM ticket_events ORDER BY created_at DESC LIMIT 10'
  );

  return {
    totalTickets,
    openTickets,
    urgentTickets,
    awaitingReviewTickets,
    averageFirstResponseTimeMinutes,
    ticketsByCategory,
    ticketsByLanguage,
    priorityDistribution,
    recentActivity: recentEvents.rows,
  };
}
