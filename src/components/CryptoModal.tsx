import React, { useState } from 'react';
import { Lock, Key, ShieldCheck, X, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface CryptoModalProps {
  isOpen: boolean;
  mode: 'encrypt' | 'decrypt';
  title?: string;
  onClose: () => void;
  onSubmit: (passkey: string) => Promise<void> | void;
}

export const CryptoModal: React.FC<CryptoModalProps> = ({
  isOpen,
  mode,
  title,
  onClose,
  onSubmit,
}) => {
  const [passkey, setPasskey] = useState('');
  const [confirmPasskey, setConfirmPasskey] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passkey) {
      setError('Please enter a passkey.');
      return;
    }

    if (mode === 'encrypt' && passkey !== confirmPasskey) {
      setError('Passkeys do not match. Please re-enter.');
      return;
    }

    if (passkey.length < 4) {
      setError('Passkey must be at least 4 characters.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onSubmit(passkey);
      setPasskey('');
      setConfirmPasskey('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Decryption failed. Please verify your passkey.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#090B0F]/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-[#11161D] border border-[#30363D] rounded-3xl p-6 sm:p-8 shadow-2xl shadow-indigo-950/40"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          id="close-crypto-modal-btn"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-200 hover:bg-[#161B22] rounded-xl transition-colors border border-transparent hover:border-[#30363D]"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight">
            {mode === 'encrypt' ? 'Zero-Knowledge Encrypt Entry' : 'Unlock Encrypted Entry'}
          </h3>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            {title ? `"${title}"` : 'Client-side AES-GCM-256 + PBKDF2'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-mono font-medium text-slate-300 mb-1">
              {mode === 'encrypt' ? 'Set Private Secret Passkey / PIN' : 'Enter Decryption Passkey'}
            </label>
            <div className="relative">
              <Key className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                id="crypto-passkey-input"
                type={showPassword ? 'text' : 'password'}
                required
                autoFocus
                placeholder="Enter private passkey"
                value={passkey}
                onChange={(e) => setPasskey(e.target.value)}
                className="w-full pl-9 pr-10 py-2 bg-[#090B0F] border border-[#30363D] rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {mode === 'encrypt' && (
            <div>
              <label className="block text-xs font-mono font-medium text-slate-300 mb-1">
                Confirm Private Passkey
              </label>
              <div className="relative">
                <Key className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  id="crypto-confirm-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Re-enter passkey"
                  value={confirmPasskey}
                  onChange={(e) => setConfirmPasskey(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#090B0F] border border-[#30363D] rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>
          )}

          <div className="p-3.5 bg-[#090B0F] rounded-2xl border border-[#30363D] text-[11px] text-slate-400 leading-relaxed">
            <div className="flex items-center gap-1.5 text-amber-400 font-medium mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="font-semibold">Zero-Knowledge Guarantee</span>
            </div>
            {mode === 'encrypt'
              ? 'Your passkey is NEVER sent to Google or Firestore. If you lose this passkey, this entry cannot be recovered by anyone.'
              : 'Decryption happens locally in your browser memory via Web Crypto Subtle API.'}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-[#161B22] rounded-xl border border-transparent hover:border-[#30363D] transition-colors"
            >
              Cancel
            </button>
            <button
              id="crypto-submit-btn"
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-amber-600/20 active:scale-95 disabled:opacity-50 transition-all"
            >
              {loading
                ? 'Processing...'
                : mode === 'encrypt'
                ? 'Encrypt & Lock Entry'
                : 'Unlock Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
