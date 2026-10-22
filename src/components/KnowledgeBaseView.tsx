import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  Plus,
  Edit2,
  Check,
  X,
  Languages,
  Sparkles,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { KnowledgeBaseArticle } from '../types/index.js';

interface KnowledgeBaseViewProps {
  articles: KnowledgeBaseArticle[];
  loading: boolean;
  onRefresh: () => void;
  onCreateArticle: (data: any) => Promise<void>;
  onUpdateArticle: (id: string, data: any) => Promise<void>;
}

export const KnowledgeBaseView: React.FC<KnowledgeBaseViewProps> = ({
  articles,
  loading,
  onRefresh,
  onCreateArticle,
  onUpdateArticle,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<KnowledgeBaseArticle | null>(null);

  // New Article Form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Order and delivery');
  const [content, setContent] = useState('');
  const [keywords, setKeywords] = useState('');
  const [supportedLanguages, setSupportedLanguages] = useState(['English', 'Hindi', 'Arabic']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    'All',
    'Order and delivery',
    'Payment and billing',
    'Refund and cancellation',
    'Account access',
    'Product or service issue',
    'Complaint',
  ];

  const filteredArticles = articles.filter((art) => {
    const matchesCategory = categoryFilter === 'All' || art.category === categoryFilter;
    const matchesSearch =
      searchTerm === '' ||
      art.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      art.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      art.keywords.some((k) => k.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onCreateArticle({
        title,
        category,
        content,
        keywords: keywords.split(',').map((k) => k.trim()).filter((k) => k.length > 0),
        supported_languages: supportedLanguages,
        is_active: true,
      });
      setIsCreateOpen(false);
      setTitle('');
      setContent('');
      setKeywords('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingArticle) return;
    setIsSubmitting(true);
    try {
      await onUpdateArticle(editingArticle.id, {
        title: editingArticle.title,
        category: editingArticle.category,
        content: editingArticle.content,
        keywords: editingArticle.keywords,
        supported_languages: editingArticle.supported_languages,
        is_active: editingArticle.is_active,
      });
      setEditingArticle(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleArticleActive = async (art: KnowledgeBaseArticle) => {
    await onUpdateArticle(art.id, { is_active: !art.is_active });
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-6 shadow-2xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Verified Knowledge Base Repository</h2>
          <p className="text-xs text-slate-500 mt-1">
            Grounded source of truth used by the Gemini AI triage workflow to verify policies and draft multilingual agent suggestions.
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 whitespace-nowrap shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add Knowledge Article</span>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
        <div className="flex-1 min-w-[280px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search verified articles by title, keywords, or content..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === 'All' ? 'All Categories' : c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Articles Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading knowledge base articles...</div>
      ) : filteredArticles.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-3">
          <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
          <div className="text-sm font-medium text-slate-700">No knowledge base articles found</div>
          <p className="text-xs text-slate-400">Try adjusting your search query or add a new verified article.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredArticles.map((art) => (
            <div
              key={art.id}
              className={`bg-white border rounded-xl p-5 shadow-2xs space-y-3 transition-all ${
                art.is_active ? 'border-slate-200' : 'border-slate-200/60 opacity-60 bg-slate-50/50'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      {art.id}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">{art.category}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 mt-1">{art.title}</h3>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleArticleActive(art)}
                    className="text-xs text-slate-500 hover:text-slate-800"
                    title={art.is_active ? 'Active (Click to disable)' : 'Inactive (Click to enable)'}
                  >
                    {art.is_active ? (
                      <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded text-[10px] border border-emerald-200">
                        Active
                      </span>
                    ) : (
                      <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded text-[10px] border border-slate-200">
                        Inactive
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => setEditingArticle(art)}
                    className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-100"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap max-h-36 overflow-y-auto p-3 bg-slate-50/70 rounded-lg border border-slate-100">
                {art.content}
              </div>

              {/* Languages & Keywords */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Languages className="w-3.5 h-3.5 text-slate-400" />
                  <span>{art.supported_languages.join(' · ')}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {art.keywords.slice(0, 4).map((kw, idx) => (
                    <span key={idx} className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                      #{kw}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Article Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
              <h3 className="text-sm font-semibold text-slate-900">Add Verified Knowledge Base Article</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Standard Return & Exchange Window"
                  className="w-full p-2.5 border border-slate-200 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg bg-white"
                  >
                    {categories.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Keywords (comma-separated)</label>
                  <input
                    type="text"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="return, refund, 14 days"
                    className="w-full p-2.5 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Policy Content (Include English, Hindi, or Arabic guidelines) *
                </label>
                <textarea
                  required
                  rows={6}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Enter exact business rules, timelines, and conditions. Gemini will strictly reference this content."
                  className="w-full p-3 border border-slate-200 rounded-lg leading-relaxed"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Create Article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Article Modal */}
      {editingArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
              <h3 className="text-sm font-semibold text-slate-900">Edit Knowledge Base Article ({editingArticle.id})</h3>
              <button onClick={() => setEditingArticle(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={editingArticle.title}
                  onChange={(e) => setEditingArticle({ ...editingArticle, title: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Content *</label>
                <textarea
                  required
                  rows={6}
                  value={editingArticle.content}
                  onChange={(e) => setEditingArticle({ ...editingArticle, content: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-lg leading-relaxed"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingArticle(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
