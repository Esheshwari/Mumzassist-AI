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

export interface Ticket {
  id: string;
  customer_id?: string;
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
