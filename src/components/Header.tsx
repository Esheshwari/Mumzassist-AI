import React from 'react';
import { Plus, ShieldAlert, Sparkles } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  onNewTicketClick: () => void;
  reviewCount?: number;
  onReviewFilterClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onNewTicketClick,
  reviewCount = 0,
  onReviewFilterClick,
}) => {
  const getTabTitle = (tab: string) => {
    switch (tab) {
      case 'dashboard':
        return 'Overview Dashboard';
      case 'inbox':
        return 'Support Ticket Inbox';
      case 'kb':
        return 'Knowledge Base Repository';
      case 'analytics':
        return 'Triage Analytics & Metrics';
      case 'eval':
        return 'Multilingual Evaluation Benchmark';
      case 'settings':
        return 'System & AI Configuration';
      default:
        return 'Dashboard';
    }
  };

  return (
    <header className="h-16 px-6 border-b border-slate-200 bg-white flex items-center justify-between gap-8 shrink-0 z-10">
      {/* Zone 1: Wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
          M
        </div>
        <div>
          <span className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap">
            MumzAssist.A
          </span>
          <span className="hidden sm:inline-block ml-2 text-xs text-slate-400 font-medium">
            Multilingual AI Triage
          </span>
        </div>
      </div>

      {/* Zone 2: Navigation Breadcrumbs & Context */}
      <div className="hidden md:flex items-center gap-2 text-sm text-slate-500 whitespace-nowrap overflow-hidden text-ellipsis">
        <span>Workspace</span>
        <span aria-hidden="true" className="text-slate-300">/</span>
        <span className="font-medium text-slate-800">{getTabTitle(activeTab)}</span>
        
        {reviewCount > 0 && onReviewFilterClick && (
          <button
            onClick={onReviewFilterClick}
            className="ml-4 flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200/80 rounded-md hover:bg-amber-100 transition-colors"
            title="Click to view tickets requiring human review"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
            <span>{reviewCount} Awaiting Review</span>
          </button>
        )}
      </div>

      {/* Zone 3: Primary Action */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onNewTicketClick}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 active:bg-indigo-800 transition-colors whitespace-nowrap shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>New Ticket</span>
        </button>
      </div>
    </header>
  );
};
