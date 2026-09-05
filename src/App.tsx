/**
 * Personal Gemini Journal - Main Application Component
 * Production-grade secure personal journaling and brainstorming co-pilot.
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { AuthModal } from './components/AuthModal';
import { CryptoModal } from './components/CryptoModal';
import { ApiKeyModal } from './components/ApiKeyModal';
import { ChatBrainstorm } from './components/ChatBrainstorm';
import { JournalList } from './components/JournalList';
import { JournalDetail } from './components/JournalDetail';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { SecurityInspector } from './components/SecurityInspector';
import { PanelDiscussion } from './components/PanelDiscussion';
import { SemanticMemorySearch } from './components/SemanticMemorySearch';
import { UserProfile, JournalEntry, ChatMessage } from './types';
import { auth, subscribeToAuth, logout, loginAnonymously } from './lib/firebase';
import { subscribeToUserEntries } from './lib/firestoreService';
import { decryptJournalData } from './lib/crypto';
import { ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'journal' | 'chat' | 'panel' | 'memory' | 'analytics' | 'security'>('journal');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

  // Firestore real-time entries
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);

  // Zero-Knowledge Decrypt modal state
  const [unlockTargetEntry, setUnlockTargetEntry] = useState<JournalEntry | null>(null);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Subscribe to Firebase Auth and auto-initialize guest session if unauthenticated
  useEffect(() => {
    let isMounted = true;

    const checkLocalGuest = () => {
      if (typeof window === 'undefined') return false;
      const raw = localStorage.getItem('gemini_journal_local_user');
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (isMounted) {
            setUser(parsed);
            setAuthLoading(false);
          }
          return true;
        } catch {
          localStorage.removeItem('gemini_journal_local_user');
        }
      }
      return false;
    };

    const handleAuthEvent = () => {
      if (!auth.currentUser) {
        const hasLocal = checkLocalGuest();
        if (!hasLocal && isMounted) {
          setUser(null);
        }
      }
    };

    window.addEventListener('gemini_auth_changed', handleAuthEvent);

    const unsubscribe = subscribeToAuth(async (firebaseUser) => {
      if (firebaseUser) {
        if (isMounted) {
          localStorage.removeItem('gemini_journal_local_user');
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || (firebaseUser.isAnonymous ? 'Guest Explorer' : 'Journalist'),
            photoURL: firebaseUser.photoURL,
            isAnonymous: firebaseUser.isAnonymous,
          });
          setAuthLoading(false);
        }
      } else {
        // If local user is already active in localStorage, use it
        if (checkLocalGuest()) {
          return;
        }

        // Auto-provision guest session for zero-friction access
        try {
          const guestUser = await loginAnonymously();
          if (isMounted && guestUser) {
            setUser({
              uid: guestUser.uid,
              email: guestUser.email,
              displayName: 'Guest Explorer',
              photoURL: guestUser.photoURL,
              isAnonymous: true,
            });
          }
        } catch (guestErr) {
          console.warn('Anonymous session initialization notice, activating local guest sandbox:', guestErr);
          if (isMounted) {
            // Auto-provision local dev guest so user is instantly inside the application without friction
            const fallbackGuest: UserProfile = {
              uid: 'local-dev-guest',
              email: 'guest@localhost',
              displayName: 'Guest Explorer (Local)',
              photoURL: null,
              isAnonymous: true,
            };
            localStorage.setItem('gemini_journal_local_user', JSON.stringify(fallbackGuest));
            setUser(fallbackGuest);
          }
        } finally {
          if (isMounted) setAuthLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      window.removeEventListener('gemini_auth_changed', handleAuthEvent);
      unsubscribe();
    };
  }, []);

  // Auto-subscribe to Firestore for authenticated user
  useEffect(() => {
    if (!user) {
      setEntries([]);
      return;
    }

    const unsubscribe = subscribeToUserEntries(
      user.uid,
      (userEntries) => {
        setEntries(userEntries);
      },
      (err) => {
        console.error('Failed to sync entries from Firestore:', err);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleStartNewChat = () => {
    setSelectedEntry(null);
    setCurrentTab('chat');
  };

  const handleSaveSuccess = (entryId: string) => {
    showToast('Session saved and isolated in Cloud Firestore!');
    setCurrentTab('journal');
  };

  const handleRequestUnlock = (entry: JournalEntry) => {
    setUnlockTargetEntry(entry);
    setIsUnlockModalOpen(true);
  };

  const handleDecryptEntry = async (passkey: string) => {
    if (!unlockTargetEntry || !unlockTargetEntry.cipherData) return;

    try {
      const decryptedData = await decryptJournalData(unlockTargetEntry.cipherData, passkey);
      
      const unlockedEntry: JournalEntry = {
        ...unlockTargetEntry,
        title: decryptedData.title || unlockTargetEntry.title,
        rawConversation: decryptedData.rawConversation || [],
        summary: decryptedData.summary || null,
        isEncrypted: true,
      };

      setSelectedEntry(unlockedEntry);
      setIsUnlockModalOpen(false);
      setUnlockTargetEntry(null);
      showToast('Entry unlocked via client-side WebCrypto AES-GCM-256!');
    } catch (err: any) {
      throw new Error('Invalid passkey. Decryption failed.');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#090B0F] flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 animate-pulse shadow-lg shadow-indigo-500/20">
          <Sparkles className="w-6 h-6 animate-spin" />
        </div>
        <p className="text-xs font-mono uppercase tracking-widest text-slate-500">Initializing Secure Sandbox...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090B0F] text-slate-200 flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-[#161B22] border border-emerald-500/40 text-emerald-300 text-xs rounded-2xl shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-bottom-5">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Navigation Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setSelectedEntry(null);
          setCurrentTab(tab);
        }}
        user={user}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenApiKey={() => setIsApiKeyModalOpen(true)}
        onLogout={async () => {
          setUser(null);
          setEntries([]);
          setSelectedEntry(null);
          await logout();
          showToast('Signed out of session');
        }}
        onStartNewChat={handleStartNewChat}
        entryCount={entries.length}
      />

      {/* Main Viewport */}
      <main className="flex-1 pb-12">
        {/* Unauthenticated Notification Banner */}
        {!user && currentTab !== 'security' && (
          <div className="max-w-7xl mx-auto px-4 pt-6">
            <div className="p-4 rounded-2xl bg-[#11161D] border border-[#30363D] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 text-slate-300">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                </div>
                <span>
                  <strong className="text-white font-semibold">Authentication Required for Zero-Leakage Storage:</strong> Sign in with Google, Email, or Guest Session to persist your journal reflections to Firestore.
                </span>
              </div>
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs whitespace-nowrap shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
              >
                Sign In / Guest Access
              </button>
            </div>
          </div>
        )}

        {/* Tab 1: Journal Entries (List or Detailed View) */}
        <div className={currentTab === 'journal' ? 'block' : 'hidden'}>
          {selectedEntry ? (
            <JournalDetail
              entry={selectedEntry}
              userId={user?.uid || ''}
              onBack={() => setSelectedEntry(null)}
            />
          ) : (
            <JournalList
              entries={entries}
              userId={user?.uid || ''}
              onSelectEntry={(entry) => setSelectedEntry(entry)}
              onStartNewSession={handleStartNewChat}
              onRequestUnlock={handleRequestUnlock}
              onShowToast={showToast}
            />
          )}
        </div>

        {/* Tab 2: AI Brainstorming & Multi-turn Chat */}
        <div className={currentTab === 'chat' ? 'block' : 'hidden'}>
          <ChatBrainstorm
            user={user}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onSaveSuccess={handleSaveSuccess}
          />
        </div>

        {/* Tab 3: Multi-Agent Deliberation Panel */}
        <div className={currentTab === 'panel' ? 'block' : 'hidden'}>
          <PanelDiscussion
            user={user}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onSendToJournal={() => {
              showToast('Deliberation round saved to session!');
              setCurrentTab('journal');
            }}
          />
        </div>

        {/* Tab 4: Semantic Memory & RAG Search */}
        <div className={currentTab === 'memory' ? 'block' : 'hidden'}>
          <SemanticMemorySearch
            entries={entries}
            user={user}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onSelectEntry={(entry) => {
              setSelectedEntry(entry);
              setCurrentTab('journal');
            }}
            onStartNewSession={handleStartNewChat}
          />
        </div>

        {/* Tab 5: Wisdom & Mood Analytics */}
        <div className={currentTab === 'analytics' ? 'block' : 'hidden'}>
          <AnalyticsDashboard
            entries={entries}
            onStartNewSession={handleStartNewChat}
          />
        </div>

        {/* Tab 6: Security Constitution & Architecture Inspector */}
        <div className={currentTab === 'security' ? 'block' : 'hidden'}>
          <SecurityInspector user={user} />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#30363D] bg-[#090B0F] py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>Personal Gemini Journal &bull; Bento Grid Architecture Edition</p>
          <p className="font-mono text-[11px] text-slate-500">
            STRIDE Threat Model &bull; Cloud Secret Manager &bull; Zero Cross-User Leakage
          </p>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => showToast('Authenticated with Firebase!')}
        onLocalLogin={() => {
          const raw = localStorage.getItem('gemini_journal_local_user');
          if (raw) {
            try {
              const parsed = JSON.parse(raw);
              setUser(parsed);
            } catch {
              // handled by event listener fallback
            }
          }
        }}
      />

      {/* Zero-Knowledge Decrypt Modal */}
      <CryptoModal
        isOpen={isUnlockModalOpen}
        mode="decrypt"
        title={unlockTargetEntry?.title}
        onClose={() => {
          setIsUnlockModalOpen(false);
          setUnlockTargetEntry(null);
        }}
        onSubmit={handleDecryptEntry}
      />

      {/* Gemini API Key Configuration Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onKeyUpdated={() => showToast('Gemini API Key updated successfully!')}
      />
    </div>
  );
}
