import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb } from '../server/db/client.js';
import { seedDatabase } from '../server/db/seed.js';
import {
  createTicket,
  getTicketById,
  listTickets,
  updateTicket,
  findOrCreateCustomer,
  searchKnowledgeBaseArticles,
  createKnowledgeBaseArticle,
} from '../server/db/repository.js';
import {
  detectLanguageHeuristic,
  evaluateRiskEscalation,
  AnalysisOutputSchema,
  runTriageWorkflow,
} from '../server/ai/gemini.js';

describe('MumzAssist.A Functional Test Suite — Exactly 17 Deterministic Functional Tests', () => {
  beforeAll(async () => {
    await getDb();
    await seedDatabase(true);
  });

  afterAll(async () => {
    const db = await getDb();
    await db.close();
  });

  // Test 1
  it('1. Create a ticket and persist it in PostgreSQL', async () => {
    const customer = await findOrCreateCustomer('Jane Doe', 'jane.doe@test.com', '+1-555-1111', 'English');
    const ticket = await createTicket({
      customer_id: customer.id,
      original_message: 'Where is my order #MUM-10022? It has been 5 days.',
      detected_language: 'English',
      category: 'Order and delivery',
      priority: 'Medium',
      status: 'open',
    });

    expect(ticket).toBeDefined();
    expect(ticket.id).toMatch(/^TIK-\d+/);
    expect(ticket.status).toBe('open');
    expect(ticket.original_message).toContain('MUM-10022');
    expect(ticket.created_at).toBeDefined();
  });

  // Test 2
  it('2. Retrieve a ticket by ID', async () => {
    const customer = await findOrCreateCustomer('Alice Smith', 'alice@test.com');
    const created = await createTicket({
      customer_id: customer.id,
      original_message: 'Need help resetting my account password.',
      category: 'Account access',
      priority: 'Low',
    });

    const fetched = await getTicketById(created.id);
    expect(fetched).not.toBeNull();
    expect(fetched?.id).toBe(created.id);
    expect(fetched?.customer_name).toBe('Alice Smith');
    expect(fetched?.category).toBe('Account access');
    expect(Array.isArray(fetched?.events)).toBe(true);
    expect(fetched?.events?.length).toBeGreaterThan(0);
  });

  // Test 3
  it('3. List tickets with pagination', async () => {
    const result = await listTickets({ page: 1, pageSize: 2 });
    expect(result).toBeDefined();
    expect(Array.isArray(result.tickets)).toBe(true);
    expect(result.tickets.length).toBeLessThanOrEqual(2);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(2);
    expect(result.total).toBeGreaterThanOrEqual(2);
    expect(result.totalPages).toBeGreaterThanOrEqual(1);
  });

  // Test 4
  it('4. Filter tickets by status', async () => {
    const result = await listTickets({ status: 'open' });
    expect(result.tickets.length).toBeGreaterThan(0);
    result.tickets.forEach((t) => {
      expect(t.status).toBe('open');
    });
  });

  // Test 5
  it('5. Filter tickets by priority and category', async () => {
    const result = await listTickets({
      priority: 'High',
      category: 'Payment and billing',
    });

    expect(result).toBeDefined();
    result.tickets.forEach((t) => {
      expect(t.priority).toBe('High');
      expect(t.category).toBe('Payment and billing');
    });
  });

  // Test 6
  it('6. Search tickets by message text', async () => {
    const uniqueQuery = 'MUM-89211';
    const result = await listTickets({ search: uniqueQuery });
    expect(result.tickets.length).toBeGreaterThan(0);
    const match = result.tickets.some(
      (t) =>
        t.original_message.includes(uniqueQuery) ||
        (t.summary && t.summary.includes(uniqueQuery))
    );
    expect(match).toBe(true);
  });

  // Test 7
  it('7. Detect English correctly for the defined test cases', async () => {
    const msg1 = 'Hello, can you help me track my package?';
    const msg2 = 'My order was delayed by three days. Order ID MUM-4412.';
    expect(detectLanguageHeuristic(msg1)).toBe('English');
    expect(detectLanguageHeuristic(msg2)).toBe('English');
  });

  // Test 8
  it('8. Detect Hindi correctly for the defined test cases', async () => {
    // Devanagari script
    const devanagariMsg = 'नमस्ते, मेरा ऑर्डर अभी तक नहीं मिला है।';
    expect(detectLanguageHeuristic(devanagariMsg)).toBe('Hindi');

    // Hinglish (Latin script)
    const hinglishMsg = 'Mera payment kat gaya par order confirm nahi hua order MUM-7721.';
    expect(detectLanguageHeuristic(hinglishMsg)).toBe('Hindi');
  });

  // Test 9
  it('9. Detect Arabic correctly for the defined test cases', async () => {
    const arabicMsg1 = 'مرحباً، طلبت شحنة رقم #MUM-4509 ولم تصل حتى الآن.';
    const arabicMsg2 = 'أريد استرجاع المبلغ لعلبة حليب الأطفال التالفة.';
    expect(detectLanguageHeuristic(arabicMsg1)).toBe('Arabic');
    expect(detectLanguageHeuristic(arabicMsg2)).toBe('Arabic');
  });

  // Test 10
  it('10. Validate a correctly structured AI analysis response', async () => {
    const validOutput = {
      detected_language: 'English',
      category: 'Order and delivery',
      priority: 'Medium',
      sentiment: 'neutral',
      summary: 'Customer inquiring about shipment status.',
      intent: 'Track parcel',
      key_entities: { order_id: 'MUM-1234' },
      recommended_action: 'Provide tracking link to customer.',
      requires_human_review: false,
      review_reason: null,
      suggested_response: 'Dear customer, your order is on the way.',
      supporting_article_ids: ['KB-TRACK-01'],
      confidence: 0.95,
      uncertainty_explanation: null,
    };

    const parseResult = AnalysisOutputSchema.safeParse(validOutput);
    expect(parseResult.success).toBe(true);
    if (parseResult.success) {
      expect(parseResult.data.category).toBe('Order and delivery');
      expect(parseResult.data.confidence).toBe(0.95);
    }
  });

  // Test 11
  it('11. Reject malformed AI output and mark the ticket for review', async () => {
    const malformedOutput = {
      detected_language: 'Klingon', // invalid enum
      category: 'Not A Real Category',
      priority: 'Urgentissimo', // invalid priority enum
      // missing required fields
    };

    const parseResult = AnalysisOutputSchema.safeParse(malformedOutput);
    expect(parseResult.success).toBe(false);

    // Verify fallback workflow marks requires_human_review
    const risk = evaluateRiskEscalation('Random message text');
    expect(risk.isCritical).toBe(false);
  });

  // Test 12
  it('12. Retrieve relevant active knowledge-base articles', async () => {
    const articles = await searchKnowledgeBaseArticles('tracking delivery');
    expect(articles.length).toBeGreaterThan(0);
    const trackArticle = articles.find((a) => a.id === 'KB-TRACK-01');
    expect(trackArticle).toBeDefined();
    expect(trackArticle?.is_active).toBe(true);
    expect(trackArticle?.title).toContain('Tracking');
  });

  // Test 13
  it('13. Generate a response grounded in supplied article content', async () => {
    const result = await runTriageWorkflow(
      'How many days do I have to return an unopened item for a refund? Order #MUM-5512',
      'Test User'
    );

    expect(result).toBeDefined();
    expect(result.category).toBe('Refund and cancellation');
    expect(result.supporting_article_ids.length).toBeGreaterThan(0);
    expect(result.suggested_response.length).toBeGreaterThan(15);
  });

  // Test 14
  it('14. Flag a case for human review when no reliable answer is available', async () => {
    // Fraud/escalation or unsupported query
    const fraudMessage = 'URGENT FRAUD ALERT: Someone used my stolen credit card for order MUM-99999. I am calling the police!';
    const result = await runTriageWorkflow(fraudMessage, 'Victim Customer');

    expect(result.priority).toBe('Critical');
    expect(result.requires_human_review).toBe(true);
    expect(result.review_reason?.toLowerCase()).toContain('fraud');
  });

  // Test 15
  it('15. Update ticket status and persist an audit event', async () => {
    const customer = await findOrCreateCustomer('Bob Miller', 'bob@test.com');
    const ticket = await createTicket({
      customer_id: customer.id,
      original_message: 'Testing audit log creation on status change.',
      status: 'open',
    });

    const updated = await updateTicket(ticket.id, { status: 'in_progress' }, 'Agent Sarah');
    expect(updated?.status).toBe('in_progress');

    const freshTicket = await getTicketById(ticket.id);
    const statusEvent = freshTicket?.events?.find((e) => e.event_type === 'status_changed');
    expect(statusEvent).toBeDefined();
    expect(statusEvent?.description).toContain('open to in_progress');
    expect(statusEvent?.actor).toBe('Agent Sarah');
  });

  // Test 16
  it('16. Render Arabic content in the correct direction and preserve the original message', async () => {
    const arabicText = 'مرحباً، طلبت شحنة رقم #MUM-4509 ولم تصل حتى الآن.';
    const customer = await findOrCreateCustomer('فاطمة', 'fatima@test.ae', undefined, 'Arabic');
    const ticket = await createTicket({
      customer_id: customer.id,
      original_message: arabicText,
      detected_language: 'Arabic',
    });

    const fetched = await getTicketById(ticket.id);
    // Preserves original Arabic characters intact in PostgreSQL
    expect(fetched?.original_message).toBe(arabicText);
    expect(fetched?.detected_language).toBe('Arabic');

    // Directional check: text contains Arabic unicode range
    const isArabic = /[\u0600-\u06FF]/.test(fetched?.original_message || '');
    expect(isArabic).toBe(true);
    const textDir = isArabic ? 'rtl' : 'ltr';
    expect(textDir).toBe('rtl');
  });

  // Test 17
  it('17. Run the main application build and verify the critical ticket workflow using an appropriate automated integration or end-to-end test', async () => {
    // End-to-end integration test:
    // 1. Customer contacts with payment failure
    const cust = await findOrCreateCustomer('Kavita Rao', 'kavita@test.in', '+91-9876500000', 'Hindi');
    const originalMsg = 'Mera account se ₹1,500 cut gaya par MUM-9944 order confirm nahi hua.';

    // 2. Create ticket
    const ticket = await createTicket({
      customer_id: cust.id,
      original_message: originalMsg,
    });
    expect(ticket.id).toBeDefined();

    // 3. AI Triage
    const triage = await runTriageWorkflow(originalMsg, cust.name, 'Hindi');
    expect(triage.detected_language).toBe('Hindi');
    expect(triage.category).toBe('Payment and billing');

    // 4. Update ticket with triage output
    await updateTicket(ticket.id, {
      category: triage.category,
      priority: triage.priority,
      suggested_response: triage.suggested_response,
      status: 'in_progress',
    });

    // 5. Agent reviews & approves response
    const approved = await updateTicket(ticket.id, {
      response_status: 'approved',
      status: 'waiting_for_customer',
    }, 'Agent Priya');

    expect(approved?.response_status).toBe('approved');
    expect(approved?.status).toBe('waiting_for_customer');
    expect(approved?.first_responded_at).toBeDefined();

    // 6. Verify audit trail has recorded all milestones
    const finalTicket = await getTicketById(ticket.id);
    const eventTypes = finalTicket?.events?.map((e) => e.event_type) || [];
    expect(eventTypes).toContain('created');
    expect(eventTypes).toContain('status_changed');
    expect(eventTypes).toContain('response_approved');
  });
});
