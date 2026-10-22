import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  Sparkles,
  ShieldAlert,
  Languages,
  BookOpen,
  Info,
} from 'lucide-react';

interface EvalResultItem {
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

interface EvalSummary {
  sampleSize: number;
  timestamp: string;
  languageAccuracy: number;
  categoryAccuracy: number;
  priorityAccuracy: number;
  humanReviewAccuracy: number;
  groundingCoverageRate: number;
  averageConfidence: number;
  results: EvalResultItem[];
  limitations: string[];
}

export const EvaluationView: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<EvalSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runEvaluation = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/evaluation');
      if (!res.ok) throw new Error('Evaluation runner failed');
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || 'Failed to run evaluation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-6 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
              BENCHMARK SUITE
            </span>
            <span className="text-xs text-slate-500 font-medium">Multilingual Triage & Grounding Verification</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 mt-1">AI Evaluation & Quality Assessment</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluates language detection, category triage, priority assignment, and knowledge grounding across curated English, Hindi, and Arabic test sets.
          </p>
        </div>

        <button
          onClick={runEvaluation}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg shadow-xs whitespace-nowrap transition-colors"
        >
          {loading ? (
            <RotateCcw className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4 fill-white" />
          )}
          <span>{loading ? 'Evaluating Dataset...' : 'Run Benchmark Suite'}</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
          {error}
        </div>
      )}

      {/* Results Overview */}
      {data && (
        <div className="space-y-6">
          {/* Metrics Scorecard */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Sample Size</span>
              <span className="text-2xl font-bold font-mono text-slate-900 mt-1 block tabular-nums">{data.sampleSize}</span>
              <span className="text-[10px] text-slate-400">Curated test cases</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Language Acc.</span>
              <span className="text-2xl font-bold font-mono text-indigo-700 mt-1 block tabular-nums">{data.languageAccuracy}%</span>
              <span className="text-[10px] text-slate-400">EN / HI / AR</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Category Acc.</span>
              <span className="text-2xl font-bold font-mono text-emerald-700 mt-1 block tabular-nums">{data.categoryAccuracy}%</span>
              <span className="text-[10px] text-slate-400">Intent taxonomy</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Priority Acc.</span>
              <span className="text-2xl font-bold font-mono text-blue-700 mt-1 block tabular-nums">{data.priorityAccuracy}%</span>
              <span className="text-[10px] text-slate-400">Critical / High / Med / Low</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Review Flag Acc.</span>
              <span className="text-2xl font-bold font-mono text-amber-700 mt-1 block tabular-nums">{data.humanReviewAccuracy}%</span>
              <span className="text-[10px] text-slate-400">Safety escalation</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">KB Grounding</span>
              <span className="text-2xl font-bold font-mono text-purple-700 mt-1 block tabular-nums">{data.groundingCoverageRate}%</span>
              <span className="text-[10px] text-slate-400">Verified references</span>
            </div>
          </div>

          {/* Test Case Breakdown Table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Benchmark Item Evaluation Results</h3>
              <span className="text-xs text-slate-500 font-mono">Executed at {new Date(data.timestamp).toLocaleTimeString()}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Test ID</th>
                    <th className="py-3 px-4">Customer Message & Notes</th>
                    <th className="py-3 px-4 text-center">Lang</th>
                    <th className="py-3 px-4 text-center">Category</th>
                    <th className="py-3 px-4 text-center">Priority</th>
                    <th className="py-3 px-4 text-center">Human Review</th>
                    <th className="py-3 px-4 text-center">KB Cited</th>
                    <th className="py-3 px-4 text-right">Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.results.map((r) => {
                    const isAr = /[\u0600-\u06FF]/.test(r.message);
                    return (
                      <tr key={r.id} className="hover:bg-slate-50/60">
                        <td className="py-3.5 px-4 font-mono font-semibold text-slate-700 whitespace-nowrap">
                          {r.id}
                        </td>
                        <td className="py-3.5 px-4 max-w-md">
                          <p className={`text-slate-800 ${isAr ? 'font-arabic text-right' : ''}`} dir={isAr ? 'rtl' : 'ltr'}>
                            {r.message}
                          </p>
                          <span className="text-[11px] text-slate-400 block mt-1">
                            Note: {r.notes}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            {r.languageCorrect ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5 text-rose-500" />
                            )}
                            <span className="font-medium text-slate-700">{r.predictedLanguage}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            {r.categoryCorrect ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5 text-rose-500" />
                            )}
                            <span className="text-slate-700">{r.predictedCategory}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            {r.priorityCorrect ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5 text-rose-500" />
                            )}
                            <span className="text-slate-700">{r.predictedPriority}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            {r.reviewCorrect ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5 text-rose-500" />
                            )}
                            <span className={r.predictedReview ? 'text-amber-700 font-semibold' : 'text-slate-500'}>
                              {r.predictedReview ? 'Flagged' : 'Auto'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono tabular-nums text-slate-700">
                          {r.groundedArticleCount}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-medium text-indigo-700 tabular-nums">
                          {Math.round(r.confidence * 100)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Benchmark Limitations Section */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-2 text-xs text-slate-600">
            <div className="flex items-center gap-2 text-slate-800 font-semibold">
              <Info className="w-4 h-4 text-indigo-600" />
              <span>Benchmark Limitations & Dataset Scope</span>
            </div>
            <ul className="list-disc pl-5 space-y-1">
              {data.limitations.map((lim, idx) => (
                <li key={idx}>{lim}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Initial state prompt */}
      {!data && !loading && (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-4">
          <Sparkles className="w-10 h-10 text-indigo-500 mx-auto" />
          <div>
            <h3 className="text-base font-semibold text-slate-900">Run the Official Evaluation Benchmark</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Click the button above to run the 14-item multilingual benchmark across English, Hindi (Devanagari & Hinglish), and Arabic. Accuracy and grounding reports will be rendered immediately.
            </p>
          </div>
          <button
            onClick={runEvaluation}
            className="px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
          >
            Start Benchmark Run
          </button>
        </div>
      )}
    </div>
  );
};
