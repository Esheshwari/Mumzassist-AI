import { getDb } from './client.js';
import {
  findOrCreateCustomer,
  createKnowledgeBaseArticle,
  createTicket,
  addTicketAnalysis,
  addTicketEvent,
} from './repository.js';

export async function seedDatabase(force: boolean = false): Promise<void> {
  const db = await getDb();

  // Check if tickets already exist
  const existingTickets = await db.query<{ count: string }>('SELECT COUNT(*) as count FROM tickets');
  const count = parseInt(existingTickets.rows[0]?.count || '0', 10);
  if (count > 0 && !force) {
    console.log(`[Seed] Database already has ${count} tickets. Skipping seed.`);
    return;
  }

  console.log('[Seed] Seeding demo agents, knowledge base, and multilingual tickets...');

  // 1. Seed Support Agents
  const agents = [
    { id: 'AGT-01', name: 'Sara Chen', email: 'sara.chen@mumzassist.internal', role: 'Senior Support Lead', avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' },
    { id: 'AGT-02', name: 'Tariq Al-Mansoor', email: 'tariq.mansoor@mumzassist.internal', role: 'Arabic Triage Specialist', avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' },
    { id: 'AGT-03', name: 'Priya Sharma', email: 'priya.sharma@mumzassist.internal', role: 'Hindi & South Asia Lead', avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150' },
    { id: 'AGT-04', name: 'Alex Mercer', email: 'alex.mercer@mumzassist.internal', role: 'Escalations & Risk Officer', avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150' },
  ];

  for (const agent of agents) {
    await db.query(
      `INSERT INTO agents (id, name, email, role, avatar_url)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET name = $2, email = $3, role = $4, avatar_url = $5`,
      [agent.id, agent.name, agent.email, agent.role, agent.avatar_url]
    );
  }

  // 2. Seed Knowledge Base Articles (Multilingual)
  const kbArticles = [
    {
      id: 'KB-TRACK-01',
      title: 'Order Tracking & Delivery Timeframes',
      category: 'Order and delivery',
      supported_languages: ['English', 'Hindi', 'Arabic'],
      content: `Standard delivery takes 2 to 4 business days within metropolitan zones and 4 to 7 business days for regional areas.
Customers can track orders live via the tracking link sent in the confirmation SMS or email using their Order ID (e.g., MUM-XXXX).
If an order is delayed beyond 5 business days without tracking movement, support can initiate an expedited carrier tracer with the logistics team.
Express shipping delivers within 24 to 48 hours.

Arabic Translation / الترجمة العربية:
يستغرق التوصيل العادي من 2 إلى 4 أيام عمل في المدن الرئيسية، ومن 4 إلى 7 أيام عمل للمناطق الأخرى. يمكن للعملاء تتبع شحناتهم عبر رابط التتبع المرسل بالبريد أو الرسائل القصيرة باستخدام رقم الطلب. إذا تأخرت الشحنة لأكثر من 5 أيام دون تحديث، يتواصل فريق الدعم مع شركة الشحن لتتبعها فوراً.

Hindi Translation / हिन्दी अनुवाद:
महानगरीय क्षेत्रों में मानक डिलीवरी में 2 से 4 कार्यदिवस और क्षेत्रीय क्षेत्रों में 4 से 7 कार्यदिवस लगते हैं। ग्राहक ऑर्डर आईडी (जैसे MUM-XXXX) के माध्यम से एसएमएस या ईमेल में दिए गए लिंक से लाइव ट्रैकिंग कर सकते हैं।`,
      keywords: ['tracking', 'delivery', 'delay', 'carrier', 'shipping', 'order status', 'شحن', 'توصيل', 'تتبع', 'डिलीवरी', 'ट्रैकिंग'],
      is_active: true,
    },
    {
      id: 'KB-REFUND-02',
      title: 'Refund & Order Cancellation Policy',
      category: 'Refund and cancellation',
      supported_languages: ['English', 'Hindi', 'Arabic'],
      content: `Orders can be cancelled free of charge if they are still in 'Processing' status before carrier dispatch.
Once an order is shipped, customers must wait for delivery and initiate a standard return within 14 calendar days of receipt.
Items must be unused, sealed, and in original packaging.
Approved refunds are processed back to the original payment method within 5 to 7 banking days.
Store credits or wallet balances are issued instantly once approved.
Discount codes used during promotional sales are non-refundable cash-wise.

Arabic Translation / الترجمة العربية:
يمكن إلغاء الطلب مجاناً طالما كان في مرحلة المعالجة قبل الشحن. بعد الشحن، يحق للعميل إرجاع المنتج خلال 14 يوماً من الاستلام بشرط أن يكون غير مستخدم وفي عبوته الأصلية. تُعاد المبالغ المستردة المعتمدة إلى وسيلة الدفع الأصلية خلال 5 إلى 7 أيام عمل بنكية.

Hindi Translation / हिन्दी अनुवाद:
ऑर्डर को शिप होने से पहले निःशुल्क रद्द किया जा सकता है। शिप होने के बाद, डिलीवरी मिलने के 14 दिनों के भीतर रिटर्न का अनुरोध किया जा सकता है। रिफंड 5 से 7 कार्यदिवसों के भीतर मूल भुगतान माध्यम में वापस कर दिया जाता है।`,
      keywords: ['refund', 'cancellation', 'return', 'money back', '14 days', 'إرجاع', 'استرداد', 'إلغاء', 'रिफंड', 'वापसी', 'रद्द'],
      is_active: true,
    },
    {
      id: 'KB-PAYFAIL-03',
      title: 'Payment Failures, Double Charges & Card Declines',
      category: 'Payment and billing',
      supported_languages: ['English', 'Hindi', 'Arabic'],
      content: `If an amount is debited from the customer's account but the order shows 'Pending' or 'Failed', banks usually hold authorization amounts for 24 to 72 hours before auto-reversal.
Support agents should verify the transaction reference in the payment gateway. If no order was generated, reassure the customer that the pre-authorization hold will be released automatically by their issuing bank.
If a customer is charged twice for the same cart, provide the duplicate payment transaction ID to the billing desk for an immediate reversal.
Do NOT request full credit card numbers or CVV.

Arabic Translation / الترجمة العربية:
إذا تم خصم المبلغ ولكن حالة الطلب ظاهرة كفاشلة أو معلقة، فإن البنك عادة يقوم بإلغاء الحجز التلقائي وإعادة المبلغ خلال 24 إلى 72 ساعة. لا تطلب أبداً تفاصيل البطاقة الكاملة أو رمز الأمان CVV.

Hindi Translation / हिन्दी अनुवाद:
यदि खाते से पैसे कट गए हैं लेकिन ऑर्डर असफल रहा, तो बैंक आमतौर पर 24 से 72 घंटों के भीतर ऑटो-रिवर्सल कर देता है। कार्ड का पूरा नंबर या सीवीवी कभी न पूछें।`,
      keywords: ['payment', 'failed', 'deducted', 'charged twice', 'billing', 'card', 'دفع', 'خصم', 'فشل الدفع', 'भुगतान', 'पैसे कट गए'],
      is_active: true,
    },
    {
      id: 'KB-ACCOUNT-04',
      title: 'Account Access, 2FA & Password Reset',
      category: 'Account access',
      supported_languages: ['English', 'Hindi', 'Arabic'],
      content: `Customers unable to log in should use the 'Forgot Password' link on the sign-in screen to receive a secure time-sensitive reset link.
Reset links expire in 30 minutes for security purposes.
If a customer changed their phone number and cannot receive 2FA SMS OTPs, identity verification requires matching recent order numbers and billing zip codes before manual 2FA reset by an escalation specialist.`,
      keywords: ['password', 'login', '2fa', 'otp', 'account', 'حساب', 'كلمة المرور', 'लॉगिन', 'पासवर्ड'],
      is_active: true,
    },
    {
      id: 'KB-DAMAGED-05',
      title: 'Damaged, Defective or Missing Items',
      category: 'Product or service issue',
      supported_languages: ['English', 'Hindi', 'Arabic'],
      content: `If an item arrives damaged, leaked, expired, or missing, the customer must report it within 48 hours of delivery.
Customers must provide a photo of the damaged package, product barcode, and shipping label.
Upon verification, support will issue a free priority replacement dispatch or a full refund without requiring return of defective perishable items.`,
      keywords: ['damaged', 'broken', 'missing', 'expired', 'defective', 'تالف', 'مكسور', 'ناقص', 'टूटा हुआ', 'खराब'],
      is_active: true,
    },
    {
      id: 'KB-DISPUTE-06',
      title: 'Fraud Alert & Unauthorized Transaction Protocol',
      category: 'Complaint',
      supported_languages: ['English', 'Hindi', 'Arabic'],
      content: `Any report claiming identity theft, unauthorized card usage, stolen account credentials, or legal threat MUST BE FLAGGED FOR HUMAN REVIEW IMMEDIATELY.
AI agents must NOT attempt autonomous resolution or promise financial compensation on suspected fraud cases.
Escalate immediately to the Risk & Security team and freeze the associated order dispatch if pending.`,
      keywords: ['fraud', 'unauthorized', 'stolen', 'police', 'lawyer', 'احتيال', 'سرقة', 'धोखाधड़ी'],
      is_active: true,
    },
  ];

  for (const article of kbArticles) {
    await db.query(
      `INSERT INTO knowledge_base_articles (id, title, category, supported_languages, content, keywords, is_active)
       VALUES ($1, $2, $3, $4::jsonb, $5, $6::jsonb, $7)
       ON CONFLICT (id) DO UPDATE SET title = $2, category = $3, supported_languages = $4::jsonb, content = $5, keywords = $6::jsonb, is_active = $7`,
      [
        article.id,
        article.title,
        article.category,
        JSON.stringify(article.supported_languages),
        article.content,
        JSON.stringify(article.keywords),
        article.is_active,
      ]
    );
  }

  // 3. Seed Realistic Customers
  const customer1 = await findOrCreateCustomer('Sarah Jenkins', 'sarah.j@example.com', '+1-555-0192', 'English');
  const customer2 = await findOrCreateCustomer('Rajesh Kumar', 'rajesh.kumar@example.in', '+91-9876543210', 'Hindi');
  const customer3 = await findOrCreateCustomer('Fatima Al-Zahra', 'fatima.zahra@example.ae', '+971-50-1234567', 'Arabic');
  const customer4 = await findOrCreateCustomer('Amit Patel', 'amit.patel@example.in', '+91-9988776655', 'Hindi');
  const customer5 = await findOrCreateCustomer('Omar Khalid', 'omar.k@example.sa', '+966-55-9876543', 'Arabic');
  const customer6 = await findOrCreateCustomer('Michael Sterling', 'm.sterling@example.co.uk', '+44-20-7946-0912', 'English');

  // 4. Seed Representative Multilingual Tickets with Complete Analyses & Grounded Responses
  const demoTickets = [
    {
      customer_id: customer1.id,
      original_message: "Hello, my order #MUM-89211 was supposed to arrive two days ago. The tracking link hasn't updated since Monday. Can you please check where it is?",
      detected_language: 'English',
      category: 'Order and delivery',
      priority: 'Medium',
      sentiment: 'negative',
      status: 'open' as const,
      summary: 'Order MUM-89211 delayed with stalled tracking since Monday.',
      assigned_agent_id: 'AGT-01',
      requires_human_review: false,
      review_reason: null,
      suggested_response: "Dear Sarah, thank you for reaching out. I see that your order #MUM-89211 has not updated since Monday. According to our delivery policy, standard transit takes 2-4 business days. Since tracking has stalled, our support team can initiate an expedited tracer with the carrier right away to locate your package. We will follow up with you as soon as the carrier provides the location update.",
      supporting_article_ids: ['KB-TRACK-01'],
      intent: 'Check delivery status and track delayed package',
      key_entities: { order_id: 'MUM-89211', delayed_days: 2 },
      recommended_action: 'Initiate carrier tracer and notify customer with updated delivery window.',
      confidence: 0.94,
    },
    {
      customer_id: customer2.id,
      original_message: "नमस्ते, मैंने 3 दिन पहले बेबी स्ट्रॉलर ऑर्डर किया था (Order MUM-44021)। पेमेंट मेरे अकाउंट से कट गया है पर कन्फर्मेशन नहीं आया। क्या मेरा आर्डर कन्फर्म हुआ है?",
      detected_language: 'Hindi',
      category: 'Payment and billing',
      priority: 'High',
      sentiment: 'negative',
      status: 'in_progress' as const,
      summary: 'पेमेंट कट गया पर आर्डर MUM-44021 कन्फर्मेशन नहीं मिला।',
      assigned_agent_id: 'AGT-03',
      requires_human_review: false,
      review_reason: null,
      suggested_response: "नमस्ते राजेश जी, संपर्क करने के लिए धन्यवाद। यदि आपके खाते से पैसे कट गए हैं और ऑर्डर #MUM-44021 का कन्फर्मेशन नहीं मिला है, तो हमारी नीति के अनुसार कभी-कभी बैंक पेमेंट होल्ड पर रखता है जो 24 से 72 घंटों में स्वतः रिवर्स हो जाता है। हमारी टीम आपके ट्रांजेक्शन रेफरेंस की जांच कर रही है ताकि ऑर्डर तुरंत कन्फर्म किया जा सके या रिफंड की पुष्टि की जा सके।",
      supporting_article_ids: ['KB-PAYFAIL-03'],
      intent: 'Verify order confirmation after bank deduction',
      key_entities: { order_id: 'MUM-44021', item: 'baby stroller' },
      recommended_action: 'Verify transaction ID in payment gateway; reconcile order state.',
      confidence: 0.92,
    },
    {
      customer_id: customer3.id,
      original_message: "مرحباً، استلمت شحنة الطلب #MUM-66102 اليوم للأسف ولكن علبة حليب الأطفال كانت مفتوحة وتالفة داخل الصندوق. كيف يمكنني استبدالها أو استرجاع المبلغ؟",
      detected_language: 'Arabic',
      category: 'Product or service issue',
      priority: 'High',
      sentiment: 'negative',
      status: 'open' as const,
      summary: 'استلام عبوة حليب أطفال تالفة ومفتوحة للطلب MUM-66102.',
      assigned_agent_id: 'AGT-02',
      requires_human_review: false,
      review_reason: null,
      suggested_response: "مرحباً فاطمة، نعتذر بشدة عن استلام عبوة حليب الأطفال بحالة تالفة ومفتوحة في الطلب #MUM-66102. وفقاً لسياسة المنتجات التالفة، يرجى تزويدنا بصورة للعبوة التالفة والباركود، وسنقوم فوراً بإرسال بديل سريع ومجاني أو رد كامل المبلغ إلى وسيلة الدفع الأصلية دون الحاجة لإرجاع المنتج التالف.",
      supporting_article_ids: ['KB-DAMAGED-05', 'KB-REFUND-02'],
      intent: 'Request replacement or refund for damaged item',
      key_entities: { order_id: 'MUM-66102', issue: 'damaged baby formula' },
      recommended_action: 'Collect photographic proof of damaged package and dispatch priority replacement.',
      confidence: 0.96,
    },
    {
      customer_id: customer4.id,
      original_message: "Mera refund abhi tak nahi aaya hai order MUM-12984 ka. Maine 8 din pehle cancel kiya tha. Please jaldi dekhiye.",
      detected_language: 'Hindi',
      category: 'Refund and cancellation',
      priority: 'Medium',
      sentiment: 'negative',
      status: 'waiting_for_customer' as const,
      summary: 'Hinglish: 8 din pehle cancel kiye gaye order MUM-12984 ka refund pending.',
      assigned_agent_id: 'AGT-03',
      requires_human_review: false,
      review_reason: null,
      suggested_response: "नमस्ते अमित जी, हमारे रिफंड नियम के अनुसार स्वीकृत रिफंड मूल बैंक खाते में 5 से 7 बैंकिंग दिनों में आ जाता है। चूंकि 8 दिन बीत चुके हैं, कृपया हमें अपना बैंक स्टेटमेंट या ARN नंबर जांचने का अवसर दें। हम तुरंत बिलिंग डेस्क से संपर्क कर रहे हैं।",
      supporting_article_ids: ['KB-REFUND-02'],
      intent: 'Inquire regarding delayed refund on cancelled order',
      key_entities: { order_id: 'MUM-12984', cancellation_days_ago: 8 },
      recommended_action: 'Fetch ARN from billing gateway and send to customer.',
      confidence: 0.89,
    },
    {
      customer_id: customer5.id,
      original_message: "أريد إلغاء طلبي رقم #MUM-99120 قبل أن يتم شحنه وتغيير عنوان التوصيل إلى الرياض.",
      detected_language: 'Arabic',
      category: 'Refund and cancellation',
      priority: 'Medium',
      sentiment: 'neutral',
      status: 'in_progress' as const,
      summary: 'طلب إلغاء الطلب MUM-99120 قبل الشحن وتغيير العنوان للرياض.',
      assigned_agent_id: 'AGT-02',
      requires_human_review: false,
      review_reason: null,
      suggested_response: "أهلاً بك أستاذ عمر، يمكن إلغاء الطلب مجاناً طالما كان لا يزال قيد المعالجة ولم يتم تسليمه لشركة الشحن بعد. سنقوم بإيقاف الطلب #MUM-99120 لمساعدتك في تعديل عنوان التوصيل إلى مدينة الرياض بكل سهولة.",
      supporting_article_ids: ['KB-REFUND-02'],
      intent: 'Cancel pending order and update delivery address',
      key_entities: { order_id: 'MUM-99120', new_city: 'Riyadh' },
      recommended_action: 'Hold fulfillment in WMS and update recipient destination.',
      confidence: 0.93,
    },
    {
      customer_id: customer6.id,
      original_message: "URGENT FRAUD ALERT: Someone charged $480 to my card using an unauthorized account on your website for order #MUM-99411! I demand an immediate freeze and police investigation, or I will file an unauthorized chargeback with my bank tomorrow morning!",
      detected_language: 'English',
      category: 'Complaint',
      priority: 'Critical',
      sentiment: 'negative',
      status: 'escalated' as const,
      summary: 'Unauthorized card transaction dispute $480 for MUM-99411; legal/chargeback threat.',
      assigned_agent_id: 'AGT-04',
      requires_human_review: true,
      review_reason: 'High-risk case: Reported unauthorized card fraud, legal escalation, and impending chargeback dispute. Requires human verification before response.',
      suggested_response: "Dear Michael, we have flagged your report as high priority and forwarded it immediately to our Risk & Security team. Our specialist Alex Mercer is reviewing the transaction details for order #MUM-99411 and will contact you directly within 2 hours.",
      supporting_article_ids: ['KB-DISPUTE-06'],
      intent: 'Report unauthorized card transaction and dispute charge',
      key_entities: { order_id: 'MUM-99411', amount: '$480', risk_type: 'fraud' },
      recommended_action: 'Immediately halt order dispatch, freeze account, and escalate to Risk & Security lead.',
      confidence: 0.95,
    },
  ];

  for (const t of demoTickets) {
    const created = await createTicket({
      customer_id: t.customer_id,
      original_message: t.original_message,
      detected_language: t.detected_language,
      category: t.category,
      priority: t.priority,
      sentiment: t.sentiment,
      status: t.status,
      summary: t.summary,
      assigned_agent_id: t.assigned_agent_id,
      requires_human_review: t.requires_human_review,
      review_reason: t.review_reason || undefined,
      suggested_response: t.suggested_response,
    });

    await addTicketAnalysis({
      ticket_id: created.id,
      detected_language: t.detected_language,
      category: t.category,
      priority: t.priority,
      sentiment: t.sentiment,
      intent: t.intent,
      key_entities: t.key_entities,
      recommended_action: t.recommended_action,
      suggested_response: t.suggested_response,
      confidence: t.confidence,
      requires_human_review: t.requires_human_review,
      review_reason: t.review_reason || undefined,
      supporting_article_ids: t.supporting_article_ids,
      model_version: 'gemini-3.8-flash',
    });
  }

  console.log('[Seed] Database seeded with 6 multilingual demo tickets and 6 KB articles.');
}
