import React from 'react';
import {
  Inbox,
  AlertTriangle,
  Clock,
  ShieldAlert,
  ArrowRight,
  Languages,
  Layers,
  Sparkles,
} from 'lucide-react';
import { DashboardMetrics, Ticket } from '../types/index.js';

interface OverviewDashboardProps {
  metrics: DashboardMetrics | null;
  loading: boolean;
  onNavigateToInbox: (filter?: { status?: string; priority?: string; requiresReview?: boolean }) => void;
  onOpenTicket: (ticketId: string) => void;
  recentTickets: Ticket[];
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  metrics,
  loading,
  onNavigateToInbox,
  onOpenTicket,
  recentTickets,
}) => {
  if (loading || !metrics) {
    return (
      <div className="p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white border border-slate-200 rounded-xl p-5 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 bg-white border border-slate-200 rounded-xl animate-pulse" />
          <div className="h-72 bg-white border border-slate-200 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  const {
    totalTickets,
    openTickets,
    urgentTickets,
    awaitingReviewTickets,
    averageFirstResponseTimeMinutes,
    ticketsByCategory,
    ticketsByLanguage,
    priorityDistribution,
    recentActivity,
  } = metrics;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Demo Notice Banner */}
      <div className="flex items-center justify-between px-4 py-3 bg-indigo-50/70 border border-indigo-200/60 rounded-xl text-xs text-indigo-900">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>
            <strong>MumzAssist.A AI Triage Engine Active:</strong> Demonstrating multilingual triage across English, Hindi, and Arabic with strict grounded knowledge retrieval and human-in-the-loop validation.
          </span>
        </div>
        <span className="text-[11px] font-mono text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200">
          PostgreSQL Storage
        </span>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tickets */}
        <div
          onClick={() => onNavigateToInbox()}
          className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-5 shadow-2xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Tickets</span>
            <div className="p-2 bg-slate-50 text-slate-600 rounded-lg group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
              <Inbox className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 font-mono tabular-nums">{totalTickets}</span>
            <span className="text-xs text-slate-500">recorded</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">Click to browse all tickets</div>
        </div>

        {/* Open Tickets */}
        <div
          onClick={() => onNavigateToInbox({ status: 'open' })}
          className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-5 shadow-2xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Queue</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-blue-700 font-mono tabular-nums">{openTickets}</span>
            <span className="text-xs text-slate-500">in triage</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">Open or in-progress status</div>
        </div>

        {/* Urgent & High Priority */}
        <div
          onClick={() => onNavigateToInbox({ priority: 'High' })}
          className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-5 shadow-2xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">High & Urgent</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg group-hover:bg-rose-100 transition-colors">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-rose-600 font-mono tabular-nums">{urgentTickets}</span>
            <span className="text-xs text-slate-500">require priority</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">Critical & High priority items</div>
        </div>

        {/* Human Review Needed */}
        <div
          onClick={() => onNavigateToInbox({ requiresReview: true })}
          className="bg-white border border-amber-200/80 hover:border-amber-300 rounded-xl p-5 shadow-2xs transition-all cursor-pointer group bg-amber-50/20"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">Human Review</span>
            <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-amber-700 font-mono tabular-nums">{awaitingReviewTickets}</span>
            <span className="text-xs text-amber-600">flagged</span>
          </div>
          <div className="mt-2 text-xs text-amber-700/80 font-medium">Safety, fraud, or ambiguous cases</div>
        </div>
      </div>

      {/* Average Response Time & Performance Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-100 rounded-lg text-slate-700">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900">Average First-Response Velocity</div>
            <div className="text-xs text-slate-500">Calculated strictly from approved response timestamps in PostgreSQL</div>
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          {averageFirstResponseTimeMinutes !== null ? (
            <>
              <span className="text-2xl font-bold font-mono text-indigo-700 tabular-nums">
                {averageFirstResponseTimeMinutes}
              </span>
              <span className="text-sm text-slate-600 font-medium">minutes</span>
            </>
          ) : (
            <span className="text-sm text-slate-400 italic">
              Awaiting first agent-approved response
            </span>
          )}
        </div>
      </div>

      {/* Grid: Categories & Languages */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Breakdown (2 Cols) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Ticket Volume by Issue Category</h3>
              <p className="text-xs text-slate-500 mt-0.5">Distribution of incoming triage topics</p>
            </div>
            <span className="text-xs font-mono text-slate-400">{ticketsByCategory.length} active categories</span>
          </div>

          <div className="space-y-3.5">
            {ticketsByCategory.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">No ticket records in database.</div>
            ) : (
              ticketsByCategory.map((cat) => {
                const pct = totalTickets > 0 ? Math.round((cat.count / totalTickets) * 100) : 0;
                return (
                  <div key={cat.category} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700">{cat.category}</span>
                      <span className="font-mono text-slate-500 tabular-nums">
                        {cat.count} tickets ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(4, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Language & Priority Breakdown (1 Col) */}
        <div className="space-y-6">
          {/* Languages */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">Detected Languages</h3>
              <Languages className="w-4 h-4 text-slate-400" />
            </div>

            <div className="space-y-3">
              {ticketsByLanguage.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-400">No language data.</div>
              ) : (
                ticketsByLanguage.map((lang) => {
                  const pct = totalTickets > 0 ? Math.round((lang.count / totalTickets) * 100) : 0;
                  const getSubLabel = (l: string) => {
                    if (l === 'Arabic') return 'العربية · RTL';
                    if (l === 'Hindi') return 'हिन्दी & Hinglish';
                    return 'English';
                  };

                  return (
                    <div key={lang.language} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg">
                      <div>
                        <div className="text-sm font-semibold text-slate-800">{lang.language}</div>
                        <div className="text-xs text-slate-500">{getSubLabel(lang.language)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-base font-bold font-mono text-slate-900 tabular-nums">{lang.count}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{pct}%</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Priority Distribution */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">Priority Distribution</h3>
            <div className="grid grid-cols-4 gap-2 text-center">
              {['Critical', 'High', 'Medium', 'Low'].map((prio) => {
                const count = priorityDistribution.find((p) => p.priority === prio)?.count || 0;
                const getColors = (p: string) => {
                  if (p === 'Critical') return 'bg-rose-50 text-rose-700 border-rose-200';
                  if (p === 'High') return 'bg-orange-50 text-orange-700 border-orange-200';
                  if (p === 'Medium') return 'bg-blue-50 text-blue-700 border-blue-200';
                  return 'bg-slate-50 text-slate-700 border-slate-200';
                };
                return (
                  <div key={prio} className={`p-2 rounded-lg border text-xs ${getColors(prio)}`}>
                    <div className="font-semibold">{prio}</div>
                    <div className="text-lg font-bold font-mono mt-1 tabular-nums">{count}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Triage Activity Feed */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Recent Triage & Audit Activity</h3>
            <p className="text-xs text-slate-500">Live operational log persisted to PostgreSQL audit trail</p>
          </div>
          <button
            onClick={() => onNavigateToInbox()}
            className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
          >
            <span>View All Tickets</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {recentActivity.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">No recent activity logs.</div>
          ) : (
            recentActivity.slice(0, 6).map((event) => (
              <div key={event.id} className="py-3 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-semibold text-indigo-600 hover:underline cursor-pointer" onClick={() => onOpenTicket(event.ticket_id)}>
                      {event.ticket_id}
                    </span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs font-medium text-slate-700">{event.actor}</span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-[11px] font-mono text-slate-400 uppercase">{event.event_type}</span>
                  </div>
                  <p className="text-xs text-slate-600">{event.description}</p>
                </div>
                <div className="text-[11px] font-mono text-slate-400 whitespace-nowrap">
                  {new Date(event.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
