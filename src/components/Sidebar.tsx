import React from 'react';
import {
  LayoutDashboard,
  Inbox,
  BookOpen,
  BarChart3,
  CheckCircle2,
  Settings,
  Languages,
  ShieldCheck,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openTicketCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  openTicketCount = 0,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'inbox', label: 'Ticket Inbox', icon: Inbox, badge: openTicketCount },
    { id: 'kb', label: 'Knowledge Base', icon: BookOpen },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'eval', label: 'Multilingual Benchmark', icon: CheckCircle2 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 border-r border-slate-200 bg-white flex flex-col justify-between shrink-0 h-[calc(100vh-4rem)]">
      <div className="p-4 space-y-6">
        <div>
          <div className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Triage Operations
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-md font-mono tabular-nums ${
                        isActive
                          ? 'bg-indigo-200 text-indigo-800 font-semibold'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Supported Languages Card */}
        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <Languages className="w-3.5 h-3.5 text-indigo-600" />
            <span>Active Triage Locales</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-center text-xs text-slate-600 font-medium">
            <div className="bg-white py-1 rounded border border-slate-200/60 shadow-2xs">English</div>
            <div className="bg-white py-1 rounded border border-slate-200/60 shadow-2xs">हिन्दी</div>
            <div className="bg-white py-1 rounded border border-slate-200/60 shadow-2xs font-arabic">العربية</div>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-500 pt-1">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span>Human-in-the-loop Guardrail</span>
          </div>
        </div>
      </div>

      {/* User / Agent Footer */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-xs font-bold text-indigo-700">
            SC
          </div>
          <div className="overflow-hidden">
            <div className="text-sm font-semibold text-slate-900 truncate">Sara Chen</div>
            <div className="text-xs text-slate-500 truncate">Senior Support Lead</div>
          </div>
        </div>
      </div>
    </aside>
  );
};
