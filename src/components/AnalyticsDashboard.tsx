import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import {
  Sparkles,
  Heart,
  Target,
  Brain,
  CheckCircle2,
  TrendingUp,
  Award,
  Zap,
} from 'lucide-react';
import { JournalEntry, MoodType } from '../types';

interface AnalyticsDashboardProps {
  entries: JournalEntry[];
  onStartNewSession: () => void;
}

const MOOD_COLORS: Record<string, string> = {
  reflective: '#6366f1', // indigo
  energized: '#f59e0b', // amber
  calm: '#06b6d4', // cyan
  creative: '#a855f7', // purple
  determined: '#10b981', // emerald
  grateful: '#f43f5e', // rose
  anxious: '#64748b', // slate
  overwhelmed: '#ef4444', // red
};

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  entries,
  onStartNewSession,
}) => {
  // Aggregate Mood Data
  const moodDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    entries.forEach((e) => {
      const mood = e.summary?.moodValence || 'reflective';
      counts[mood] = (counts[mood] || 0) + 1;
    });

    return Object.keys(counts).map((name) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      rawName: name,
      value: counts[name],
      color: MOOD_COLORS[name] || '#6366f1',
    }));
  }, [entries]);

  // Aggregate Clarity and Word Trends (sorted chronological)
  const timelineData = useMemo(() => {
    const sorted = [...entries]
      .sort((a, b) => a.createdAt - b.createdAt)
      .slice(-10);

    return sorted.map((e) => ({
      date: new Date(e.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }),
      clarity: e.summary?.clarityScore || 75,
      words: e.wordCount || 120,
      title: e.title,
    }));
  }, [entries]);

  // Aggregate Themes
  const themeFrequency = useMemo(() => {
    const themeCounts: Record<string, number> = {};
    entries.forEach((e) => {
      if (e.summary?.cognitiveThemes) {
        e.summary.cognitiveThemes.forEach((th) => {
          themeCounts[th] = (themeCounts[th] || 0) + 1;
        });
      }
      e.tags.forEach((t) => {
        themeCounts[t] = (themeCounts[t] || 0) + 1;
      });
    });

    return Object.entries(themeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([theme, count]) => ({ theme, count }));
  }, [entries]);

  // Aggregate Action Items Stats
  const actionStats = useMemo(() => {
    let total = 0;
    let completed = 0;
    entries.forEach((e) => {
      if (e.summary?.actionItems) {
        e.summary.actionItems.forEach((act) => {
          total++;
          if (act.completed) completed++;
        });
      }
    });
    return {
      total,
      completed,
      rate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [entries]);

  const avgClarity = useMemo(() => {
    const withClarity = entries.filter((e) => e.summary?.clarityScore);
    if (withClarity.length === 0) return 85;
    const sum = withClarity.reduce((acc, e) => acc + (e.summary?.clarityScore || 0), 0);
    return Math.round(sum / withClarity.length);
  }, [entries]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Top Bento Stat Banners */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#11161D] border border-[#30363D] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase font-mono">
              Total Reflections
            </p>
            <p className="text-2xl font-extrabold text-white mt-1 font-mono">{entries.length}</p>
            <p className="text-[11px] text-indigo-400 mt-0.5 font-mono">Isolated in Firestore</p>
          </div>
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
            <Brain className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#11161D] border border-[#30363D] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase font-mono">
              Avg Clarity Index
            </p>
            <p className="text-2xl font-extrabold text-cyan-400 mt-1 font-mono">{avgClarity}%</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Gemini Cognitive Score</p>
          </div>
          <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400">
            <Zap className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#11161D] border border-[#30363D] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase font-mono">
              Action Items Closed
            </p>
            <p className="text-2xl font-extrabold text-emerald-400 mt-1 font-mono">
              {actionStats.completed}/{actionStats.total}
            </p>
            <p className="text-[11px] text-emerald-400 mt-0.5 font-mono">{actionStats.rate}% Completion rate</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#11161D] border border-[#30363D] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase font-mono">
              Top Cognitive State
            </p>
            <p className="text-xl font-extrabold text-purple-400 capitalize mt-1">
              {moodDistribution[0]?.name || 'Reflective'}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Primary Journal Valence</p>
          </div>
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
            <Heart className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Bento Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Emotional & Mood Valence Distribution */}
        <div className="p-6 rounded-2xl bg-[#11161D] border border-[#30363D] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-base font-bold text-white tracking-tight">Emotional Valence Distribution</h4>
              <p className="text-xs text-slate-400">Cognitive states analyzed across your entries</p>
            </div>
          </div>

          {moodDistribution.length > 0 ? (
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={moodDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {moodDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#090B0F',
                      borderColor: '#30363D',
                      borderRadius: '12px',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-500 text-xs">
              Record journal entries to generate emotional distribution analytics.
            </div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {moodDistribution.map((m) => (
              <div key={m.name} className="flex items-center gap-1.5 text-xs text-slate-300 font-mono">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: m.color }} />
                <span>
                  {m.name} ({m.value})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 2: Clarity & Cognitive Coherence Trajectory */}
        <div className="p-6 rounded-2xl bg-[#11161D] border border-[#30363D] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-base font-bold text-white tracking-tight">Clarity Index Trajectory</h4>
              <p className="text-xs text-slate-400">Recent session cognitive clarity scores</p>
            </div>
          </div>

          {timelineData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#161B22" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#090B0F',
                      borderColor: '#30363D',
                      borderRadius: '12px',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="clarity"
                    name="Clarity Score (%)"
                    stroke="#06b6d4"
                    strokeWidth={3}
                    dot={{ fill: '#06b6d4', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-500 text-xs">
              Complete sessions to view clarity trends.
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row: Top Themes & Action Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Cognitive Themes */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-[#11161D] border border-[#30363D] shadow-sm space-y-4">
          <h4 className="text-base font-bold text-white flex items-center gap-2">
            <Brain className="w-4 h-4 text-indigo-400" />
            <span>Recurring Mental Themes & Focus Areas</span>
          </h4>

          {themeFrequency.length > 0 ? (
            <div className="space-y-3">
              {themeFrequency.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-300 font-mono">
                    <span className="font-medium text-slate-200">#{item.theme}</span>
                    <span className="text-slate-400">{item.count} session(s)</span>
                  </div>
                  <div className="w-full h-2 bg-[#090B0F] border border-[#30363D]/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full"
                      style={{
                        width: `${Math.min(100, (item.count / entries.length) * 100 || 20)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">No themes extracted yet.</p>
          )}
        </div>

        {/* Action Callout */}
        <div className="p-6 rounded-2xl bg-[#11161D] border border-[#30363D] shadow-sm flex flex-col justify-between">
          <div>
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 w-fit mb-3">
              <Sparkles className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white">Ready for Today&apos;s Inquiry?</h4>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Explore your strategic challenges, emotional landscape, or creative hypotheses with the Socratic Mirror.
            </p>
          </div>

          <button
            onClick={onStartNewSession}
            className="mt-6 w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
          >
            Start Fresh Brainstorm
          </button>
        </div>
      </div>
    </div>
  );
};
