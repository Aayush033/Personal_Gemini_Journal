import React, { useState } from 'react';
import {
  Shield,
  Lock,
  Mail,
  KeyRound,
  User,
  AlertCircle,
  X,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { loginWithGoogle, loginWithEmail, registerWithEmail, loginAnonymously } from '../lib/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onLocalLogin?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess, onLocalLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLocalDevLogin = () => {
    localStorage.setItem(
      'gemini_journal_local_user',
      JSON.stringify({
        uid: 'local-dev-guest',
        email: 'guest@localhost',
        displayName: 'Guest Explorer (Local)',
        photoURL: null,
        isAnonymous: true,
      })
    );
    window.dispatchEvent(new Event('gemini_auth_changed'));
    if (onLocalLogin) onLocalLogin();
    if (onSuccess) onSuccess();
    onClose();
  };

  const formatAuthError = (err: any, provider: 'google' | 'email'): string => {
    const code = err?.code || '';
    const msg = err?.message || '';

    if (
      code === 'auth/operation-not-allowed' ||
      code === 'auth/admin-restricted-operation' ||
      msg.includes('operation-not-allowed') ||
      msg.includes('admin-restricted-operation')
    ) {
      return `${
        provider === 'google' ? 'Google Sign-In' : 'Email/Password'
      } is not enabled in Firebase Console (Authentication > Sign-in method). You can enable it in Firebase Console, or click "Continue as Local Dev Guest" below to start immediately without setup.`;
    }

    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
      return 'Invalid email or password. If you do not have an account yet, click "Create one" below.';
    }

    if (code === 'auth/email-already-in-use') {
      return 'An account with this email already exists. Click "Sign in here" below.';
    }

    if (code === 'auth/weak-password') {
      return 'Password must be at least 6 characters.';
    }

    if (code === 'auth/popup-closed-by-user') {
      return 'Sign-in popup was closed before completing.';
    }

    if (code === 'auth/popup-blocked') {
      return 'Popup was blocked by the browser. Please allow popups for localhost.';
    }

    return err?.message || 'Authentication failed. Please check credentials or continue as Local Dev Guest.';
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      setError(formatAuthError(err, 'google'));
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (isRegister) {
        await registerWithEmail(email, password, displayName);
      } else {
        await loginWithEmail(email, password);
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Email Auth Error:', err);
      setError(formatAuthError(err, 'email'));
    } finally {
      setLoading(false);
    }
  };

  const handleAnonymousLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await loginAnonymously();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.warn('Firebase Anonymous login notice, switching to Local Dev Guest session:', err);
      // Auto fallback directly to Local Dev Guest session so the user is never blocked!
      handleLocalDevLogin();
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
        {/* Close Button */}
        <button
          id="close-auth-modal-btn"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-200 hover:bg-[#161B22] rounded-xl transition-colors border border-transparent hover:border-[#30363D]"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-3">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">
            {isRegister ? 'Create Secure Account' : 'Authenticate Your Journal'}
          </h3>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Zero Cross-User Leakage &bull; Cryptographic Isolation
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex flex-col gap-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
            {(error.includes('Firebase Console') || error.includes('not enabled')) && (
              <button
                type="button"
                onClick={handleLocalDevLogin}
                className="mt-1 self-start px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-[11px] rounded-lg transition-all shadow"
              >
                Continue as Local Dev Guest &rarr;
              </button>
            )}
          </div>
        )}

        {/* Google Sign-in Button */}
        <button
          id="google-signin-btn"
          type="button"
          disabled={loading}
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-[#161B22] hover:bg-[#1f242c] text-slate-100 font-medium text-sm rounded-xl border border-[#30363D] transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 mb-4"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Divider */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#30363D]"></div>
          </div>
          <div className="relative flex justify-center text-[11px] uppercase">
            <span className="bg-[#11161D] px-2 text-slate-500 font-mono">or email credentials</span>
          </div>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleEmailAuth} className="space-y-3">
          {isRegister && (
            <div>
              <label className="block text-xs font-mono font-medium text-slate-300 mb-1">Display Name</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  id="auth-name-input"
                  type="text"
                  placeholder="Alex Rivers"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#090B0F] border border-[#30363D] rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-mono font-medium text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                id="auth-email-input"
                type="email"
                required
                placeholder="developer@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#090B0F] border border-[#30363D] rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono font-medium text-slate-300 mb-1">Password</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                id="auth-password-input"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#090B0F] border border-[#30363D] rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <button
            id="auth-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        {/* Toggle Register / Login */}
        <div className="text-center mt-3">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            {isRegister
              ? 'Already have an account? Sign in here'
              : "Don't have an account? Create one"}
          </button>
        </div>

        {/* Guest Session Alternative */}
        <div className="mt-4 pt-3 border-t border-[#30363D] space-y-2">
          <button
            id="guest-session-btn"
            type="button"
            disabled={loading}
            onClick={handleAnonymousLogin}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-[#090B0F] hover:bg-[#161B22] border border-[#30363D] text-slate-300 hover:text-white text-xs transition-all"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-medium">Explore as Anonymous Guest (Firebase)</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
          </button>

          <button
            id="local-guest-btn"
            type="button"
            disabled={loading}
            onClick={handleLocalDevLogin}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-indigo-950/20 hover:bg-indigo-950/40 border border-indigo-500/30 text-indigo-200 hover:text-white text-xs transition-all"
          >
            <div className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-medium">Continue as Local Dev Guest (Zero Setup)</span>
            </div>
            <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">Instant</span>
          </button>

          <p className="text-[10px] text-slate-500 mt-1.5 text-center font-mono">
            Isolated tenant storage with Zero-Knowledge encryption support.
          </p>
        </div>
      </div>
    </div>
  );
};
