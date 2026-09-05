import { useState } from 'react';
import {
  Brain,
  Search,
  Sparkles,
  ArrowRight,
  BookOpen,
  Calendar,
  Lock,
  Layers,
  CheckCircle2,
  Loader2,
  HelpCircle,
  Hash,
  AlertCircle,
  Key,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { JournalEntry, RagSearchResult, UserProfile } from '../types';
import { getCurrentToken, loginAnonymously } from '../lib/firebase';
import { ApiKeyModal } from './ApiKeyModal';

interface SemanticMemorySearchProps {
  entries: JournalEntry[];
  user: UserProfile | null;
  onOpenAuth: () => void;
  onSelectEntry: (entry: JournalEntry) => void;
  onStartNewSession: () => void;
}

const MEMORY_STARTER_QUERIES = [
  'How has my perspective on risk and career decisions evolved?',
  'What recurring emotional triggers or stressors have I noted?',
  'What creative breakthroughs or product ideas did I brainstorm?',
  'Summarize my major action items and philosophical realizations.',
];

export function SemanticMemorySearch({
  entries,
  user,
  onOpenAuth,
  onSelectEntry,
  onStartNewSession,
}: SemanticMemorySearchProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [aiSynthesis, setAiSynthesis] = useState<string | null>(null);
  const [matchedResults, setMatchedResults] = useState<RagSearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [searchMeta, setSearchMeta] = useState<{
    embeddingModel?: string;
    dimensions?: number;
    retrievalMethod?: string;
  } | null>(null);

  const handleSearch = async (overrideQuery?: string) => {
    const searchText = (overrideQuery || query).trim();
    if (!searchText) return;

    if (entries.length === 0) {
      alert('Your Journal Vault is currently empty. Record a few sessions first to enable semantic cross-entry memory retrieval.');
      return;
    }

    let token = await getCurrentToken();
    if (!token && !user) {
      try {
        await loginAnonymously();
        token = await getCurrentToken();
      } catch (authErr) {
        onOpenAuth();
        return;
      }
    }

    setIsSearching(true);
    setHasSearched(true);
    setAiSynthesis(null);
    setMatchedResults([]);
    setSearchMeta(null);

    try {
      // Pass entries context to server for vector embedding comparison & synthesis
      const res = await fetch('/api/rag-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: searchText,
          entries: entries.map((e) => ({
            id: e.id,
            title: e.title,
            createdAt: e.createdAt,
            tags: e.tags,
            embedding: e.embedding,
            oneLiner: e.summary?.oneLiner || '',
            executiveSummary: e.summary?.executiveSummary || '',
            keyInsights: e.summary?.keyInsights || [],
            actionItems: e.summary?.actionItems?.map((a) => a.text) || [],
            moodValence: e.summary?.moodValence || 'reflective',
            // If encrypted and not unlocked, send redacted notice
            isEncrypted: e.isEncrypted && !e.summary,
          })),
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed with status ${res.status}`);
      }

      const data = await res.json();
      setAiSynthesis(data.synthesis || null);
      setSearchMeta({
        embeddingModel: data.embeddingModel || 'text-embedding-004',
        dimensions: data.dimensions || 768,
        retrievalMethod: data.retrievalMethod || 'text-embedding-004 Cosine Vector Search + Gemini 3.7 Flash RAG Synthesis',
      });

      if (Array.isArray(data.matchedEntryIds)) {
        const results: RagSearchResult[] = data.matchedEntryIds
          .map((item: any) => {
            const entryId = typeof item === 'string' ? item : item.id;
            const originalEntry = entries.find((e) => e.id === entryId);
            if (!originalEntry) return null;
            return {
              entry: originalEntry,
              similarity: typeof item === 'object' ? item.similarity || 0.85 : 0.85,
              relevanceExplanation: typeof item === 'object' ? item.explanation : undefined,
            };
          })
          .filter(Boolean) as RagSearchResult[];

        setMatchedResults(results);
      }
    } catch (err: any) {
      console.error('Semantic search error:', err);
      setErrorMessage(err.message || 'Semantic search encountered an issue.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6 animate-in fade-in duration-200">
      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in shadow-lg">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-300">Memory Retrieval Notice</p>
              <p className="text-slate-300 text-[11px] mt-0.5">{errorMessage}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowApiKeyModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Configure Key</span>
            </button>
            <button
              onClick={() => setErrorMessage(null)}
              className="px-2.5 py-1.5 text-slate-400 hover:text-slate-200 text-xs"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Banner / Introduction */}
      <div className="bg-[#11161D] border border-[#30363D] rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-md">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Semantic Memory & RAG Search
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Vector Embedding & Cross-Session Longitudinal Synthesis
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed max-w-3xl mt-2">
          Ask high-level, longitudinal questions spanning your entire journal history. Gemini performs Retrieval-Augmented Generation (RAG) across your isolated entries to uncover recurring themes, personal growth trajectories, and hidden insights over time.
        </p>

        {/* Search Bar */}
        <div className="mt-6 flex flex-col sm:flex-row items-stretch gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-4 top-3.5 text-slate-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Ask anything about your past reflections (e.g. 'How has my mindset on risk evolved?')..."
              className="w-full bg-[#090B0F] border border-[#30363D] rounded-2xl pl-11 pr-4 py-3 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <button
            onClick={() => handleSearch()}
            disabled={isSearching || !query.trim()}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-2xl text-xs font-bold shadow-lg shadow-indigo-600/20 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            {isSearching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Synthesizing Memory...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Run Semantic Query</span>
              </>
            )}
          </button>
        </div>

        {/* Suggested Queries */}
        <div className="mt-4 pt-4 border-t border-[#30363D]">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold block mb-2">
            Suggested Deep Inquiries:
          </span>
          <div className="flex flex-wrap gap-2">
            {MEMORY_STARTER_QUERIES.map((sample, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setQuery(sample);
                  handleSearch(sample);
                }}
                className="text-[11px] px-3 py-1.5 bg-[#090B0F] hover:bg-[#161B22] text-slate-400 hover:text-indigo-300 rounded-xl border border-[#30363D] transition-colors text-left"
              >
                &ldquo;{sample}&rdquo;
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Section */}
      {hasSearched && (
        <div className="space-y-6">
          {/* AI Cross-Session Synthesis Card */}
          {aiSynthesis && (
            <div className="p-6 sm:p-8 rounded-3xl bg-[#11161D] border border-indigo-500/40 shadow-2xl space-y-4 animate-in slide-in-from-bottom-4 duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#30363D] pb-3">
                <div className="flex items-center gap-2 text-indigo-400">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-xs font-mono uppercase tracking-wider font-bold">
                    Longitudinal Memory Synthesis
                  </span>
                </div>
                {searchMeta && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      Model: {searchMeta.embeddingModel} ({searchMeta.dimensions}-dim vector space)
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      Cosine Vector Ranking
                    </span>
                  </div>
                )}
              </div>

              <div className="text-slate-200 text-sm leading-relaxed space-y-3 markdown-body">
                <ReactMarkdown>{aiSynthesis}</ReactMarkdown>
              </div>
            </div>
          )}

          {/* Matched Journal Entries Grid */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold px-1">
              Referenced Source Entries ({matchedResults.length})
            </h3>

            {matchedResults.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {matchedResults.map(({ entry, similarity, relevanceExplanation }) => (
                  <div
                    key={entry.id}
                    onClick={() => onSelectEntry(entry)}
                    className="p-5 rounded-2xl bg-[#11161D] hover:bg-[#161B22] border border-[#30363D] hover:border-indigo-500/50 rounded-2xl shadow-sm transition-all cursor-pointer flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold">
                          {Math.round(similarity * 100)}% Similarity
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(entry.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                        {entry.title}
                      </h4>

                      {relevanceExplanation ? (
                        <p className="text-xs text-indigo-200/80 mt-2 font-medium leading-relaxed line-clamp-2">
                          {relevanceExplanation}
                        </p>
                      ) : entry.summary?.oneLiner ? (
                        <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed italic">
                          &ldquo;{entry.summary.oneLiner}&rdquo;
                        </p>
                      ) : (
                        <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                          {entry.rawConversation.length} multi-turn exchange(s) recorded.
                        </p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#30363D] flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                        <Hash className="w-3 h-3 text-indigo-400" />
                        <span>{entry.tags.slice(0, 2).join(', ') || 'journal'}</span>
                      </div>
                      <div className="flex items-center gap-1 text-indigo-400 font-semibold text-xs group-hover:translate-x-1 transition-transform">
                        <span>Open</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-[#11161D] border border-[#30363D] text-center text-xs text-slate-400">
                No direct semantic links found for this query in your current unencrypted entries.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Gemini API Key Configuration Modal */}
      <ApiKeyModal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        onKeyUpdated={() => {
          setErrorMessage(null);
          handleSearch();
        }}
      />
    </div>
  );
}
