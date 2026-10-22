import React, { useState } from 'react';
import {
  Search,
  Filter,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  UserCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
} from 'lucide-react';
import { Ticket } from '../types/index.js';

interface TicketInboxProps {
  tickets: Ticket[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  loading: boolean;
  onPageChange: (newPage: number) => void;
  onFilterChange: (filters: {
    status?: string;
    priority?: string;
    category?: string;
    language?: string;
    requiresReview?: boolean;
    search?: string;
  }) => void;
  onSelectTicket: (ticket: Ticket) => void;
  activeFilters: {
    status?: string;
    priority?: string;
    category?: string;
    language?: string;
    requiresReview?: boolean;
    search?: string;
  };
}

export const TicketInbox: React.FC<TicketInboxProps> = ({
  tickets,
  total,
  page,
  pageSize,
  totalPages,
  loading,
  onPageChange,
  onFilterChange,
  onSelectTicket,
  activeFilters,
}) => {
  const [searchInput, setSearchInput] = useState(activeFilters.search || '');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange({ ...activeFilters, search: searchInput });
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return 'text-rose-700 bg-rose-50 border-rose-200';
      case 'High':
        return 'text-orange-700 bg-orange-50 border-orange-200';
      case 'Medium':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      default:
        return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'open':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'in_progress':
        return 'text-purple-700 bg-purple-50 border-purple-200';
      case 'waiting_for_customer':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'resolved':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'escalated':
        return 'text-rose-700 bg-rose-50 border-rose-200';
      default:
        return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const formatStatus = (s: string) => {
    return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const statusTabs = [
    { id: 'All', label: 'All Tickets' },
    { id: 'open', label: 'Open' },
    { id: 'in_progress', label: 'In Progress' },
    { id: 'waiting_for_customer', label: 'Waiting for Customer' },
    { id: 'resolved', label: 'Resolved' },
    { id: 'escalated', label: 'Escalated' },
  ];

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-4">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 pb-3">
          {statusTabs.map((tab) => {
            const isActive = (activeFilters.status || 'All') === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onFilterChange({ ...activeFilters, status: tab.id })}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search & Secondary Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[280px] relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by Ticket ID, customer name, message, or issue summary..."
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50"
            />
          </form>

          <div className="flex flex-wrap items-center gap-2">
            {/* Language Filter */}
            <select
              value={activeFilters.language || 'All'}
              onChange={(e) => onFilterChange({ ...activeFilters, language: e.target.value })}
              className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="All">All Languages</option>
              <option value="English">English</option>
              <option value="Hindi">Hindi (हिन्दी)</option>
              <option value="Arabic">Arabic (العربية)</option>
            </select>

            {/* Priority Filter */}
            <select
              value={activeFilters.priority || 'All'}
              onChange={(e) => onFilterChange({ ...activeFilters, priority: e.target.value })}
              className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="All">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            {/* Category Filter */}
            <select
              value={activeFilters.category || 'All'}
              onChange={(e) => onFilterChange({ ...activeFilters, category: e.target.value })}
              className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="All">All Categories</option>
              <option value="Order and delivery">Order and delivery</option>
              <option value="Payment and billing">Payment and billing</option>
              <option value="Refund and cancellation">Refund and cancellation</option>
              <option value="Account access">Account access</option>
              <option value="Product or service issue">Product or service issue</option>
              <option value="Technical support">Technical support</option>
              <option value="Complaint">Complaint</option>
              <option value="General inquiry">General inquiry</option>
            </select>

            {/* Human Review Filter Toggle */}
            <button
              type="button"
              onClick={() =>
                onFilterChange({
                  ...activeFilters,
                  requiresReview: activeFilters.requiresReview ? undefined : true,
                })
              }
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                activeFilters.requiresReview
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
              <span>Awaiting Review</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tickets Table / List */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-900">Support Ticket Queue</span>
            <span className="text-xs text-slate-500 font-mono">({total} total records)</span>
          </div>
          <span className="text-xs text-slate-400">Click any row to open AI Triage Workspace</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 space-y-3">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <div>Querying PostgreSQL database...</div>
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Layers className="w-8 h-8 text-slate-300 mx-auto" />
            <div className="text-sm font-medium text-slate-700">No tickets found matching criteria</div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Try adjusting your search keywords, status filter, or create a new test ticket.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Ticket ID</th>
                  <th className="py-3 px-4">Customer & Message Preview</th>
                  <th className="py-3 px-4">Language</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Assigned Agent</th>
                  <th className="py-3 px-4 text-right">Age</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {tickets.map((t) => {
                  const isArabic = t.detected_language === 'Arabic';
                  return (
                    <tr
                      key={t.id}
                      onClick={() => onSelectTicket(t)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4 font-mono font-semibold text-indigo-600 group-hover:text-indigo-800">
                        {t.id}
                      </td>
                      <td className="py-3.5 px-4 max-w-md">
                        <div className="font-semibold text-slate-800 flex items-center gap-2">
                          <span>{t.customer_name || 'Anonymous Customer'}</span>
                          {t.requires_human_review && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded" title={t.review_reason || 'Requires Human Review'}>
                              <ShieldAlert className="w-3 h-3 text-amber-600" />
                              Review
                            </span>
                          )}
                        </div>
                        <p
                          className={`text-slate-500 truncate mt-0.5 ${
                            isArabic ? 'font-arabic text-right' : ''
                          }`}
                          dir={isArabic ? 'rtl' : 'ltr'}
                        >
                          {t.original_message}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-medium text-slate-700">{t.detected_language}</span>
                        {isArabic && <span className="ml-1 text-[10px] text-slate-400 font-mono">· RTL</span>}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                        {t.category}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${getPriorityStyle(t.priority)}`}>
                          {t.priority}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${getStatusStyle(t.status)}`}>
                          {formatStatus(t.status)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                        {t.assigned_agent_name ? (
                          <div className="flex items-center gap-1.5">
                            <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                            <span>{t.assigned_agent_name}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-400 whitespace-nowrap tabular-nums">
                        {new Date(t.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Showing Page <span className="font-semibold text-slate-800 font-mono">{page}</span> of{' '}
            <span className="font-semibold text-slate-800 font-mono">{totalPages}</span> ({total} items)
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
