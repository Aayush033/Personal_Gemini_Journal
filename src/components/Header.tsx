import React from 'react';
import {
  BookOpen,
  Sparkles,
  BarChart3,
  ShieldCheck,
  Plus,
  LogIn,
  LogOut,
  User as UserIcon,
  Lock,
  Flame,
  CheckCircle2,
  Users2,
  BrainCircuit,
  Globe,
  Key,
} from 'lucide-react';
import { UserProfile } from '../types';

interface HeaderProps {
  currentTab: 'journal' | 'chat' | 'panel' | 'memory' | 'analytics' | 'security';
  setCurrentTab: (tab: 'journal' | 'chat' | 'panel' | 'memory' | 'analytics' | 'security') => void;
  user: UserProfile | null;
  onOpenAuth: () => void;
  onOpenApiKey?: () => void;
  onLogout: () => void;
  onStartNewChat: () => void;
  entryCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  user,
  onOpenAuth,
  onOpenApiKey,
  onLogout,
  onStartNewChat,
  entryCount,
}) => {
  const getInitials = () => {
    if (!user) return 'AN';
    if (user.displayName) {
      const parts = user.displayName.trim().split(' ');
      if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
      return parts[0].slice(0, 2).toUpperCase();
    }
    if (user.email) return user.email.slice(0, 2).toUpperCase();
    return user.isAnonymous ? 'GS' : 'AR';
  };

  return (
    <header className="sticky top-0 z-40 bg-[#090B0F]/95 backdrop-blur-md border-b border-[#30363D]">
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3 lg:gap-4">
          {/* Logo and Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="shrink-0">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white tracking-tight whitespace-nowrap">
                  Personal <span className="text-indigo-400">Gemini</span> Journal
                </h1>
                <span className="hidden xl:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 whitespace-nowrap">
                  <ShieldCheck className="w-3 h-3 text-indigo-400" />
                  BENTO_SEC
                </span>
                <span
                  id="header-grounding-badge"
                  title="Google Search Grounding is enabled: Real-time web retrieval & fact verification"
                  className="hidden 2xl:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30 whitespace-nowrap"
                >
                  <Globe className="w-3 h-3 text-blue-400" />
                  Grounding Enabled
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block font-mono whitespace-nowrap tracking-tight">
                AI Co-Pilot &bull; Zero Cross-User Leakage &bull; Secret Manager
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1 bg-[#161B22] p-1 rounded-xl border border-[#30363D]">
            <button
              id="tab-journal-btn"
              onClick={() => setCurrentTab('journal')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentTab === 'journal'
                  ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#11161D]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Journals</span>
              {entryCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 bg-[#090B0F] text-indigo-300 rounded-full text-[10px] border border-indigo-500/30 font-mono">
                  {entryCount}
                </span>
              )}
            </button>

            <button
              id="tab-chat-btn"
              onClick={() => setCurrentTab('chat')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentTab === 'chat'
                  ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#11161D]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Brainstorm</span>
            </button>

            <button
              id="tab-panel-btn"
              onClick={() => setCurrentTab('panel')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentTab === 'panel'
                  ? 'bg-purple-600 text-white shadow-sm font-semibold'
                  : 'text-purple-300 hover:text-white hover:bg-purple-950/40'
              }`}
            >
              <Users2 className="w-3.5 h-3.5 text-purple-400" />
              <span>Panel Mode</span>
            </button>

            <button
              id="tab-memory-btn"
              onClick={() => setCurrentTab('memory')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentTab === 'memory'
                  ? 'bg-cyan-600 text-white shadow-sm font-semibold'
                  : 'text-cyan-300 hover:text-white hover:bg-cyan-950/40'
              }`}
            >
              <BrainCircuit className="w-3.5 h-3.5 text-cyan-400" />
              <span>Memory RAG</span>
            </button>

            <button
              id="tab-analytics-btn"
              onClick={() => setCurrentTab('analytics')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentTab === 'analytics'
                  ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#11161D]'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Analytics</span>
            </button>

            <button
              id="tab-security-btn"
              onClick={() => setCurrentTab('security')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentTab === 'security'
                  ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                  : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/30'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Security</span>
            </button>
          </nav>

          {/* Action and User Area (Bento Pill Auth) */}
          <div className="flex items-center gap-2.5">
            {onOpenApiKey && (
              <button
                id="header-api-key-btn"
                onClick={onOpenApiKey}
                title="Configure Gemini API Key"
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#161B22] hover:bg-[#1f242c] text-indigo-300 hover:text-white rounded-xl text-xs font-mono border border-indigo-500/30 hover:border-indigo-500/60 transition-all active:scale-95"
              >
                <Key className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">API Key</span>
              </button>
            )}

            <button
              id="new-session-btn"
              onClick={() => {
                onStartNewChat();
                setCurrentTab('chat');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Session</span>
            </button>

            {user ? (
              <div className="flex items-center gap-2 bg-[#161B22] border border-[#30363D] py-1 px-3 rounded-full">
                <div className="text-[11px] text-slate-400 font-medium font-mono hidden sm:block">
                  AUTH:{' '}
                  <span className="text-emerald-400 font-semibold">
                    {user.isAnonymous ? 'SANDBOX_GUEST' : 'FIREBASE_PROD'}
                  </span>
                </div>

                <div className="w-7 h-7 rounded-full bg-indigo-500/20 border border-indigo-500/50 flex items-center justify-center text-xs font-bold text-indigo-400">
                  {getInitials()}
                </div>

                <button
                  id="logout-btn"
                  onClick={onLogout}
                  title="Sign Out"
                  className="p-1 text-slate-400 hover:text-rose-400 rounded-full transition-colors ml-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                id="header-login-btn"
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#161B22] hover:bg-[#1f242c] text-slate-200 rounded-xl text-xs font-medium border border-[#30363D] transition-all"
              >
                <LogIn className="w-3.5 h-3.5 text-indigo-400" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile / Tablet Navigation Row */}
        <div className="flex lg:hidden items-center justify-between py-2 border-t border-[#30363D] gap-1 overflow-x-auto">
          <button
            onClick={() => setCurrentTab('journal')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap ${
              currentTab === 'journal' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Journals</span>
          </button>
          <button
            onClick={() => setCurrentTab('chat')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap ${
              currentTab === 'chat' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Brainstorm</span>
          </button>
          <button
            onClick={() => setCurrentTab('panel')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap ${
              currentTab === 'panel' ? 'bg-purple-600 text-white font-medium' : 'text-purple-300'
            }`}
          >
            <Users2 className="w-3.5 h-3.5" />
            <span>Panel</span>
          </button>
          <button
            onClick={() => setCurrentTab('memory')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap ${
              currentTab === 'memory' ? 'bg-cyan-600 text-white font-medium' : 'text-cyan-300'
            }`}
          >
            <BrainCircuit className="w-3.5 h-3.5" />
            <span>Memory</span>
          </button>
          <button
            onClick={() => setCurrentTab('analytics')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap ${
              currentTab === 'analytics' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Analytics</span>
          </button>
          <button
            onClick={() => setCurrentTab('security')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap ${
              currentTab === 'security' ? 'bg-emerald-600 text-white font-medium' : 'text-emerald-400'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Security</span>
          </button>
        </div>
      </div>
    </header>
  );
};
