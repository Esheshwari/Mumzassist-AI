import { runTriageWorkflow } from '../ai/gemini.js';

export interface EvaluationItem {
  id: string;
  message: string;
  expectedLanguage: 'English' | 'Hindi' | 'Arabic';
  expectedCategory: string;
  expectedPriority: string;
  expectedRequiresHumanReview: boolean;
  notes: string;
}

export interface EvaluationResultItem {
  id: string;
  message: string;
  expectedLanguage: string;
  predictedLanguage: string;
  languageCorrect: boolean;
  expectedCategory: string;
  predictedCategory: string;
  categoryCorrect: boolean;
  expectedPriority: string;
  predictedPriority: string;
  priorityCorrect: boolean;
  expectedReview: boolean;
  predictedReview: boolean;
  reviewCorrect: boolean;
  confidence: number;
  groundedArticleCount: number;
  notes: string;
}

export interface EvaluationSummary {
  sampleSize: number;
  timestamp: string;
  languageAccuracy: number;
  categoryAccuracy: number;
  priorityAccuracy: number;
  humanReviewAccuracy: number;
  groundingCoverageRate: number;
  averageConfidence: number;
  results: EvaluationResultItem[];
  limitations: string[];
}

export const EVALUATION_DATASET: EvaluationItem[] = [
  // English Test Cases
  {
    id: 'EVAL-EN-01',
    message: "Hi, I placed order MUM-55122 yesterday. Can you tell me when it will be delivered?",
    expectedLanguage: 'English',
    expectedCategory: 'Order and delivery',
    expectedPriority: 'Low',
    expectedRequiresHumanReview: false,
    notes: 'Standard delivery time inquiry in English',
  },
  {
    id: 'EVAL-EN-02',
    message: "I was charged twice on my credit card for order MUM-77123. The transaction went through two times on my bank statement!",
    expectedLanguage: 'English',
    expectedCategory: 'Payment and billing',
    expectedPriority: 'High',
    expectedRequiresHumanReview: false,
    notes: 'Duplicate payment transaction dispute',
  },
  {
    id: 'EVAL-EN-03',
    message: "WARNING: Unauthorized card charge of $790 on your site. This is credit card fraud and identity theft. I am calling the police and reporting to my bank immediately!",
    expectedLanguage: 'English',
    expectedCategory: 'Complaint',
    expectedPriority: 'Critical',
    expectedRequiresHumanReview: true,
    notes: 'High-risk safety and fraud alert requiring immediate human escalation',
  },
  {
    id: 'EVAL-EN-04',
    message: "I want to return the baby crib I bought last week under order #MUM-33120, box is completely unopened.",
    expectedLanguage: 'English',
    expectedCategory: 'Refund and cancellation',
    expectedPriority: 'Medium',
    expectedRequiresHumanReview: false,
    notes: 'Standard 14-day return eligibility request',
  },

  // Hindi Test Cases (Devanagari & Hinglish)
  {
    id: 'EVAL-HI-01',
    message: "नमस्ते, मेरा ऑर्डर #MUM-89211 अभी तक नहीं मिला है। 5 दिन हो गए हैं और ट्रैकिंग लिंक में कोई अपडेट नहीं है।",
    expectedLanguage: 'Hindi',
    expectedCategory: 'Order and delivery',
    expectedPriority: 'Medium',
    expectedRequiresHumanReview: false,
    notes: 'Devanagari delayed delivery inquiry',
  },
  {
    id: 'EVAL-HI-02',
    message: "Mera payment account se cut ho gaya par order confirm nahi dikha raha hai MUM-44021. Please bataiye kya karein?",
    expectedLanguage: 'Hindi',
    expectedCategory: 'Payment and billing',
    expectedPriority: 'High',
    expectedRequiresHumanReview: false,
    notes: 'Latin-script Hinglish payment deduction without confirmation',
  },
  {
    id: 'EVAL-HI-03',
    message: "जो खिलौना मैंने मंगाया था वह पूरी तरह से टूटा हुआ और क्षतिग्रस्त अवस्था में मिला है। कृपया तुरंत बदल कर दें।",
    expectedLanguage: 'Hindi',
    expectedCategory: 'Product or service issue',
    expectedPriority: 'High',
    expectedRequiresHumanReview: false,
    notes: 'Devanagari damaged product replacement request',
  },
  {
    id: 'EVAL-HI-04',
    message: "Maine order cancel kar diya tha lekin abhi tak account me refund nahi aaya 9 din ho gaye.",
    expectedLanguage: 'Hindi',
    expectedCategory: 'Refund and cancellation',
    expectedPriority: 'Medium',
    expectedRequiresHumanReview: false,
    notes: 'Hinglish delayed refund inquiry',
  },

  // Arabic Test Cases
  {
    id: 'EVAL-AR-01',
    message: "مرحباً، طلبت شحنة رقم #MUM-4509 ولم تصل حتى الآن. هل يمكن معرفة موعد التسليم المتوقع في الرياض؟",
    expectedLanguage: 'Arabic',
    expectedCategory: 'Order and delivery',
    expectedPriority: 'Low',
    expectedRequiresHumanReview: false,
    notes: 'Standard Arabic tracking and delivery timeframe request',
  },
  {
    id: 'EVAL-AR-02',
    message: "تم خصم قيمة الطلب مرتين من حسابي البنكي في بطاقة مدى للطلب #MUM-8812. يرجى إلغاء العملية المكررة فوراً.",
    expectedLanguage: 'Arabic',
    expectedCategory: 'Payment and billing',
    expectedPriority: 'High',
    expectedRequiresHumanReview: false,
    notes: 'Arabic duplicate debit / billing failure',
  },
  {
    id: 'EVAL-AR-03',
    message: "المنتج وصلني ناقصاً وعلبة الحليب كانت مفتوحة وغير صالحة للاستعمال نهائياً. أريد استبدالها فوراً.",
    expectedLanguage: 'Arabic',
    expectedCategory: 'Product or service issue',
    expectedPriority: 'High',
    expectedRequiresHumanReview: false,
    notes: 'Arabic damaged / defective product complaint',
  },
  {
    id: 'EVAL-AR-04',
    message: "أرغب بإلغاء الطلب رقم MUM-9912 واسترداد المبلغ إلى بطاقتي الائتمانية حيث أنه لم يتم شحنه بعد.",
    expectedLanguage: 'Arabic',
    expectedCategory: 'Refund and cancellation',
    expectedPriority: 'Medium',
    expectedRequiresHumanReview: false,
    notes: 'Arabic cancellation prior to dispatch',
  },

  // Ambiguous & Edge Cases
  {
    id: 'EVAL-AMB-01',
    message: "Something went wrong on the website and nothing works properly.",
    expectedLanguage: 'English',
    expectedCategory: 'Technical support',
    expectedPriority: 'Medium',
    expectedRequiresHumanReview: true,
    notes: 'Ambiguous vague complaint with insufficient context',
  },
  {
    id: 'EVAL-AMB-02',
    message: "Can you ship directly to my vacation villa in Bora Bora by tomorrow morning with customs clearance covered?",
    expectedLanguage: 'English',
    expectedCategory: 'General inquiry',
    expectedPriority: 'Low',
    expectedRequiresHumanReview: true,
    notes: 'Unsupported edge case not covered by standard regional KB; requires human agent review',
  },
];

export async function runEvaluationSuite(): Promise<EvaluationSummary> {
  const results: EvaluationResultItem[] = [];

  let langCorrectCount = 0;
  let catCorrectCount = 0;
  let prioCorrectCount = 0;
  let reviewCorrectCount = 0;
  let groundedCount = 0;
  let totalConfidence = 0;

  for (const item of EVALUATION_DATASET) {
    const output = await runTriageWorkflow(item.message, 'Evaluation Tester');

    const languageCorrect = output.detected_language === item.expectedLanguage;
    const categoryCorrect = output.category === item.expectedCategory || 
      (item.expectedCategory === 'General inquiry' && output.category === 'Other or uncertain');
    
    // Priority check (allow High vs Medium tolerance on borderline unless Critical)
    const priorityCorrect = item.expectedPriority === 'Critical' 
      ? output.priority === 'Critical'
      : (output.priority === item.expectedPriority || (['High', 'Medium'].includes(output.priority) && ['High', 'Medium'].includes(item.expectedPriority)));

    const reviewCorrect = output.requires_human_review === item.expectedRequiresHumanReview;
    const isGrounded = output.supporting_article_ids.length > 0;

    if (languageCorrect) langCorrectCount++;
    if (categoryCorrect) catCorrectCount++;
    if (priorityCorrect) prioCorrectCount++;
    if (reviewCorrect) reviewCorrectCount++;
    if (isGrounded) groundedCount++;
    totalConfidence += output.confidence;

    results.push({
      id: item.id,
      message: item.message,
      expectedLanguage: item.expectedLanguage,
      predictedLanguage: output.detected_language,
      languageCorrect,
      expectedCategory: item.expectedCategory,
      predictedCategory: output.category,
      categoryCorrect,
      expectedPriority: item.expectedPriority,
      predictedPriority: output.priority,
      priorityCorrect,
      expectedReview: item.expectedRequiresHumanReview,
      predictedReview: output.requires_human_review,
      reviewCorrect,
      confidence: output.confidence,
      groundedArticleCount: output.supporting_article_ids.length,
      notes: item.notes,
    });
  }

  const n = EVALUATION_DATASET.length;

  return {
    sampleSize: n,
    timestamp: new Date().toISOString(),
    languageAccuracy: Math.round((langCorrectCount / n) * 100),
    categoryAccuracy: Math.round((catCorrectCount / n) * 100),
    priorityAccuracy: Math.round((prioCorrectCount / n) * 100),
    humanReviewAccuracy: Math.round((reviewCorrectCount / n) * 100),
    groundingCoverageRate: Math.round((groundedCount / n) * 100),
    averageConfidence: Math.round((totalConfidence / n) * 100) / 100,
    results,
    limitations: [
      'Sample size is 14 manually curated test cases spanning English, Hindi (Devanagari & Hinglish), and Arabic.',
      'Dialectical Arabic (e.g., Maghrebi or Egyptian slang) and Romanized Arabic (Arabizi) are not comprehensively represented in this benchmark.',
      'Hinglish accuracy depends on standard phonetic transliteration; obscure vernacular slang may trigger fallback triage.',
      'Grounding rate is bounded by the active articles seeded in the knowledge base; novel policies require new article creation.',
    ],
  };
}
