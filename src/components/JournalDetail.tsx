import React, { useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  Sparkles,
  CheckCircle2,
  Circle,
  Volume2,
  VolumeX,
  Download,
  Share2,
  Lock,
  Star,
  Pin,
  Tag,
  Clock,
  Printer,
  FileText,
  HelpCircle,
  ShieldCheck,
  User,
  Bot,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { JournalEntry } from '../types';
import { updateActionItemStatus } from '../lib/firestoreService';
import { downloadIcsFile } from '../lib/calendarExport';

interface JournalDetailProps {
  entry: JournalEntry;
  userId: string;
  onBack: () => void;
}

export const JournalDetail: React.FC<JournalDetailProps> = ({ entry, userId, onBack }) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'conversation'>('summary');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<JournalEntry>(entry);

  const handleActionToggle = async (actionId: string, currentCompleted: boolean) => {
    try {
      const newStatus = !currentCompleted;
      await updateActionItemStatus(
        userId,
        currentEntry.id,
        actionId,
        newStatus,
        currentEntry.summary
      );

      // Local state update for instant UI feedback
      if (currentEntry.summary) {
        const updatedItems = currentEntry.summary.actionItems.map((item) =>
          item.id === actionId ? { ...item, completed: newStatus } : item
        );
        setCurrentEntry({
          ...currentEntry,
          summary: {
            ...currentEntry.summary,
            actionItems: updatedItems,
          },
        });
      }
    } catch (err) {
      console.error('Error updating action item status:', err);
    }
  };

  const handleAudioReadout = () => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported on this browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    if (!currentEntry.summary) return;

    window.speechSynthesis.cancel();
    const text = `Journal Entry: ${currentEntry.title}. Summary: ${currentEntry.summary.executiveSummary}. Key insights: ${currentEntry.summary.keyInsights.join('. ')}`;
    const cleanText = text.replace(/[*#_`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const exportMarkdown = () => {
    let md = `# ${currentEntry.title}\n\n`;
    md += `**Date:** ${new Date(currentEntry.createdAt).toLocaleString()}\n`;
    md += `**Word Count:** ${currentEntry.wordCount}\n`;
    md += `**Tags:** ${currentEntry.tags.join(', ')}\n\n`;

    if (currentEntry.summary) {
      md += `## Executive Summary\n> "${currentEntry.summary.oneLiner}"\n\n${currentEntry.summary.executiveSummary}\n\n`;
      md += `## Key Insights\n`;
      currentEntry.summary.keyInsights.forEach((k) => (md += `- ${k}\n`));
      md += `\n## Action Items\n`;
      currentEntry.summary.actionItems.forEach(
        (a) => (md += `- [${a.completed ? 'x' : ' '}] (${a.priority.toUpperCase()}) ${a.text}\n`)
      );
      md += `\n## Socratic Follow-Up\n_${currentEntry.summary.socraticQuestion}_\n\n`;
    }

    md += `## Multi-turn Conversation Transcript\n\n`;
    currentEntry.rawConversation.forEach((msg) => {
      md += `### ${msg.role === 'user' ? 'User' : 'Gemini AI'} (${new Date(
        msg.timestamp
      ).toLocaleTimeString()})\n\n${msg.text}\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentEntry.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_journal.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportJSON = () => {
    const jsonStr = JSON.stringify(currentEntry, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentEntry.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_journal.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const { summary } = currentEntry;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 animate-in fade-in duration-150">
      {/* Navigation and Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <button
          id="back-to-journals-btn"
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#161B22] hover:bg-[#1f242c] text-slate-300 rounded-xl text-xs font-semibold border border-[#30363D] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Journals</span>
        </button>

        <div className="flex items-center gap-2">
          {summary && (
            <button
              onClick={handleAudioReadout}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                isSpeaking
                  ? 'bg-indigo-600 text-white border-indigo-500 animate-pulse'
                  : 'bg-[#161B22] text-slate-300 hover:text-white border-[#30363D]'
              }`}
            >
              {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              <span>{isSpeaking ? 'Stop Audio' : 'Listen Summary'}</span>
            </button>
          )}

          <button
            onClick={exportMarkdown}
            title="Download Markdown"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#161B22] hover:bg-[#1f242c] text-slate-300 rounded-xl text-xs font-medium border border-[#30363D] transition-colors font-mono"
          >
            <Download className="w-3.5 h-3.5" />
            <span>.MD</span>
          </button>

          <button
            onClick={exportJSON}
            title="Download JSON"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#161B22] hover:bg-[#1f242c] text-slate-300 rounded-xl text-xs font-medium border border-[#30363D] transition-colors font-mono"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>JSON</span>
          </button>

          <button
            onClick={handlePrint}
            title="Print Entry"
            className="p-1.5 bg-[#161B22] hover:bg-[#1f242c] text-slate-400 hover:text-slate-200 rounded-xl border border-[#30363D] transition-colors"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Bento Container Card */}
      <div className="bg-[#11161D] border border-[#30363D] rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        {/* Entry Header */}
        <div className="border-b border-[#30363D] pb-6">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {summary?.moodValence && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold capitalize bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {summary.moodValence}
              </span>
            )}
            {currentEntry.isEncrypted && (
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Lock className="w-3 h-3" />
                Zero-Knowledge Encrypted
              </span>
            )}
            <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              {new Date(currentEntry.createdAt).toLocaleDateString(undefined, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {currentEntry.title}
          </h2>

          {summary?.oneLiner && (
            <p className="text-sm text-indigo-300 font-medium italic mt-2">
              &ldquo;{summary.oneLiner}&rdquo;
            </p>
          )}

          {/* Tags */}
          {currentEntry.tags?.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mt-4">
              {currentEntry.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs bg-[#090B0F] text-slate-400 border border-[#30363D] font-mono"
                >
                  <Tag className="w-2.5 h-2.5 text-indigo-400" />
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 border-b border-[#30363D] pb-2">
          <button
            onClick={() => setActiveTab('summary')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'summary'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#161B22]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Wisdom Synthesis</span>
          </button>
          <button
            onClick={() => setActiveTab('conversation')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'conversation'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#161B22]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Full Multi-Turn Dialogue ({currentEntry.rawConversation.length})</span>
          </button>
        </div>

        {/* Tab 1: AI Wisdom Synthesis */}
        {activeTab === 'summary' && summary && (
          <div className="space-y-6">
            {/* Executive Summary */}
            <div className="p-5 rounded-2xl bg-[#090B0F] border border-[#30363D] space-y-3">
              <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider font-mono">
                Executive Synthesis
              </h4>
              <div className="text-slate-300 text-sm leading-relaxed space-y-2">
                <ReactMarkdown>{summary.executiveSummary}</ReactMarkdown>
              </div>
            </div>

            {/* Bento Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-[#090B0F] border border-[#30363D]">
                <p className="text-[10px] uppercase font-mono text-slate-400 font-semibold">
                  Clarity Metric
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-extrabold text-cyan-400">{summary.clarityScore}%</span>
                  <span className="text-xs text-slate-500 font-mono">structural coherence</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#090B0F] border border-[#30363D]">
                <p className="text-[10px] uppercase font-mono text-slate-400 font-semibold">
                  Emotional Valence
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-xl font-bold text-emerald-400 capitalize">{summary.moodValence}</span>
                  <span className="text-xs text-slate-500 font-mono">({summary.moodScore}/100)</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#090B0F] border border-[#30363D]">
                <p className="text-[10px] uppercase font-mono text-slate-400 font-semibold">
                  Isolation Layer
                </p>
                <div className="flex items-baseline gap-1 mt-1 text-xs text-indigo-300 font-mono font-medium">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Firestore Sandbox</span>
                </div>
              </div>
            </div>

            {/* Key Insights */}
            {summary.keyInsights?.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                  Core Cognitive Insights
                </h4>
                <div className="grid grid-cols-1 gap-2.5">
                  {summary.keyInsights.map((insight, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-[#090B0F] border border-[#30363D] flex items-start gap-3"
                    >
                      <div className="p-1 rounded bg-indigo-500/10 text-indigo-400 shrink-0 mt-0.5">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <p className="text-sm text-slate-200 leading-relaxed">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Items Interactive Checklist */}
            {summary.actionItems?.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                    Action Plan & Next Steps
                  </h4>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        downloadIcsFile(
                          currentEntry.title,
                          summary.actionItems,
                          summary.executiveSummary
                        )
                      }
                      title="Export all action steps to .ICS Calendar file"
                      className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-mono transition-colors"
                    >
                      <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Export to Calendar (.ICS)</span>
                    </button>
                    <span className="text-xs text-slate-400 font-mono">
                      {summary.actionItems.filter((a) => a.completed).length}/{summary.actionItems.length} Completed
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  {summary.actionItems.map((act) => (
                    <button
                      key={act.id}
                      onClick={() => handleActionToggle(act.id, act.completed)}
                      className={`w-full text-left p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                        act.completed
                          ? 'bg-[#090B0F]/50 border-[#30363D] text-slate-500 line-through'
                          : 'bg-[#090B0F] border-[#30363D] hover:border-indigo-500/50 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {act.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        ) : (
                          <Circle className="w-5 h-5 text-slate-500 shrink-0 hover:text-indigo-400" />
                        )}
                        <span className="text-sm font-medium">{act.text}</span>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-mono font-bold ${
                          act.priority === 'high'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                        }`}
                      >
                        {act.priority}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Socratic Deep Question */}
            {summary.socraticQuestion && (
              <div className="p-5 rounded-2xl bg-[#090B0F] border border-indigo-500/30">
                <div className="flex items-center gap-2 text-indigo-400 mb-2">
                  <HelpCircle className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase font-mono tracking-wider">
                    Socratic Inquiry for Further Reflection
                  </span>
                </div>
                <p className="text-sm text-indigo-200 leading-relaxed font-medium">
                  &ldquo;{summary.socraticQuestion}&rdquo;
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Full Multi-Turn Conversation */}
        {activeTab === 'conversation' && (
          <div className="space-y-4">
            {currentEntry.rawConversation.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0 mt-1 shadow-md shadow-indigo-500/20">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed ${
                      isUser
                        ? 'bg-indigo-600 text-white rounded-tr-none'
                        : 'bg-[#090B0F] border border-[#30363D] text-slate-200 rounded-tl-none'
                    }`}
                  >
                    {!isUser ? (
                      <div className="markdown-body space-y-2 text-slate-200 text-sm">
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    )}

                    <div
                      className={`mt-2 pt-1 border-t text-[10px] font-mono ${
                        isUser ? 'border-indigo-500/30 text-indigo-200' : 'border-[#30363D] text-slate-500'
                      }`}
                    >
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-xl bg-[#161B22] border border-[#30363D] flex items-center justify-center text-slate-300 shrink-0 mt-1">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
