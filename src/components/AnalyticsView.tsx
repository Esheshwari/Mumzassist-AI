import React from 'react';
import {
  BarChart3,
  Clock,
  ShieldAlert,
  Languages,
  CheckCircle2,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { DashboardMetrics, Ticket } from '../types/index.js';

interface AnalyticsViewProps {
  metrics: DashboardMetrics | null;
  tickets: Ticket[];
  loading: boolean;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  metrics,
  tickets,
  loading,
}) => {
  if (loading || !metrics) {
    return <div className="p-8 text-xs text-slate-400">Loading analytics from PostgreSQL...</div>;
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
  } = metrics;

  // Derive sentiment breakdown from loaded tickets
  const sentiments = {
    positive: tickets.filter((t) => t.sentiment === 'positive').length,
    neutral: tickets.filter((t) => t.sentiment === 'neutral').length,
    negative: tickets.filter((t) => t.sentiment === 'negative').length,
    mixed: tickets.filter((t) => t.sentiment === 'mixed').length,
  };

  const humanReviewRate = totalTickets > 0 ? Math.round((awaitingReviewTickets / totalTickets) * 100) : 0;
  const resolutionRate = totalTickets > 0 ? Math.round((tickets.filter(t => t.status === 'resolved').length / totalTickets) * 100) : 0;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Triage Intelligence & Operations Analytics</h2>
        <p className="text-xs text-slate-500 mt-1">
          Operational telemetry and performance figures computed directly from stored PostgreSQL ticket records.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Triage Throughput</div>
          <div className="text-3xl font-bold text-slate-900 font-mono mt-2 tabular-nums">{totalTickets}</div>
          <div className="text-xs text-slate-400 mt-1">100% processed via AI triage</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Human Escalation Rate</div>
          <div className="text-3xl font-bold text-amber-700 font-mono mt-2 tabular-nums">{humanReviewRate}%</div>
          <div className="text-xs text-slate-400 mt-1">{awaitingReviewTickets} tickets flagged for safety / review</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg First-Response Velocity</div>
          <div className="text-3xl font-bold text-indigo-700 font-mono mt-2 tabular-nums">
            {averageFirstResponseTimeMinutes !== null ? `${averageFirstResponseTimeMinutes}m` : 'N/A'}
          </div>
          <div className="text-xs text-slate-400 mt-1">From creation to agent approval</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Resolution Rate</div>
          <div className="text-3xl font-bold text-emerald-700 font-mono mt-2 tabular-nums">{resolutionRate}%</div>
          <div className="text-xs text-slate-400 mt-1">{tickets.filter(t => t.status === 'resolved').length} resolved tickets</div>
        </div>
      </div>

      {/* Grid: Multilingual Share & Sentiment Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Languages Breakdown */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Multilingual Volume Distribution</h3>
              <p className="text-xs text-slate-500">Distribution across supported language channels</p>
            </div>
            <Languages className="w-5 h-5 text-indigo-600" />
          </div>

          <div className="space-y-3 pt-2">
            {ticketsByLanguage.map((item) => {
              const pct = totalTickets > 0 ? Math.round((item.count / totalTickets) * 100) : 0;
              return (
                <div key={item.language} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{item.language}</span>
                    <span className="font-mono text-slate-500 tabular-nums">
                      {item.count} tickets ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all"
                      style={{ width: `${Math.max(5, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sentiment Analysis Breakdown */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Customer Sentiment Spectrum</h3>
              <p className="text-xs text-slate-500">Estimated tone from incoming customer messages</p>
            </div>
            <TrendingUp className="w-5 h-5 text-slate-400" />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-xl">
              <span className="text-xs font-semibold text-emerald-800 block">Positive Tone</span>
              <span className="text-2xl font-bold font-mono text-emerald-700 mt-1 block tabular-nums">
                {sentiments.positive}
              </span>
              <span className="text-[11px] text-emerald-600">Compliments, resolutions</span>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-xs font-semibold text-slate-700 block">Neutral Inquiry</span>
              <span className="text-2xl font-bold font-mono text-slate-800 mt-1 block tabular-nums">
                {sentiments.neutral}
              </span>
              <span className="text-[11px] text-slate-500">Tracking, standard inquiries</span>
            </div>

            <div className="p-4 bg-rose-50/70 border border-rose-200/80 rounded-xl">
              <span className="text-xs font-semibold text-rose-800 block">Negative / Frustrated</span>
              <span className="text-2xl font-bold font-mono text-rose-700 mt-1 block tabular-nums">
                {sentiments.negative}
              </span>
              <span className="text-[11px] text-rose-600">Delays, damaged, double debits</span>
            </div>

            <div className="p-4 bg-purple-50/70 border border-purple-200/80 rounded-xl">
              <span className="text-xs font-semibold text-purple-800 block">Mixed Sentiments</span>
              <span className="text-2xl font-bold font-mono text-purple-700 mt-1 block tabular-nums">
                {sentiments.mixed}
              </span>
              <span className="text-[11px] text-purple-600">Multi-faceted feedback</span>
            </div>
          </div>
        </div>
      </div>

      {/* Safety & Grounding Governance Card */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-indigo-600" />
          <h3 className="text-sm font-semibold text-slate-900">Safety & Grounding Governance Invariants</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
          <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
            <span className="font-semibold text-slate-800 block">Zero Autonomous Dispatch</span>
            <p>Every response is queued as a draft for human agent review, editing, or approval before reaching the customer.</p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
            <span className="font-semibold text-slate-800 block">Strict Knowledge Grounding</span>
            <p>Responses state only verified policies from active knowledge base articles; missing evidence flags human review.</p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
            <span className="font-semibold text-slate-800 block">Fraud & Escalation Circuit Breaker</span>
            <p>Unauthorized charges, legal disputes, and high-risk safety reports automatically escalate to Critical priority.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
