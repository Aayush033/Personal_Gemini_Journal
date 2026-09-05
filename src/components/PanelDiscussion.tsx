import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Users,
  Sparkles,
  Play,
  RotateCcw,
  CheckCircle2,
  HelpCircle,
  Target,
  Compass,
  Heart,
  Loader2,
  Copy,
  Check,
  Shield,
  Bot,
  BrainCircuit,
  Table,
  Scale,
  AlertTriangle,
  BookPlus,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Key,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { UserProfile, PanelDiscussionRound, PanelAgentContribution, DecisionMatrixItem, JournalEntry } from '../types';
import { getCurrentToken, loginAnonymously } from '../lib/firebase';
import { saveJournalEntry } from '../lib/firestoreService';
import { ApiKeyModal } from './ApiKeyModal';

interface PanelDiscussionProps {
  user: UserProfile | null;
  onOpenAuth: () => void;
  onSendToJournal?: (title: string, summary: string, transcript: string) => void;
}

const PANEL_PERSONAS_CONFIG = [
  {
    id: 'socratic',
    name: 'Socratic Mirror',
    roleTitle: 'Deep Inquiry & Cognitive Blindspots',
    badgeColor: 'indigo',
    avatarBg: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40',
    glowColor: 'shadow-indigo-500/20',
    icon: HelpCircle,
    activeThought: 'Probing hidden assumptions and systemic contradictions...',
  },
  {
    id: 'stoic',
    name: 'Stoic Mentor',
    roleTitle: 'Dichotomy of Control & Equanimity',
    badgeColor: 'cyan',
    avatarBg: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40',
    glowColor: 'shadow-cyan-500/20',
    icon: Compass,
    activeThought: 'Isolating internal agency from uncontrollable externals...',
  },
  {
    id: 'clarity',
    name: 'Action Strategist',
    roleTitle: 'Execution Roadmap & Trade-offs',
    badgeColor: 'emerald',
    avatarBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    glowColor: 'shadow-emerald-500/20',
    icon: Target,
    activeThought: 'Formulating tactical milestones and downside de-risking...',
  },
  {
    id: 'empathy',
    name: 'Mindful Reflector',
    roleTitle: 'Somatic Grounding & Psychological Safety',
    badgeColor: 'rose',
    avatarBg: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
    glowColor: 'shadow-rose-500/20',
    icon: Heart,
    activeThought: 'Synthesizing emotional valence and somatic resilience...',
  },
];

const PRESET_DILEMMAS = [
  'I am torn between staying in my stable role vs taking a high-risk entrepreneurial leap.',
  'I feel burnt out by my high standards and perfectionism. How do I balance ambition with inner peace?',
  'I have three competing life goals this year and feel paralyzed by indecision. How should I prioritize?',
  'A colleague took credit for a project I led. How do I navigate this with integrity without being passive?',
];

export function PanelDiscussion({ user, onOpenAuth, onSendToJournal }: PanelDiscussionProps) {
  const [selectedPersonaIds, setSelectedPersonaIds] = useState<string[]>([
    'socratic',
    'stoic',
    'clarity',
    'empathy',
  ]);
  const [prompt, setPrompt] = useState('');
  const [isDeliberating, setIsDeliberating] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isSavingToVault, setIsSavingToVault] = useState(false);
  const [savedToVaultSuccess, setSavedToVaultSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [discussionRound, setDiscussionRound] = useState<PanelDiscussionRound | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'consensus' | 'matrix' | string>('all');
  const [copied, setCopied] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemini-3.7-flash');
  const [revealedCount, setRevealedCount] = useState<number>(0);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Sequential reveal animation of agent contributions
  useEffect(() => {
    if (!discussionRound?.contributions || discussionRound.contributions.length === 0) {
      setRevealedCount(0);
      return;
    }
    setRevealedCount(1);
    const interval = setInterval(() => {
      setRevealedCount((prev) => {
        if (prev < discussionRound.contributions.length) {
          return prev + 1;
        }
        clearInterval(interval);
        return prev;
      });
    }, 240);
    return () => clearInterval(interval);
  }, [discussionRound]);

  const togglePersona = (id: string) => {
    if (selectedPersonaIds.includes(id)) {
      if (selectedPersonaIds.length <= 2) {
        return; // Minimum 2 agents for deliberation
      }
      setSelectedPersonaIds(selectedPersonaIds.filter((p) => p !== id));
    } else {
      if (selectedPersonaIds.length >= 4) return;
      setSelectedPersonaIds([...selectedPersonaIds, id]);
    }
  };

  const handleStartDeliberation = async (overridePrompt?: string) => {
    const questionText = (overridePrompt || prompt).trim();
    if (!questionText) return;

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

    setIsDeliberating(true);
    setDiscussionRound(null);
    setSavedToVaultSuccess(false);
    setActiveTab('all');

    try {
      const res = await fetch('/api/panel-deliberate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt: questionText,
          selectedPersonaIds,
          model: selectedModel,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${res.status}`);
      }

      const data = await res.json();
      setDiscussionRound(data.round);
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    } catch (err: any) {
      console.error('Deliberation error:', err);
      setErrorMessage(err.message || 'Deliberation failed');
    } finally {
      setIsDeliberating(false);
    }
  };

  const handleSynthesizeConsensus = async () => {
    if (!discussionRound || discussionRound.contributions.length === 0) return;

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

    setIsSynthesizing(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/panel-synthesize-consensus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt: discussionRound.prompt,
          contributions: discussionRound.contributions,
          model: selectedModel,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to synthesize consensus');
      }

      const data = await res.json();
      setDiscussionRound((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          synthesizedConsensus: data.synthesizedConsensus,
          decisionMatrix: data.decisionMatrix,
        };
      });
      setActiveTab('consensus');
    } catch (err: any) {
      console.error('Synthesis error:', err);
      setErrorMessage(err.message || 'Consensus synthesis failed');
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleSaveToJournalVault = async () => {
    if (!discussionRound || !user?.uid) {
      onOpenAuth();
      return;
    }

    setIsSavingToVault(true);
    try {
      const entryId = `deliberation-${Date.now()}`;
      const entryTitle = `Council Deliberation: ${discussionRound.prompt.slice(0, 50)}...`;

      // Build action items from decision matrix or recommendations
      const actionItems = (discussionRound.decisionMatrix || []).map((dm, idx) => ({
        id: `act-dm-${idx}`,
        text: `${dm.personaName}: ${dm.recommendation}`,
        completed: false,
        priority: (idx === 0 ? 'high' : 'medium') as 'high' | 'medium',
      }));

      const newEntry: JournalEntry = {
        id: entryId,
        userId: user.uid,
        title: entryTitle,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        personaId: 'socratic',
        wordCount: discussionRound.contributions.reduce((acc, c) => acc + c.response.split(/\s+/).length, 0),
        pinned: true,
        favorite: false,
        isEncrypted: false,
        tags: ['MultiAgentCouncil', 'DecisionMatrix', 'Deliberation', 'Consensus'],
        rawConversation: [
          {
            id: `msg-dilemma-${Date.now()}`,
            role: 'user',
            text: `[COUNCIL DILEMMA]\n${discussionRound.prompt}`,
            timestamp: discussionRound.timestamp,
          },
          ...discussionRound.contributions.map((c, i) => ({
            id: `msg-agent-${c.personaId}-${i}`,
            role: 'model' as const,
            text: `### [${c.personaName} - ${c.roleTitle}]\n**Angle:** ${c.perspective}\n\n${c.response}`,
            timestamp: discussionRound.timestamp + (i + 1) * 1000,
          })),
          {
            id: `msg-consensus-${Date.now()}`,
            role: 'model' as const,
            text: `### [SYNTHESIZED STRATEGIC CONSENSUS]\n${discussionRound.synthesizedConsensus || ''}`,
            timestamp: discussionRound.timestamp + 10000,
          },
        ],
        summary: {
          title: entryTitle,
          oneLiner: `Multi-agent council consensus across ${discussionRound.contributions.length} philosophical perspectives on: ${discussionRound.prompt.slice(0, 60)}`,
          executiveSummary: discussionRound.synthesizedConsensus || 'Deliberation completed with multi-agent consensus matrix.',
          keyInsights: discussionRound.contributions.map((c) => `${c.personaName} (${c.perspective}): ${c.response.slice(0, 120)}...`),
          actionItems: actionItems.length > 0 ? actionItems : [
            { id: 'act-c1', text: 'Implement agreed council consensus strategy', completed: false, priority: 'high' }
          ],
          cognitiveThemes: ['Multi-Agent Deliberation', 'Philosophical Council', 'Consensus Synthesis'],
          suggestedTags: ['MultiAgentCouncil', 'DecisionMatrix', 'Deliberation', 'Consensus'],
          socraticQuestion: `How does reconciling these opposing viewpoints shift your fundamental approach to this dilemma?`,
          moodValence: 'reflective',
          moodScore: 88,
          clarityScore: 92,
        },
      };

      await saveJournalEntry(user.uid, newEntry);
      setSavedToVaultSuccess(true);
      setTimeout(() => setSavedToVaultSuccess(false), 4000);
    } catch (err: any) {
      console.error('Failed to save deliberation:', err);
      alert('Failed to save to journal vault: ' + err.message);
    } finally {
      setIsSavingToVault(false);
    }
  };

  const handleCopyTranscript = () => {
    if (!discussionRound) return;
    let fullText = `# Multi-Agent Deliberation Council Report\n\n**Strategic Dilemma:** ${discussionRound.prompt}\n\n`;
    discussionRound.contributions.forEach((c) => {
      fullText += `## ${c.personaName} (${c.roleTitle})\n*Perspective:* ${c.perspective}\n\n${c.response}\n\n---\n\n`;
    });
    if (discussionRound.decisionMatrix && discussionRound.decisionMatrix.length > 0) {
      fullText += `## Comparative Decision Matrix\n\n`;
      discussionRound.decisionMatrix.forEach((dm) => {
        fullText += `### ${dm.personaName}\n- **Stance:** ${dm.coreStance}\n- **Pros:** ${dm.pros.join(', ')}\n- **Risks:** ${dm.risks.join(', ')}\n- **Recommendation:** ${dm.recommendation}\n\n`;
      });
    }
    if (discussionRound.synthesizedConsensus) {
      fullText += `## Synthesized Strategic Consensus\n\n${discussionRound.synthesizedConsensus}\n`;
    }

    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getBadgeClasses = (color: string) => {
    switch (color) {
      case 'indigo':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
      case 'cyan':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      case 'emerald':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'rose':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default:
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
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
              <p className="font-semibold text-rose-300">Council Deliberation Notice</p>
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

      {/* Header Banner */}
      <div className="bg-[#11161D] border border-[#30363D] rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <BrainCircuit className="w-5 h-5" />
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                Multi-Agent Deliberation Council
              </h2>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
              Convene a round-table council of distinct philosophical AI personas to analyze your dilemma from opposing vantage points simultaneously, synthesizing a balanced, actionable decision matrix.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-[#090B0F] border border-[#30363D] rounded-xl px-3 py-1.5 text-xs text-slate-300 font-mono focus:outline-none focus:border-indigo-500"
            >
              <option value="gemini-3.7-flash">Gemini 3.7 Flash (Fast)</option>
              <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Deep Reasoning)</option>
              <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite</option>
            </select>
          </div>
        </div>

        {/* Persona Selectors with Distinct Avatars & Badges */}
        <div className="mt-6 pt-5 border-t border-[#30363D]">
          <div className="flex items-center justify-between mb-3">
            <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Council Personas ({selectedPersonaIds.length}/4 Active):
            </label>
            <span className="text-[11px] text-slate-500 font-mono">Min 2 &bull; Multi-Perspective</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {PANEL_PERSONAS_CONFIG.map((p) => {
              const isSelected = selectedPersonaIds.includes(p.id);
              const IconComp = p.icon;
              return (
                <button
                  key={p.id}
                  onClick={() => togglePersona(p.id)}
                  type="button"
                  className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between relative overflow-hidden group ${
                    isSelected
                      ? `bg-indigo-950/20 border-indigo-500/70 shadow-lg ${p.glowColor}`
                      : 'bg-[#090B0F] border-[#30363D] opacity-50 hover:opacity-90'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      {/* Avatar Chip */}
                      <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shadow-sm shrink-0 ${p.avatarBg}`}>
                        <IconComp className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block leading-tight">{p.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono block">Active Persona</span>
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono line-clamp-2 mt-1">
                    {p.roleTitle}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Input / Dilemma Submission Card */}
      <div className="bg-[#11161D] border border-[#30363D] rounded-3xl p-6 shadow-xl space-y-4">
        <label className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center justify-between">
          <span>State Your Dilemma, Decision, or Strategic Question</span>
          <span className="text-slate-500 text-[11px] font-normal font-sans">
            {prompt.length}/2000 chars
          </span>
        </label>

        <textarea
          rows={3}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. I am contemplating leaving my executive role to start an open-source AI venture. What are the blind spots, stoic realities, risk mitigations, and execution roadmap?"
          className="w-full bg-[#090B0F] border border-[#30363D] rounded-2xl p-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none leading-relaxed"
        />

        {/* Quick presets */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
            Sample Deliberation Prompts:
          </span>
          <div className="flex flex-wrap gap-2">
            {PRESET_DILEMMAS.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setPrompt(preset);
                }}
                className="text-[11px] px-3 py-1 bg-[#090B0F] hover:bg-[#161B22] text-slate-400 hover:text-slate-200 rounded-xl border border-[#30363D] transition-colors text-left"
              >
                &ldquo;{preset.slice(0, 48)}...&rdquo;
              </button>
            ))}
          </div>
        </div>

        {/* Action Button & Deliberation Progress */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#30363D]">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <span>Deliberating with:</span>
            <div className="flex -space-x-1.5">
              {PANEL_PERSONAS_CONFIG.filter((p) => selectedPersonaIds.includes(p.id)).map((p) => {
                const IconComp = p.icon;
                return (
                  <div
                    key={p.id}
                    title={`${p.name}: ${p.roleTitle}`}
                    className={`w-6 h-6 rounded-full border border-[#30363D] flex items-center justify-center ${p.avatarBg}`}
                  >
                    <IconComp className="w-3 h-3" />
                  </div>
                );
              })}
            </div>
            <span className="text-indigo-400 font-bold ml-1">{selectedPersonaIds.length} Personas</span>
          </div>

          <button
            id="convene-panel-btn"
            onClick={() => handleStartDeliberation()}
            disabled={isDeliberating || !prompt.trim()}
            className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/25 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            {isDeliberating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Council Deliberating Sequentially...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Convene Panel Deliberation</span>
              </>
            )}
          </button>
        </div>

        {/* Live Active Deliberation Status Indicator */}
        {isDeliberating && (
          <div className="p-4 rounded-2xl bg-[#090B0F] border border-indigo-500/30 space-y-3 animate-pulse">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-mono font-semibold">
              <Sparkles className="w-4 h-4 animate-spin" />
              <span>Council Round-Table in Progress:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PANEL_PERSONAS_CONFIG.filter((p) => selectedPersonaIds.includes(p.id)).map((p) => {
                const IconComp = p.icon;
                return (
                  <div
                    key={p.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#11161D] border border-[#30363D] text-[11px]"
                  >
                    <IconComp className="w-3.5 h-3.5 text-indigo-400 shrink-0 animate-bounce" />
                    <div>
                      <span className="font-bold text-slate-200">{p.name}:</span>{' '}
                      <span className="text-slate-400 font-mono">{p.activeThought}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Deliberation Results Section */}
      {discussionRound && (
        <div ref={resultsRef} className="bg-[#11161D] border border-[#30363D] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in slide-in-from-bottom-4 duration-300">
          {/* Results Header & Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#30363D] pb-4">
            <div>
              <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Deliberation Complete ({discussionRound.contributions.length} Perspectives)
              </span>
              <h3 className="text-lg font-bold text-white tracking-tight mt-0.5">
                Council Perspectives & Synthesized Consensus
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Trigger: Synthesize Actionable Consensus */}
              <button
                id="synthesize-consensus-btn"
                onClick={handleSynthesizeConsensus}
                disabled={isSynthesizing}
                title="Synthesize opposing arguments into a structured decision matrix and executive consensus"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all active:scale-95"
              >
                {isSynthesizing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Scale className="w-3.5 h-3.5" />
                )}
                <span>{isSynthesizing ? 'Reconciling...' : 'Synthesize Actionable Consensus'}</span>
              </button>

              {/* Save to Journal Vault */}
              <button
                id="save-deliberation-vault-btn"
                onClick={handleSaveToJournalVault}
                disabled={isSavingToVault}
                title="Persist this council debate and decision matrix into your secure Firestore journal vault"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all active:scale-95"
              >
                {isSavingToVault ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : savedToVaultSuccess ? (
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                ) : (
                  <BookPlus className="w-3.5 h-3.5" />
                )}
                <span>{savedToVaultSuccess ? 'Saved in Vault!' : 'Save to Vault'}</span>
              </button>

              {/* Copy Report */}
              <button
                id="copy-council-report-btn"
                onClick={handleCopyTranscript}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#090B0F] hover:bg-[#161B22] text-slate-300 rounded-xl text-xs font-medium border border-[#30363D] transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Report'}</span>
              </button>
            </div>
          </div>

          {/* View Filter Tabs with Decision Matrix and Consensus */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-[#090B0F] text-slate-400 hover:text-slate-200 border border-[#30363D]'
              }`}
            >
              All Responses ({discussionRound.contributions.length})
            </button>

            {discussionRound.synthesizedConsensus && (
              <button
                onClick={() => setActiveTab('consensus')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab === 'consensus'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-[#090B0F] text-emerald-400 hover:text-emerald-300 border border-[#30363D]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Strategic Consensus</span>
              </button>
            )}

            {discussionRound.decisionMatrix && discussionRound.decisionMatrix.length > 0 && (
              <button
                onClick={() => setActiveTab('matrix')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab === 'matrix'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-[#090B0F] text-amber-400 hover:text-amber-300 border border-[#30363D]'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>Decision Matrix</span>
              </button>
            )}

            {discussionRound.contributions.map((c) => (
              <button
                key={c.personaId}
                onClick={() => setActiveTab(c.personaId)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab === c.personaId
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-[#090B0F] text-slate-400 hover:text-slate-200 border border-[#30363D]'
                }`}
              >
                {c.personaName}
              </button>
            ))}
          </div>

          {/* Decision Matrix View Tab or Integrated Section */}
          {(activeTab === 'all' || activeTab === 'matrix') && discussionRound.decisionMatrix && discussionRound.decisionMatrix.length > 0 && (
            <div className="p-6 rounded-2xl bg-[#090B0F] border border-amber-500/30 space-y-4 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-400">
                  <Table className="w-4 h-4" />
                  <span className="text-xs font-mono uppercase tracking-wider font-bold">
                    Comparative Decision Matrix: Opposing Stances & Reconciled Next Steps
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  {discussionRound.decisionMatrix.length} Personas Mapped
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                {discussionRound.decisionMatrix.map((item, idx) => {
                  const personaConf = PANEL_PERSONAS_CONFIG.find((p) => p.id === item.personaId || p.name.toLowerCase().includes(item.personaName.toLowerCase()));
                  const IconComp = personaConf?.icon || Scale;
                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-[#11161D] border border-[#30363D] space-y-3"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-[#30363D]">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center border ${personaConf?.avatarBg || 'bg-slate-800 text-slate-300'}`}>
                            <IconComp className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-xs font-bold text-white">{item.personaName}</span>
                        </div>
                        <span className="text-[10px] font-mono text-indigo-400 px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                          Stance
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 italic">
                        &ldquo;{item.coreStance}&rdquo;
                      </p>

                      {/* Pros & Risks */}
                      <div className="space-y-2 pt-1">
                        {item.pros && item.pros.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-[10px] font-mono uppercase text-emerald-400 flex items-center gap-1 font-semibold">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              Primary Upside / Leverage:
                            </span>
                            <ul className="text-[11px] text-slate-300 space-y-0.5 pl-4 list-disc marker:text-emerald-400">
                              {item.pros.map((pro, pIdx) => (
                                <li key={pIdx}>{pro}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {item.risks && item.risks.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-[10px] font-mono uppercase text-amber-400 flex items-center gap-1 font-semibold">
                              <AlertTriangle className="w-3 h-3 text-amber-400" />
                              Risks & Cognitive Traps:
                            </span>
                            <ul className="text-[11px] text-slate-400 space-y-0.5 pl-4 list-disc marker:text-amber-400">
                              {item.risks.map((risk, rIdx) => (
                                <li key={rIdx}>{risk}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Recommendation */}
                      <div className="p-2.5 rounded-lg bg-[#090B0F] border border-[#30363D] text-[11px]">
                        <span className="text-indigo-400 font-bold block mb-0.5">Key Recommendation:</span>
                        <span className="text-slate-200">{item.recommendation}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Consensus Banner */}
          {(activeTab === 'all' || activeTab === 'consensus') && discussionRound.synthesizedConsensus && (
            <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-950/40 to-emerald-950/20 border border-emerald-500/40 space-y-3 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-xs font-mono uppercase tracking-wider font-bold">
                    Council Strategic Consensus & Unified Recommendation
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-300 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                  Reconciled Resolution
                </span>
              </div>
              <div className="text-slate-200 text-sm leading-relaxed space-y-2 markdown-body">
                <ReactMarkdown>{discussionRound.synthesizedConsensus}</ReactMarkdown>
              </div>
            </div>
          )}

          {/* Sequential Agent Contributions Grid with Persona Avatar Badges */}
          {activeTab !== 'consensus' && activeTab !== 'matrix' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {discussionRound.contributions
                .filter((c) => activeTab === 'all' || activeTab === c.personaId)
                .slice(0, activeTab === 'all' ? revealedCount : undefined)
                .map((contribution, idx) => {
                  const personaConf = PANEL_PERSONAS_CONFIG.find((p) => p.id === contribution.personaId);
                  const IconComp = personaConf?.icon || Bot;
                  return (
                    <div
                      key={contribution.personaId}
                      className="p-5 rounded-2xl bg-[#090B0F] border border-[#30363D] flex flex-col justify-between space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300 shadow-md"
                    >
                      <div>
                        {/* Agent Avatar & Role Header */}
                        <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-[#30363D]">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${personaConf?.avatarBg || 'bg-slate-800'}`}>
                              <IconComp className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-white leading-tight">
                                {contribution.personaName}
                              </h4>
                              <p className="text-[10px] text-slate-400 font-mono">
                                {contribution.roleTitle}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border shrink-0 ${getBadgeClasses(
                              contribution.badgeColor
                            )}`}
                          >
                            {contribution.perspective}
                          </span>
                        </div>

                        <div className="text-slate-300 text-xs leading-relaxed space-y-2 markdown-body">
                          <ReactMarkdown>{contribution.response}</ReactMarkdown>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[#30363D]/60 flex items-center justify-between text-[10px] font-mono text-slate-500">
                        <span>Speaker #{idx + 1} of {discussionRound.contributions.length}</span>
                        <span className="text-indigo-400">Authenticated Agent Response</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* Gemini API Key Configuration Modal */}
      <ApiKeyModal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        onKeyUpdated={() => {
          setErrorMessage(null);
          handleStartDeliberation();
        }}
      />
    </div>
  );
}

