import React, { useState, useEffect } from 'react';
import {
  Key,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  X,
  ExternalLink,
  Loader2,
  Sparkles,
  Info,
} from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyUpdated?: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onKeyUpdated }) => {
  const [apiKey, setApiKey] = useState('');
  const [keyStatus, setKeyStatus] = useState<{
    isSet: boolean;
    isAiStudioKey: boolean;
    isSandboxToken: boolean;
    maskedKey: string;
    type: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingStatus, setFetchingStatus] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchKeyStatus = async () => {
    setFetchingStatus(true);
    try {
      const res = await fetch('/api/key-status');
      if (res.ok) {
        const data = await res.json();
        setKeyStatus(data);
      }
    } catch (err) {
      console.error('Failed to fetch key status:', err);
    } finally {
      setFetchingStatus(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setFeedback(null);
      setApiKey('');
      fetchKeyStatus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveKey = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = apiKey.trim();
    if (!cleanKey) {
      setFeedback({ type: 'error', message: 'Please enter a valid Gemini API key.' });
      return;
    }

    setLoading(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/update-api-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: cleanKey }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.details || data.error || 'Failed to update API key');
      }

      setFeedback({
        type: 'success',
        message: 'API Key successfully verified and saved to server environment!',
      });
      setApiKey('');
      await fetchKeyStatus();
      if (onKeyUpdated) onKeyUpdated();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Verification failed. Please check the key.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#090B0F]/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-[#11161D] border border-[#30363D] rounded-3xl p-6 sm:p-8 shadow-2xl shadow-indigo-950/50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          id="close-api-key-modal-btn"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-200 hover:bg-[#161B22] rounded-xl transition-colors border border-transparent hover:border-[#30363D]"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Gemini API Key Settings</h3>
            <p className="text-xs text-slate-400 font-mono">Google AI Studio &bull; Server Proxy Ingestion</p>
          </div>
        </div>

        {/* Current Key Status Card */}
        <div className="mb-5 p-4 rounded-2xl bg-[#090B0F] border border-[#30363D] text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-mono">Active Key:</span>
            {fetchingStatus ? (
              <span className="text-slate-500 font-mono flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Checking...
              </span>
            ) : (
              <span className="font-mono text-slate-200 font-semibold bg-[#161B22] px-2 py-0.5 rounded border border-[#30363D]">
                {keyStatus?.maskedKey || 'None'}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-mono">Key Classification:</span>
            <span
              className={`font-mono text-[11px] px-2 py-0.5 rounded ${
                keyStatus?.isAiStudioKey
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {keyStatus?.type || 'Standard'}
            </span>
          </div>
        </div>

        {/* Instructions & Quota Details */}
        <div className="mb-4 text-xs text-slate-300 space-y-2">
          <p className="flex items-center justify-between">
            <span>Get a new free Gemini API Key:</span>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium underline underline-offset-2"
            >
              Google AI Studio <ExternalLink className="w-3 h-3" />
            </a>
          </p>
          <div className="p-3 rounded-xl bg-[#090B0F] border border-[#30363D] space-y-1.5 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5 text-slate-300 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Supported Key Formats & Free Tier Limits</span>
            </div>
            <p className="leading-relaxed">
              Google AI Studio issues keys starting with <code className="text-slate-200 bg-[#161B22] px-1 py-0.5 rounded">AQ...</code> and <code className="text-slate-200 bg-[#161B22] px-1 py-0.5 rounded">AIzaSy...</code>. Both are supported.
            </p>
            <p className="leading-relaxed text-slate-400">
              Free-tier keys have rate limits of <span className="text-indigo-300 font-medium">15 RPM</span> and daily request quotas that reset every 24 hours (midnight Pacific Time).
            </p>
            <p className="text-emerald-400/90 pt-0.5">
              Tip: If you have an older key, paste it below and click &quot;Save &amp; Verify Key&quot; — our server will test if it has requests remaining and save it immediately.
            </p>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`mb-4 p-3 rounded-xl text-xs flex items-start gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            )}
            <span className="leading-relaxed">{feedback.message}</span>
          </div>
        )}

        {/* Form to update key */}
        <form onSubmit={handleSaveKey} className="space-y-4">
          <div>
            <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
              Enter Gemini API Key
            </label>
            <input
              type="password"
              placeholder="Paste key (AIzaSy... or AQ...)"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#090B0F] border border-[#30363D] rounded-xl text-sm font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#161B22] hover:bg-[#1f242c] text-slate-300 text-xs font-medium rounded-xl border border-[#30363D] transition-all"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading || !apiKey.trim()}
              className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {loading ? 'Verifying & Saving...' : 'Save & Verify Key'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
