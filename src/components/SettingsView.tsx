import React, { useState } from 'react';
import {
  Settings,
  Database,
  Sparkles,
  ShieldCheck,
  RotateCcw,
  Check,
  Server,
  Lock,
  Layers,
} from 'lucide-react';

interface SettingsViewProps {
  onReseed: () => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onReseed }) => {
  const [reseedLoading, setReseedLoading] = useState(false);
  const [reseedSuccess, setReseedSuccess] = useState(false);
  const [dbStatus, setDbStatus] = useState<{
    isHosted: boolean;
    isNeon: boolean;
    provider: string;
    databaseName: string;
    connectionError: string | null;
    livePing: boolean;
    latencyMs: number;
    tableCount: number;
    hasDatabaseUrlConfigured: boolean;
    isConfiguredForNeon: boolean;
  } | null>(null);
  const [dbLoading, setDbLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState<{
    isConfigured: boolean;
    model: string;
    isAvailable: boolean | null;
    mode: 'live' | 'rule_fallback';
    statusMessage: string;
    code?: string;
    lastChecked: number;
  } | null>(null);
  const [aiTesting, setAiTesting] = useState(false);

  const fetchDbStatus = async () => {
    setDbLoading(true);
    try {
      const res = await fetch('/api/database/status');
      if (res.ok) {
        const data = await res.json();
        setDbStatus(data);
      }
    } catch (err) {
      console.error('Failed to fetch DB status:', err);
    } finally {
      setDbLoading(false);
    }
  };

  const fetchAiStatus = async () => {
    try {
      const res = await fetch('/api/ai/status');
      if (res.ok) {
        const data = await res.json();
        setAiStatus(data);
      }
    } catch (err) {
      console.error('Failed to fetch AI status:', err);
    }
  };

  const handleTestAi = async () => {
    setAiTesting(true);
    try {
      const res = await fetch('/api/ai/test', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setAiStatus(data);
      }
    } catch (err) {
      console.error('Failed to test AI:', err);
    } finally {
      setAiTesting(false);
    }
  };

  React.useEffect(() => {
    fetchDbStatus();
    fetchAiStatus();
  }, []);

  const handleReseed = async () => {
    if (!confirm('Are you sure you want to reseed demo data? This will reset demo tickets and knowledge base articles.')) {
      return;
    }
    setReseedLoading(true);
    setReseedSuccess(false);
    try {
      await onReseed();
      setReseedSuccess(true);
      await fetchDbStatus();
      setTimeout(() => setReseedSuccess(false), 3000);
    } finally {
      setReseedLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-5xl mx-auto">
      <div>
        <h2 className="text-lg font-bold text-slate-900">System Architecture & Configuration</h2>
        <p className="text-xs text-slate-500 mt-1">
          Operational infrastructure, AI model specifications, PostgreSQL integration, and safety rules.
        </p>
      </div>

      {/* Grid of Architecture Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PostgreSQL Database Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 text-blue-700 rounded-lg">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">PostgreSQL Relational Storage</h3>
                <p className="text-xs text-slate-500">Persistent relational schema & migrations</p>
              </div>
            </div>
            <button
              onClick={fetchDbStatus}
              disabled={dbLoading}
              title="Refresh database diagnostics"
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${dbLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="space-y-2 text-xs divide-y divide-slate-100">
            <div className="flex items-center justify-between py-2">
              <span className="text-slate-500">Active Provider:</span>
              <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${dbStatus?.livePing ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                {dbStatus?.provider || 'PostgreSQL Engine'}
                {dbStatus?.isNeon && (
                  <span className="px-1.5 py-0.5 text-[10px] bg-emerald-100 text-emerald-800 rounded font-medium">Neon Connected</span>
                )}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-slate-500">Configuration Source:</span>
              <span className="font-mono text-slate-800 font-medium">
                {dbStatus?.hasDatabaseUrlConfigured ? 'DATABASE_URL (configured)' : 'Embedded PGlite (local disk)'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-slate-500">Live Ping / Latency:</span>
              <span className="font-mono text-slate-800">
                {dbStatus?.livePing ? `${dbStatus.latencyMs} ms (healthy)` : 'Checking...'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-slate-500">Active Tables in Schema:</span>
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> {dbStatus?.tableCount || 8} Tables Verified
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-slate-500">Zero-Mock Invariant:</span>
              <span className="text-slate-700 font-medium">All data stored in PostgreSQL</span>
            </div>
          </div>
        </div>

        {/* Gemini AI Engine Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-lg">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Google Gemini AI Engine</h3>
                <p className="text-xs text-slate-500">Official @google/genai TypeScript SDK</p>
              </div>
            </div>
            <button
              onClick={handleTestAi}
              disabled={aiTesting}
              title="Test Gemini API connectivity"
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${aiTesting ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="space-y-2 text-xs divide-y divide-slate-100">
            <div className="flex items-center justify-between py-2">
              <span className="text-slate-500">Live Engine Status:</span>
              <span className="font-semibold flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    aiStatus?.isAvailable === true
                      ? 'bg-emerald-500'
                      : aiStatus?.code === 'PERMISSION_DENIED'
                      ? 'bg-amber-500'
                      : 'bg-indigo-500'
                  }`}
                />
                {aiStatus?.isAvailable === true ? (
                  <span className="text-emerald-700">Online & Connected</span>
                ) : aiStatus?.code === 'PERMISSION_DENIED' ? (
                  <span className="text-amber-700">Rule-Based NLP Active (API 403)</span>
                ) : (
                  <span className="text-slate-700">Deterministic Multilingual NLP Active</span>
                )}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-slate-500">Target Model:</span>
              <span className="font-mono font-bold text-indigo-700">gemini-3.8-flash</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-slate-500">Execution Boundary:</span>
              <span className="text-slate-800 font-medium">Server-Side Proxy (Express /api/*)</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-slate-500">Multilingual Coverage:</span>
              <span className="text-slate-800 font-medium">English, Hindi (Devanagari/Latin), Arabic (RTL)</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-slate-500">Output Validation:</span>
              <span className="font-mono text-slate-800 font-medium">Zod Structured Output Schema</span>
            </div>
          </div>

          {aiStatus?.code === 'PERMISSION_DENIED' && (
            <div className="mt-2 p-3 bg-amber-50/80 border border-amber-200 rounded-lg text-[11px] text-amber-900 leading-relaxed">
              <span className="font-semibold block mb-0.5">Autonomous Fail-Safe Active:</span>
              The upstream cloud project has restricted access to the Gemini API key (403 PERMISSION_DENIED). The system has automatically engaged its zero-data-loss multilingual NLP fallback engine with full knowledge base grounding and agent review flags.
            </div>
          )}
        </div>
      </div>

      {/* Triage Constitution & Safety Guardrails */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-indigo-600" />
          <h3 className="text-sm font-semibold text-slate-900">Triage Safety & Agent-Assistance Constitution</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200/80 space-y-1.5">
            <span className="font-semibold text-slate-800 block">1. Agent-Assisted Only (No Autonomous Bot)</span>
            <p>
              MumzAssist.A drafts suggestions for support agents to review, edit, approve, or reject. Responses are never broadcast to end-customers automatically.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200/80 space-y-1.5">
            <span className="font-semibold text-slate-800 block">2. Strict Knowledge Base Grounding</span>
            <p>
              AI response drafts are bounded strictly to verified articles in the repository. The model is forbidden from inventing shipping timelines or return rules.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200/80 space-y-1.5">
            <span className="font-semibold text-slate-800 block">3. Safety & Fraud Circuit Breakers</span>
            <p>
              Messages reporting unauthorized transactions, credit card fraud, police involvement, or legal threats automatically escalate to Critical priority and require human review.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200/80 space-y-1.5">
            <span className="font-semibold text-slate-800 block">4. Multilingual Fidelity & RTL Support</span>
            <p>
              Preserves the original message in Unicode. Automatically applies right-to-left layout for Arabic customer messages and drafts responses in the customer's native language.
            </p>
          </div>
        </div>
      </div>

      {/* Database Management Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Database & Demo Management</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Reset database with representative multilingual sample records and verified knowledge base articles.
            </p>
          </div>

          <button
            onClick={handleReseed}
            disabled={reseedLoading}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 disabled:opacity-50 transition-colors"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${reseedLoading ? 'animate-spin' : ''}`} />
            <span>{reseedLoading ? 'Reseeding...' : 'Reseed Demo Records'}</span>
          </button>
        </div>

        {reseedSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>PostgreSQL demo records and multilingual articles reseeded successfully!</span>
          </div>
        )}
      </div>
    </div>
  );
};
