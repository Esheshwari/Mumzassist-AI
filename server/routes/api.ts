import { Router, Request, Response } from 'express';
import { z } from 'zod';
import {
  getDashboardMetrics,
  listTickets,
  getTicketById,
  createTicket,
  updateTicket,
  addTicketAnalysis,
  findOrCreateCustomer,
  searchKnowledgeBaseArticles,
  createKnowledgeBaseArticle,
  updateKnowledgeBaseArticle,
  getKnowledgeBaseArticleById,
  listAgents,
  addTicketEvent,
} from '../db/repository.js';
import { runTriageWorkflow, getAIStatus, testAIConnectivity } from '../ai/gemini.js';
import { seedDatabase } from '../db/seed.js';
import { getDatabaseStatus } from '../db/client.js';

export const apiRouter = Router();

// 1. Health check endpoint (for Vercel & AI Studio monitoring)
apiRouter.get('/health', async (req: Request, res: Response) => {
  try {
    const metrics = await getDashboardMetrics();
    const aiStatus = getAIStatus();
    res.json({
      status: 'healthy',
      system: 'MumzAssist.A',
      database: 'PostgreSQL',
      ai_status: aiStatus,
      version: '1.0.0',
      total_tickets: metrics.totalTickets,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({
      status: 'unhealthy',
      error: err.message,
    });
  }
});

// AI Engine diagnostics and connectivity test
apiRouter.get('/ai/status', (req: Request, res: Response) => {
  res.json(getAIStatus());
});

apiRouter.post('/ai/test', async (req: Request, res: Response) => {
  try {
    const status = await testAIConnectivity();
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ error: 'AI test failed', details: err.message });
  }
});

// 2. Metrics endpoint
apiRouter.get('/metrics', async (req: Request, res: Response) => {
  try {
    const metrics = await getDashboardMetrics();
    res.json(metrics);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve metrics', details: err.message });
  }
});

// 3. List tickets with filtering, pagination, and search
apiRouter.get('/tickets', async (req: Request, res: Response) => {
  try {
    const {
      page,
      pageSize,
      status,
      priority,
      category,
      language,
      requiresReview,
      search,
      sortBy,
      sortOrder,
    } = req.query;

    const result = await listTickets({
      page: page ? parseInt(page as string, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize as string, 10) : 15,
      status: status as string,
      priority: priority as string,
      category: category as string,
      language: language as string,
      requiresReview: requiresReview === 'true' ? true : requiresReview === 'false' ? false : undefined,
      search: search as string,
      sortBy: sortBy as string,
      sortOrder: (sortOrder as 'ASC' | 'DESC') || 'DESC',
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to list tickets', details: err.message });
  }
});

// 4. Create new ticket and run automatic AI triage workflow
const CreateTicketSchema = z.object({
  customer_name: z.string().min(1),
  customer_email: z.string().email().optional().or(z.literal('')),
  customer_phone: z.string().optional(),
  original_message: z.string().min(5),
  selected_language: z.string().optional(),
});

apiRouter.post('/tickets', async (req: Request, res: Response) => {
  try {
    const parsed = CreateTicketSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid input', details: parsed.error.format() });
    }

    const { customer_name, customer_email, customer_phone, original_message, selected_language } = parsed.data;

    // Find or create customer
    const customer = await findOrCreateCustomer(
      customer_name,
      customer_email || undefined,
      customer_phone,
      selected_language || 'English'
    );

    // Step 2: Immediately insert initial ticket record into PostgreSQL with persistent ID
    const ticket = await createTicket({
      customer_id: customer.id,
      original_message,
      selected_language,
      status: 'open',
    });

    // Step 3: Run AI Multilingual Triage Workflow with Grounding
    try {
      const triageResult = await runTriageWorkflow(
        original_message,
        customer.name,
        selected_language
      );

      // Step 4: Persist AI Analysis and citations
      await addTicketAnalysis({
        ticket_id: ticket.id,
        detected_language: triageResult.detected_language,
        category: triageResult.category,
        priority: triageResult.priority,
        sentiment: triageResult.sentiment,
        intent: triageResult.intent,
        key_entities: triageResult.key_entities,
        recommended_action: triageResult.recommended_action,
        suggested_response: triageResult.suggested_response,
        confidence: triageResult.confidence,
        uncertainty_explanation: triageResult.uncertainty_explanation || undefined,
        requires_human_review: triageResult.requires_human_review,
        review_reason: triageResult.review_reason || undefined,
        supporting_article_ids: triageResult.supporting_article_ids,
        model_version: triageResult.is_fallback
          ? 'Multilingual Rule Engine (Gemini 403 Fallback)'
          : 'gemini-3.8-flash',
        raw_output: triageResult,
      });

      const fullTicket = await getTicketById(ticket.id);
      return res.status(201).json(fullTicket);
    } catch (aiErr: any) {
      console.warn('[Ticket Triage Fallback] Processing error, persisting review state:', aiErr?.message || aiErr);
      await addTicketEvent(
        ticket.id,
        'analysis_failed',
        `AI triage workflow failed: ${aiErr.message || 'Service error'}. Preserved ticket in PostgreSQL for manual agent triage.`,
        'System'
      );
      await updateTicket(
        ticket.id,
        {
          requires_human_review: true,
          review_reason: `AI triage processing failed (${aiErr.message || 'Service unavailable'}). Pending human review or retry.`,
        },
        'System'
      );

      const fullTicket = await getTicketById(ticket.id);
      return res.status(201).json(fullTicket);
    }
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create ticket', details: err.message });
  }
});

// 5. Get ticket by ID
apiRouter.get('/tickets/:id', async (req: Request, res: Response) => {
  try {
    const ticket = await getTicketById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    res.json(ticket);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch ticket', details: err.message });
  }
});

// 6. Update ticket status, priority, category, assignment, or human review flag
const UpdateTicketSchema = z.object({
  status: z.enum(['open', 'in_progress', 'waiting_for_customer', 'resolved', 'escalated']).optional(),
  priority: z.enum(['Critical', 'High', 'Medium', 'Low']).optional(),
  category: z.string().optional(),
  assigned_agent_id: z.string().nullable().optional(),
  requires_human_review: z.boolean().optional(),
  review_reason: z.string().nullable().optional(),
  suggested_response: z.string().optional(),
  response_status: z.enum(['draft', 'approved', 'edited', 'rejected']).optional(),
  actor: z.string().optional(),
});

apiRouter.patch('/tickets/:id', async (req: Request, res: Response) => {
  try {
    const parsed = UpdateTicketSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid input', details: parsed.error.format() });
    }

    const updated = await updateTicket(
      req.params.id,
      parsed.data,
      parsed.data.actor || 'Support Agent'
    );

    if (!updated) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update ticket', details: err.message });
  }
});

// 7. Re-run AI analysis on an existing ticket
apiRouter.post('/tickets/:id/analyze', async (req: Request, res: Response) => {
  try {
    const ticket = await getTicketById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const triageResult = await runTriageWorkflow(
      ticket.original_message,
      ticket.customer_name,
      ticket.selected_language || undefined
    );

    await addTicketAnalysis({
      ticket_id: ticket.id,
      detected_language: triageResult.detected_language,
      category: triageResult.category,
      priority: triageResult.priority,
      sentiment: triageResult.sentiment,
      intent: triageResult.intent,
      key_entities: triageResult.key_entities,
      recommended_action: triageResult.recommended_action,
      suggested_response: triageResult.suggested_response,
      confidence: triageResult.confidence,
      uncertainty_explanation: triageResult.uncertainty_explanation || undefined,
      requires_human_review: triageResult.requires_human_review,
      review_reason: triageResult.review_reason || undefined,
      supporting_article_ids: triageResult.supporting_article_ids,
      model_version: 'gemini-3.8-flash',
      raw_output: triageResult,
    });

    const refreshed = await getTicketById(ticket.id);
    res.json(refreshed);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to analyze ticket', details: err.message });
  }
});

// 8. Approve, edit, or reject suggested response
const ResponseActionSchema = z.object({
  action: z.enum(['approve', 'edit', 'reject']),
  editedResponse: z.string().optional(),
  actor: z.string().optional(),
});

apiRouter.post('/tickets/:id/response', async (req: Request, res: Response) => {
  try {
    const parsed = ResponseActionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid input', details: parsed.error.format() });
    }

    const { action, editedResponse, actor } = parsed.data;
    const ticket = await getTicketById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    if (action === 'approve') {
      const updated = await updateTicket(
        ticket.id,
        {
          response_status: 'approved',
          status: 'waiting_for_customer',
        },
        actor || 'Agent'
      );
      return res.json(updated);
    } else if (action === 'edit') {
      const updated = await updateTicket(
        ticket.id,
        {
          suggested_response: editedResponse || ticket.suggested_response,
          response_status: 'edited',
        },
        actor || 'Agent'
      );
      return res.json(updated);
    } else if (action === 'reject') {
      const updated = await updateTicket(
        ticket.id,
        {
          response_status: 'rejected',
          requires_human_review: true,
          review_reason: 'Agent rejected AI draft response. Manual drafting needed.',
        },
        actor || 'Agent'
      );
      return res.json(updated);
    }
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to process response action', details: err.message });
  }
});

// 9. Knowledge Base endpoints
apiRouter.get('/knowledge-base', async (req: Request, res: Response) => {
  try {
    const { query, category, language } = req.query;
    const articles = await searchKnowledgeBaseArticles(
      query as string,
      category as string,
      language as string
    );
    res.json(articles);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch knowledge base', details: err.message });
  }
});

const KbArticleSchema = z.object({
  title: z.string().min(3),
  category: z.string().min(2),
  supported_languages: z.array(z.string()).default(['English']),
  content: z.string().min(10),
  keywords: z.array(z.string()).default([]),
  is_active: z.boolean().default(true),
});

apiRouter.post('/knowledge-base', async (req: Request, res: Response) => {
  try {
    const parsed = KbArticleSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid input', details: parsed.error.format() });
    }
    const created = await createKnowledgeBaseArticle(parsed.data);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create article', details: err.message });
  }
});

apiRouter.put('/knowledge-base/:id', async (req: Request, res: Response) => {
  try {
    const updated = await updateKnowledgeBaseArticle(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Article not found' });
    }
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update article', details: err.message });
  }
});

// 10. List Agents
apiRouter.get('/agents', async (req: Request, res: Response) => {
  try {
    const agents = await listAgents();
    res.json(agents);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to list agents', details: err.message });
  }
});

// 11. Reseed database
apiRouter.post('/seed', async (req: Request, res: Response) => {
  try {
    await seedDatabase(true);
    res.json({ message: 'Database reseeded successfully with multilingual demo records.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to seed database', details: err.message });
  }
});

// 12. Multilingual Evaluation Benchmark Runner
// Runs a representative evaluation dataset across English, Hindi (Devanagari & Hinglish), and Arabic
apiRouter.get('/evaluation', async (req: Request, res: Response) => {
  try {
    const { runEvaluationSuite } = await import('../eval/evaluation.js');
    const results = await runEvaluationSuite();
    res.json(results);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to run evaluation', details: err.message });
  }
});

// 13. Live PostgreSQL / Neon Database Diagnostics
apiRouter.get('/database/status', async (req: Request, res: Response) => {
  try {
    const status = await getDatabaseStatus();
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch database diagnostics', details: err.message });
  }
});

// 14. Explicit Retry Endpoint for Failed AI Triage
apiRouter.post('/tickets/:id/retry', async (req: Request, res: Response) => {
  try {
    const ticket = await getTicketById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    await addTicketEvent(
      ticket.id,
      'triage_retried',
      'AI triage retry initiated by support agent.',
      req.body?.actor || 'Support Agent'
    );

    const triageResult = await runTriageWorkflow(
      ticket.original_message,
      ticket.customer_name,
      ticket.selected_language || undefined
    );

    await addTicketAnalysis({
      ticket_id: ticket.id,
      detected_language: triageResult.detected_language,
      category: triageResult.category,
      priority: triageResult.priority,
      sentiment: triageResult.sentiment,
      intent: triageResult.intent,
      key_entities: triageResult.key_entities,
      recommended_action: triageResult.recommended_action,
      suggested_response: triageResult.suggested_response,
      confidence: triageResult.confidence,
      uncertainty_explanation: triageResult.uncertainty_explanation || undefined,
      requires_human_review: triageResult.requires_human_review,
      review_reason: triageResult.review_reason || undefined,
      supporting_article_ids: triageResult.supporting_article_ids,
      model_version: triageResult.is_fallback
        ? 'Multilingual Rule Engine (Gemini 403 Fallback)'
        : 'gemini-3.8-flash',
      raw_output: triageResult,
    });

    const refreshed = await getTicketById(ticket.id);
    res.json(refreshed);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retry ticket triage', details: err.message });
  }
});
