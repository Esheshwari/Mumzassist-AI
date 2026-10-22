import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header.js';
import { Sidebar } from './components/Sidebar.js';
import { OverviewDashboard } from './components/OverviewDashboard.js';
import { TicketInbox } from './components/TicketInbox.js';
import { KnowledgeBaseView } from './components/KnowledgeBaseView.js';
import { AnalyticsView } from './components/AnalyticsView.js';
import { EvaluationView } from './components/EvaluationView.js';
import { SettingsView } from './components/SettingsView.js';
import { TicketDetailModal } from './components/TicketDetailModal.js';
import { NewTicketModal } from './components/NewTicketModal.js';
import { Ticket, DashboardMetrics, KnowledgeBaseArticle, Agent } from './types/index.js';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inbox' | 'kb' | 'analytics' | 'eval' | 'settings'>('dashboard');
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [totalTickets, setTotalTickets] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [articles, setArticles] = useState<KnowledgeBaseArticle[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters for inbox
  const [filters, setFilters] = useState<{
    status?: string;
    priority?: string;
    category?: string;
    language?: string;
    requiresReview?: boolean;
    search?: string;
  }>({});

  // Modals
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  // Data fetching functions
  const fetchMetrics = useCallback(async () => {
    try {
      const res = await fetch('/api/metrics');
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }
    } catch (err) {
      console.error('Error fetching metrics:', err);
    }
  }, []);

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('pageSize', pageSize.toString());

      if (filters.status && filters.status !== 'All') params.set('status', filters.status);
      if (filters.priority && filters.priority !== 'All') params.set('priority', filters.priority);
      if (filters.category && filters.category !== 'All') params.set('category', filters.category);
      if (filters.language && filters.language !== 'All') params.set('language', filters.language);
      if (filters.requiresReview !== undefined) params.set('requiresReview', filters.requiresReview.toString());
      if (filters.search) params.set('search', filters.search);

      const res = await fetch(`/api/tickets?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets);
        setTotalTickets(data.total);
        setTotalPages(data.totalPages);
      }
    } catch (err) {
      console.error('Error fetching tickets:', err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filters]);

  const fetchArticles = useCallback(async () => {
    try {
      const res = await fetch('/api/knowledge-base');
      if (res.ok) {
        const data = await res.json();
        setArticles(data);
      }
    } catch (err) {
      console.error('Error fetching KB articles:', err);
    }
  }, []);

  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch('/api/agents');
      if (res.ok) {
        const data = await res.json();
        setAgents(data);
      }
    } catch (err) {
      console.error('Error fetching agents:', err);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    fetchArticles();
    fetchAgents();
  }, [fetchMetrics, fetchArticles, fetchAgents]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Modal actions
  const handleOpenTicket = async (ticketId: string) => {
    try {
      const res = await fetch(`/api/tickets/${ticketId}`);
      if (res.ok) {
        const full = await res.json();
        setSelectedTicket(full);
      }
    } catch (err) {
      console.error('Error fetching single ticket:', err);
    }
  };

  const handleCreateTicket = async (data: {
    customer_name: string;
    customer_email?: string;
    customer_phone?: string;
    original_message: string;
    selected_language?: string;
  }) => {
    const res = await fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create ticket');
    }

    const created = await res.json();
    await fetchMetrics();
    await fetchTickets();
    setSelectedTicket(created);
  };

  const handleUpdateStatus = async (ticketId: string, status: Ticket['status']) => {
    const res = await fetch(`/api/tickets/${ticketId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setSelectedTicket(updated);
      fetchTickets();
      fetchMetrics();
    }
  };

  const handleUpdatePriority = async (ticketId: string, priority: string) => {
    const res = await fetch(`/api/tickets/${ticketId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priority }),
    });
    if (res.ok) {
      const updated = await res.json();
      setSelectedTicket(updated);
      fetchTickets();
      fetchMetrics();
    }
  };

  const handleAssignAgent = async (ticketId: string, agentId: string | null) => {
    const res = await fetch(`/api/tickets/${ticketId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assigned_agent_id: agentId }),
    });
    if (res.ok) {
      const updated = await res.json();
      setSelectedTicket(updated);
      fetchTickets();
    }
  };

  const handleResponseAction = async (ticketId: string, action: 'approve' | 'edit' | 'reject', editedText?: string) => {
    const res = await fetch(`/api/tickets/${ticketId}/response`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, editedResponse: editedText }),
    });
    if (res.ok) {
      const updated = await res.json();
      setSelectedTicket(updated);
      fetchTickets();
      fetchMetrics();
    }
  };

  const handleRerunAnalysis = async (ticketId: string) => {
    const res = await fetch(`/api/tickets/${ticketId}/analyze`, {
      method: 'POST',
    });
    if (res.ok) {
      const updated = await res.json();
      setSelectedTicket(updated);
      fetchTickets();
      fetchMetrics();
    }
  };

  const handleCreateArticle = async (data: any) => {
    const res = await fetch('/api/knowledge-base', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      fetchArticles();
    }
  };

  const handleUpdateArticle = async (id: string, data: any) => {
    const res = await fetch(`/api/knowledge-base/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      fetchArticles();
    }
  };

  const handleReseed = async () => {
    await fetch('/api/seed', { method: 'POST' });
    await fetchMetrics();
    await fetchTickets();
    await fetchArticles();
  };

  const handleNavigateToInboxWithFilter = (f?: { status?: string; priority?: string; requiresReview?: boolean }) => {
    setFilters(f || {});
    setPage(1);
    setActiveTab('inbox');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Top Bar */}
      <Header
        activeTab={activeTab}
        onNewTicketClick={() => setIsNewTicketOpen(true)}
        reviewCount={metrics?.awaitingReviewTickets}
        onReviewFilterClick={() => handleNavigateToInboxWithFilter({ requiresReview: true })}
      />

      {/* Main Layout Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab as any);
          }}
          openTicketCount={metrics?.openTickets}
        />

        {/* Viewport Content */}
        <main className="flex-1 overflow-y-auto bg-slate-50">
          {activeTab === 'dashboard' && (
            <OverviewDashboard
              metrics={metrics}
              loading={loading && !metrics}
              onNavigateToInbox={handleNavigateToInboxWithFilter}
              onOpenTicket={handleOpenTicket}
              recentTickets={tickets}
            />
          )}

          {activeTab === 'inbox' && (
            <TicketInbox
              tickets={tickets}
              total={totalTickets}
              page={page}
              pageSize={pageSize}
              totalPages={totalPages}
              loading={loading}
              onPageChange={(p) => setPage(p)}
              onFilterChange={(newFilters) => {
                setFilters(newFilters);
                setPage(1);
              }}
              onSelectTicket={(ticket) => handleOpenTicket(ticket.id)}
              activeFilters={filters}
            />
          )}

          {activeTab === 'kb' && (
            <KnowledgeBaseView
              articles={articles}
              loading={loading && articles.length === 0}
              onRefresh={fetchArticles}
              onCreateArticle={handleCreateArticle}
              onUpdateArticle={handleUpdateArticle}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsView
              metrics={metrics}
              tickets={tickets}
              loading={loading && !metrics}
            />
          )}

          {activeTab === 'eval' && <EvaluationView />}

          {activeTab === 'settings' && <SettingsView onReseed={handleReseed} />}
        </main>
      </div>

      {/* Modals */}
      <NewTicketModal
        isOpen={isNewTicketOpen}
        onClose={() => setIsNewTicketOpen(false)}
        onSubmit={handleCreateTicket}
      />

      <TicketDetailModal
        ticket={selectedTicket}
        agents={agents}
        onClose={() => setSelectedTicket(null)}
        onUpdateStatus={handleUpdateStatus}
        onUpdatePriority={handleUpdatePriority}
        onAssignAgent={handleAssignAgent}
        onResponseAction={handleResponseAction}
        onRerunAnalysis={handleRerunAnalysis}
      />
    </div>
  );
}
