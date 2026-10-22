import React, { useState } from 'react';
import {
  X,
  Sparkles,
  ShieldAlert,
  BookOpen,
  Check,
  Edit3,
  ThumbsDown,
  RotateCcw,
  Clock,
  User,
  Tag,
  AlertCircle,
  FileText,
  Send,
  ExternalLink,
} from 'lucide-react';
import { Ticket, Agent } from '../types/index.js';

interface TicketDetailModalProps {
  ticket: Ticket | null;
  agents: Agent[];
  onClose: () => void;
  onUpdateStatus: (ticketId: string, status: Ticket['status']) => Promise<void>;
  onUpdatePriority: (ticketId: string, priority: string) => Promise<void>;
  onAssignAgent: (ticketId: string, agentId: string | null) => Promise<void>;
  onResponseAction: (ticketId: string, action: 'approve' | 'edit' | 'reject', editedText?: string) => Promise<void>;
  onRerunAnalysis: (ticketId: string) => Promise<void>;
}

export const TicketDetailModal: React.FC<TicketDetailModalProps> = ({
  ticket,
  agents,
  onClose,
  onUpdateStatus,
  onUpdatePriority,
  onAssignAgent,
  onResponseAction,
  onRerunAnalysis,
}) => {
  if (!ticket) return null;

  const [activeTab, setActiveTab] = useState<'workspace' | 'history'>('workspace');
  const [isEditingResponse, setIsEditingResponse] = useState(false);
  const [editedResponse, setEditedResponse] = useState(ticket.suggested_response || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isArabic = ticket.detected_language === 'Arabic';
  const latestAnalysis = ticket.analyses?.[0];

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      await onResponseAction(ticket.id, 'approve');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = async () => {
    setIsSubmitting(true);
    try {
      await onResponseAction(ticket.id, 'edit', editedResponse);
      setIsEditingResponse(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    setIsSubmitting(true);
    try {
      await onResponseAction(ticket.id, 'reject');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRerun = async () => {
    setIsSubmitting(true);
    try {
      await onRerunAnalysis(ticket.id);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4 bg-slate-50/60">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200">
              {ticket.id}
            </span>
            <div>
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <span>{ticket.customer_name || 'Customer Ticket'}</span>
                {ticket.requires_human_review && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-amber-800 bg-amber-100/80 border border-amber-300 px-2 py-0.5 rounded-md">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                    Human Review Flagged
                  </span>
                )}
              </h2>
              <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                <span>Created {new Date(ticket.created_at).toLocaleString()}</span>
                {ticket.customer_email && <span>· {ticket.customer_email}</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Status Select */}
            <select
              value={ticket.status}
              onChange={(e) => onUpdateStatus(ticket.id, e.target.value as Ticket['status'])}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="open">Status: Open</option>
              <option value="in_progress">Status: In Progress</option>
              <option value="waiting_for_customer">Status: Waiting for Customer</option>
              <option value="resolved">Status: Resolved</option>
              <option value="escalated">Status: Escalated</option>
            </select>

            {/* Priority Select */}
            <select
              value={ticket.priority}
              onChange={(e) => onUpdatePriority(ticket.id, e.target.value)}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="Critical">Priority: Critical</option>
              <option value="High">Priority: High</option>
              <option value="Medium">Priority: Medium</option>
              <option value="Low">Priority: Low</option>
            </select>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Strip */}
        <div className="px-6 border-b border-slate-200 flex items-center justify-between text-xs bg-white">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setActiveTab('workspace')}
              className={`py-3 font-semibold border-b-2 transition-colors ${
                activeTab === 'workspace'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Triage Workspace
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-3 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Audit Trail & Analyses</span>
              <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                {ticket.events?.length || 0}
              </span>
            </button>
          </div>

          <button
            onClick={handleRerun}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-semibold disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-spin' : ''}`} />
            <span>Re-run AI Triage</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'workspace' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column (5 cols): Original Message & Customer Context */}
              <div className="lg:col-span-5 space-y-5">
                {/* Original Customer Message Box */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Original Customer Message
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {ticket.detected_language}
                      </span>
                      {isArabic && (
                        <span className="text-[10px] font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                          RTL
                        </span>
                      )}
                    </div>
                  </div>

                  <div
                    className={`p-4 bg-white border border-slate-200/80 rounded-lg text-sm text-slate-800 leading-relaxed whitespace-pre-wrap ${
                      isArabic ? 'font-arabic text-right' : ''
                    }`}
                    dir={isArabic ? 'rtl' : 'ltr'}
                  >
                    {ticket.original_message}
                  </div>
                </div>

                {/* AI Extracted Entities & Intent */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    AI Intent & Extracted Entities
                  </span>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-slate-400">Customer Intent:</span>
                      <p className="font-medium text-slate-800 mt-0.5">
                        {latestAnalysis?.intent || ticket.summary || 'General Customer Support Inquiry'}
                      </p>
                    </div>

                    {latestAnalysis?.key_entities && Object.keys(latestAnalysis.key_entities).length > 0 && (
                      <div className="pt-2 border-t border-slate-100">
                        <span className="text-slate-400">Extracted Entities:</span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {Object.entries(latestAnalysis.key_entities).map(([key, val]) => (
                            <span
                              key={key}
                              className="text-[11px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200"
                            >
                              {key}: {String(val)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Assignee & Meta */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Assigned Agent
                  </span>
                  <select
                    value={ticket.assigned_agent_id || ''}
                    onChange={(e) => onAssignAgent(ticket.id, e.target.value || null)}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white text-slate-700"
                  >
                    <option value="">Unassigned</option>
                    {agents.map((ag) => (
                      <option key={ag.id} value={ag.id}>
                        {ag.name} ({ag.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Right Column (7 cols): AI Triage, Knowledge Base Grounding & Suggested Response */}
              <div className="lg:col-span-7 space-y-5">
                {/* AI Analysis Summary Card */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      <span className="text-sm font-semibold text-slate-900">AI Triage Classification</span>
                    </div>

                    {latestAnalysis && (
                      <div className="flex items-center gap-2" title="Model-provided estimate, not calibrated probability">
                        <span className="text-xs text-slate-400">AI Confidence:</span>
                        <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                          {Math.round(latestAnalysis.confidence * 100)}%
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-slate-400 block">Category</span>
                      <span className="font-semibold text-slate-800 mt-0.5 block">{ticket.category}</span>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-slate-400 block">Priority</span>
                      <span className="font-semibold text-slate-800 mt-0.5 block">{ticket.priority}</span>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-slate-400 block">Sentiment</span>
                      <span className="font-semibold text-slate-800 capitalize mt-0.5 block">{ticket.sentiment}</span>
                    </div>
                  </div>

                  {latestAnalysis?.recommended_action && (
                    <div className="text-xs bg-indigo-50/50 border border-indigo-100 rounded-lg p-3">
                      <span className="font-semibold text-indigo-900 block">Recommended Agent Action:</span>
                      <span className="text-indigo-800 mt-0.5 block">{latestAnalysis.recommended_action}</span>
                    </div>
                  )}

                  {/* Human Review Alert Banner if applicable */}
                  {ticket.requires_human_review && (
                    <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg space-y-1">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Requires Human Review Before Dispatch</span>
                      </div>
                      <p className="text-xs text-amber-800 leading-relaxed">
                        {ticket.review_reason || 'Identified as high-risk, ambiguous, or lacks complete knowledge base coverage.'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Grounded Knowledge Base Evidence */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-slate-500" />
                      <span className="text-sm font-semibold text-slate-900">Grounded Knowledge Base References</span>
                    </div>
                    <span className="text-xs font-mono text-slate-400">
                      {ticket.article_references?.length || 0} cited articles
                    </span>
                  </div>

                  {ticket.article_references && ticket.article_references.length > 0 ? (
                    <div className="space-y-2">
                      {ticket.article_references.map((article) => (
                        <div
                          key={article.id}
                          className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg text-xs space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-800">{article.title}</span>
                            <span className="font-mono text-[10px] text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                              {article.id}
                            </span>
                          </div>
                          <p className="text-slate-600 line-clamp-2 leading-relaxed">{article.content}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-lg border border-slate-100">
                      No matching knowledge base article found. Response drafted with cautionary review flag.
                    </div>
                  )}
                </div>

                {/* Suggested Response Assistant */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Send className="w-4 h-4 text-indigo-600" />
                        <span className="text-sm font-semibold text-slate-900">
                          AI Suggested Response Assistant
                        </span>
                        <span className="text-xs font-mono text-slate-400">
                          ({ticket.detected_language})
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Drafted in customer's language. Never sent to customer automatically.
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${
                        ticket.response_status === 'approved'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : ticket.response_status === 'edited'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : ticket.response_status === 'rejected'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}>
                        {ticket.response_status}
                      </span>
                    </div>
                  </div>

                  {/* Response Text / Editor */}
                  {isEditingResponse ? (
                    <div className="space-y-2">
                      <textarea
                        value={editedResponse}
                        onChange={(e) => setEditedResponse(e.target.value)}
                        rows={5}
                        className={`w-full p-3 text-xs border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 ${
                          isArabic ? 'font-arabic text-right' : ''
                        }`}
                        dir={isArabic ? 'rtl' : 'ltr'}
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setIsEditingResponse(false)}
                          className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveEdit}
                          disabled={isSubmitting}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
                        >
                          Save Draft
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`p-4 bg-slate-50/80 border border-slate-200 rounded-lg text-xs text-slate-800 leading-relaxed whitespace-pre-wrap ${
                        isArabic ? 'font-arabic text-right' : ''
                      }`}
                      dir={isArabic ? 'rtl' : 'ltr'}
                    >
                      {ticket.suggested_response || 'No suggested response available yet. Click Re-run AI Triage.'}
                    </div>
                  )}

                  {/* Action Buttons for Human Agent */}
                  {!isEditingResponse && (
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditedResponse(ticket.suggested_response || '');
                            setIsEditingResponse(true);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit Draft</span>
                        </button>
                        <button
                          onClick={handleReject}
                          disabled={isSubmitting}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 disabled:opacity-50"
                        >
                          <ThumbsDown className="w-3.5 h-3.5" />
                          <span>Reject Draft</span>
                        </button>
                      </div>

                      <button
                        onClick={handleApprove}
                        disabled={isSubmitting || ticket.response_status === 'approved'}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 rounded-lg shadow-xs transition-colors"
                      >
                        <Check className="w-4 h-4" />
                        <span>{ticket.response_status === 'approved' ? 'Response Approved' : 'Approve & Queue'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* History & Audit Trail Tab */
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
                <h3 className="text-sm font-semibold text-slate-900">Complete Event & Audit Timeline</h3>
                <div className="space-y-4">
                  {ticket.events && ticket.events.length > 0 ? (
                    ticket.events.map((evt, idx) => (
                      <div key={evt.id} className="flex items-start gap-4 text-xs">
                        <div className="flex flex-col items-center">
                          <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                          {idx !== (ticket.events?.length || 0) - 1 && (
                            <div className="w-0.5 h-10 bg-slate-200 my-1" />
                          )}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-800">{evt.actor}</span>
                            <span className="font-mono text-slate-400">
                              {new Date(evt.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-slate-600">{evt.description}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-400 text-xs italic">No event history found.</div>
                  )}
                </div>
              </div>

              {/* Analysis Snapshots */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
                <h3 className="text-sm font-semibold text-slate-900">Analysis Snapshots ({ticket.analyses?.length || 0})</h3>
                <div className="space-y-3">
                  {ticket.analyses?.map((anl) => (
                    <div key={anl.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-slate-500">{anl.id}</span>
                        <span className="font-mono text-slate-400">{new Date(anl.created_at).toLocaleString()}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        <div>
                          <span className="text-slate-400 block">Language</span>
                          <span className="font-medium text-slate-800">{anl.detected_language}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Category</span>
                          <span className="font-medium text-slate-800">{anl.category}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Priority</span>
                          <span className="font-medium text-slate-800">{anl.priority}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Confidence</span>
                          <span className="font-mono font-medium text-slate-800">{Math.round(anl.confidence * 100)}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
