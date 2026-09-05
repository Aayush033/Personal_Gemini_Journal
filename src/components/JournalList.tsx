import React, { useState, useMemo } from 'react';
import {
  Search,
  BookOpen,
  Pin,
  Star,
  Lock,
  Calendar,
  Sparkles,
  CheckCircle2,
  Trash2,
  Tag,
  ArrowRight,
  Shield,
  Layers,
  Filter,
  Loader2,
  Database,
  PlaySquare,
} from 'lucide-react';
import { JournalEntry, MoodType } from '../types';
import { toggleFavoriteEntry, togglePinEntry, deleteJournalEntry } from '../lib/firestoreService';
import { loadSampleEntriesToFirestore } from '../lib/sampleData';
import { loginAnonymously, auth } from '../lib/firebase';

interface JournalListProps {
  entries: JournalEntry[];
  userId: string;
  onSelectEntry: (entry: JournalEntry) => void;
  onStartNewSession: () => void;
  onRequestUnlock: (entry: JournalEntry) => void;
  onShowToast?: (msg: string) => void;
}

export const JournalList: React.FC<JournalListProps> = ({
  entries,
  userId,
  onSelectEntry,
  onStartNewSession,
  onRequestUnlock,
  onShowToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'pinned' | 'favorite' | 'encrypted'>('all');
  const [selectedMood, setSelectedMood] = useState<string>('all');
  const [isLoadingSamples, setIsLoadingSamples] = useState(false);

  const handleLoadSamples = async () => {
    setIsLoadingSamples(true);
    try {
      let targetUid = userId || auth.currentUser?.uid;
      if (!targetUid) {
        try {
          const guestUser = await loginAnonymously();
          targetUid = guestUser.uid;
        } catch {
          targetUid = 'local-dev-guest';
        }
      }

      await loadSampleEntriesToFirestore(targetUid);
      
      // Reset any active filter or search query so entries are immediately visible
      setSearchQuery('');
      setFilterType('all');
      setSelectedMood('all');

      if (onShowToast) {
        onShowToast('3 Demo Sessions loaded into your secure vault!');
      }
    } catch (err: any) {
      console.error('Failed to load sample sessions:', err);
      if (onShowToast) {
        onShowToast('Notice: ' + (err.message || 'Error populating sessions'));
      }
    } finally {
      setIsLoadingSamples(false);
    }
  };

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      // Filter tab
      if (filterType === 'pinned' && !entry.pinned) return false;
      if (filterType === 'favorite' && !entry.favorite) return false;
      if (filterType === 'encrypted' && !entry.isEncrypted) return false;

      // Mood filter
      if (selectedMood !== 'all') {
        if (entry.summary?.moodValence !== selectedMood) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = entry.title.toLowerCase().includes(q);
        const matchSummary = entry.summary?.executiveSummary.toLowerCase().includes(q);
        const matchOneLiner = entry.summary?.oneLiner.toLowerCase().includes(q);
        const matchTags = entry.tags.some((t) => t.toLowerCase().includes(q));
        const matchConvo = entry.rawConversation.some((m) => m.text.toLowerCase().includes(q));
        return matchTitle || matchSummary || matchOneLiner || matchTags || matchConvo;
      }

      return true;
    });
  }, [entries, filterType, selectedMood, searchQuery]);

  const handleTogglePin = async (e: React.MouseEvent, entry: JournalEntry) => {
    e.stopPropagation();
    try {
      await togglePinEntry(userId, entry.id, entry.pinned);
    } catch (err) {
      console.error('Error toggling pin:', err);
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent, entry: JournalEntry) => {
    e.stopPropagation();
    try {
      await toggleFavoriteEntry(userId, entry.id, entry.favorite);
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  const handleDelete = async (e: React.MouseEvent, entry: JournalEntry) => {
    e.stopPropagation();
    if (confirm(`Permanently delete "${entry.title}" from your isolated Firestore collection?`)) {
      try {
        await deleteJournalEntry(userId, entry.id);
      } catch (err) {
        console.error('Error deleting entry:', err);
      }
    }
  };

  const getMoodBadgeColor = (mood?: MoodType) => {
    switch (mood) {
      case 'reflective':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'energized':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'calm':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'creative':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'determined':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'grateful':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Bento Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#11161D] border border-[#30363D] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase tracking-wider mb-2">
            <span>Total Journal Vault</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight">{entries.length}</div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">Isolated to User UID</div>
        </div>

        <div className="bg-[#11161D] border border-[#30363D] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase tracking-wider mb-2">
            <span>Action Deliverables</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-emerald-400 tracking-tight">
            {entries.reduce((acc, curr) => acc + (curr.summary?.actionItems?.length || 0), 0)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">Synthesized Next Steps</div>
        </div>

        <div className="bg-[#11161D] border border-[#30363D] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase tracking-wider mb-2">
            <span>Encrypted Private Vault</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-amber-400 tracking-tight">
            {entries.filter((e) => e.isEncrypted).length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">Client-Side AES-GCM-256</div>
        </div>
      </div>

      {/* Search and Filters Header */}
      <div className="bg-[#11161D] border border-[#30363D] rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
            <input
              id="search-journals-input"
              type="text"
              placeholder="Search journals, summaries, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#090B0F] border border-[#30363D] rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Filter Categories */}
          <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                filterType === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                  : 'bg-[#161B22] text-slate-400 hover:text-slate-200 border border-[#30363D]'
              }`}
            >
              All ({entries.length})
            </button>
            <button
              onClick={() => setFilterType('pinned')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                filterType === 'pinned'
                  ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                  : 'bg-[#161B22] text-slate-400 hover:text-slate-200 border border-[#30363D]'
              }`}
            >
              <Pin className="w-3 h-3" />
              <span>Pinned</span>
            </button>
            <button
              onClick={() => setFilterType('favorite')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                filterType === 'favorite'
                  ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                  : 'bg-[#161B22] text-slate-400 hover:text-slate-200 border border-[#30363D]'
              }`}
            >
              <Star className="w-3 h-3" />
              <span>Favorites</span>
            </button>
            <button
              onClick={() => setFilterType('encrypted')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                filterType === 'encrypted'
                  ? 'bg-amber-600 text-white shadow-sm font-semibold'
                  : 'bg-[#161B22] text-slate-400 hover:text-amber-300 border border-[#30363D]'
              }`}
            >
              <Lock className="w-3 h-3 text-amber-400" />
              <span>Encrypted</span>
            </button>
          </div>
        </div>

        {/* Mood Chips Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#30363D]">
          <div className="flex items-center gap-1.5 overflow-x-auto text-[11px]">
            <span className="text-slate-500 font-mono font-medium shrink-0 mr-1">MOOD:</span>
            {['all', 'reflective', 'energized', 'calm', 'creative', 'determined', 'grateful', 'anxious'].map((m) => (
              <button
                key={m}
                onClick={() => setSelectedMood(m)}
                className={`px-2.5 py-0.5 rounded-full capitalize transition-all ${
                  selectedMood === m
                    ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                    : 'bg-[#090B0F] text-slate-400 hover:text-slate-200 border border-[#30363D]'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <button
            id="toolbar-load-samples-btn"
            onClick={handleLoadSamples}
            disabled={isLoadingSamples}
            title="Pre-load 3 rich sample brainstorm sessions (Career Pivot, AI Architecture, Mindfulness)"
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-500/30 text-indigo-300 transition-all ml-auto disabled:opacity-50"
          >
            {isLoadingSamples ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
            ) : (
              <PlaySquare className="w-3.5 h-3.5 text-indigo-400" />
            )}
            <span>{isLoadingSamples ? 'Loading...' : 'Demo Sessions'}</span>
          </button>
        </div>
      </div>

      {/* Journal Cards Bento Grid */}
      {filteredEntries.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEntries.map((entry) => {
            const completedActions = entry.summary?.actionItems?.filter((a) => a.completed).length || 0;
            const totalActions = entry.summary?.actionItems?.length || 0;

            return (
              <div
                key={entry.id}
                id={`journal-card-${entry.id}`}
                onClick={() => {
                  if (entry.isEncrypted && !entry.summary) {
                    onRequestUnlock(entry);
                  } else {
                    onSelectEntry(entry);
                  }
                }}
                className={`group relative bg-[#11161D] hover:bg-[#161B22] border rounded-2xl p-5 shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between ${
                  entry.pinned
                    ? 'border-indigo-500/60 shadow-indigo-950/20'
                    : 'border-[#30363D] hover:border-indigo-500/40'
                }`}
              >
                {/* Card Header */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {entry.summary?.moodValence && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize font-mono ${getMoodBadgeColor(
                            entry.summary.moodValence
                          )}`}
                        >
                          {entry.summary.moodValence}
                        </span>
                      )}

                      {entry.isEncrypted && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <Lock className="w-2.5 h-2.5" />
                          Zero-Knowledge
                        </span>
                      )}

                      <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        {new Date(entry.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>

                    {/* Action icons */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleTogglePin(e, entry)}
                        title={entry.pinned ? 'Unpin' : 'Pin to top'}
                        className={`p-1.5 rounded-lg transition-colors ${
                          entry.pinned
                            ? 'text-indigo-400 bg-indigo-500/10'
                            : 'text-slate-500 hover:text-slate-300 hover:bg-[#090B0F]'
                        }`}
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleToggleFavorite(e, entry)}
                        title={entry.favorite ? 'Unfavorite' : 'Favorite'}
                        className={`p-1.5 rounded-lg transition-colors ${
                          entry.favorite
                            ? 'text-amber-400 bg-amber-500/10'
                            : 'text-slate-500 hover:text-slate-300 hover:bg-[#090B0F]'
                        }`}
                      >
                        <Star className="w-3.5 h-3.5 fill-current" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, entry)}
                        title="Delete entry"
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Preview */}
                  <h4 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1 tracking-tight">
                    {entry.title}
                  </h4>

                  {entry.summary ? (
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                      {entry.summary.oneLiner || entry.summary.executiveSummary}
                    </p>
                  ) : entry.isEncrypted ? (
                    <div className="mt-2 p-3 bg-[#090B0F] rounded-xl border border-[#30363D] text-xs text-amber-300/90 flex items-center gap-2 font-mono">
                      <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Encrypted with private passkey. Click to unlock.</span>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 mt-2 italic">
                      {entry.rawConversation.length} multi-turn interaction(s) recorded.
                    </p>
                  )}
                </div>

                {/* Card Footer */}
                <div className="mt-4 pt-3 border-t border-[#30363D] flex items-center justify-between text-xs text-slate-400">
                  {/* Action Item Progress */}
                  {totalActions > 0 ? (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>
                        {completedActions}/{totalActions} Action Steps
                      </span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-500 font-mono">
                      {entry.wordCount || 0} words
                    </span>
                  )}

                  <div className="flex items-center gap-1 text-indigo-400 group-hover:translate-x-0.5 transition-transform text-xs font-semibold">
                    <span>View</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-[#11161D] border border-[#30363D] rounded-3xl p-10 text-center max-w-xl mx-auto shadow-2xl space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/10">
            <BookOpen className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">Your Journal Vault is Pristine</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Begin an insightful multi-turn brainstorming session with Gemini, or load pre-populated hackathon demo sessions to instantly explore the full capabilities of the Wisdom Matrix, Analytics, and Semantic Memory.
            </p>
          </div>

          {/* Hackathon Reviewer Callout Box */}
          <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 text-left space-y-3">
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Hackathon Demo Mode: Instant Exploration</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              Pre-load 3 rich, realistic journal sessions (<span className="text-slate-200 font-medium">Career Strategic Pivot</span>, <span className="text-slate-200 font-medium">AI Agent Architecture</span>, and <span className="text-slate-200 font-medium">Mindfulness Decompression</span>) complete with multi-turn dialogues, Wisdom Matrices, action items, and vector memory.
            </p>
            <button
              id="empty-load-samples-btn"
              onClick={handleLoadSamples}
              disabled={isLoadingSamples}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/25 transition-all active:scale-95"
            >
              {isLoadingSamples ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Populating Isolated Firestore Vault...</span>
                </>
              ) : (
                <>
                  <Database className="w-4 h-4" />
                  <span>Load Sample Brainstorm Sessions</span>
                </>
              )}
            </button>
          </div>

          <div className="pt-2 border-t border-[#30363D]/60 flex items-center justify-center">
            <button
              id="empty-new-session-btn"
              onClick={onStartNewSession}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#090B0F] hover:bg-[#161B22] text-slate-300 hover:text-white text-xs font-semibold rounded-xl border border-[#30363D] transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Start Blank Brainstorm Session</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
