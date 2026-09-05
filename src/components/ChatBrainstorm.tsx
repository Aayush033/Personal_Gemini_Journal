import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  RotateCcw,
  Save,
  Lock,
  Volume2,
  VolumeX,
  Layers,
  ChevronDown,
  CheckCircle2,
  Loader2,
  Shield,
  HelpCircle,
  Target,
  Heart,
  Compass,
  ArrowRight,
  FileText,
  Trash2,
  X,
  Mic,
  MicOff,
  Paperclip,
  Image as ImageIcon,
  File as FileIcon,
  Download,
  Calendar as CalendarIcon,
  Globe,
  ExternalLink,
  Key,
  AlertCircle,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import confetti from 'canvas-confetti';
import {
  ChatMessage,
  JournalEntry,
  JournalPersona,
  UserProfile,
  WisdomSummary,
  MediaAttachment,
} from '../types';
import { JOURNAL_PERSONAS } from '../lib/personas';
import { saveJournalEntry } from '../lib/firestoreService';
import { encryptJournalData } from '../lib/crypto';
import { getCurrentToken, loginAnonymously } from '../lib/firebase';
import { downloadIcsFile } from '../lib/calendarExport';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { CryptoModal } from './CryptoModal';
import { ApiKeyModal } from './ApiKeyModal';

const DRAFT_STORAGE_KEY = 'gemini_journal_draft_v1';

interface LocalDraft {
  messages: ChatMessage[];
  selectedPersonaId: string;
  selectedModel: string;
  input: string;
  summaryPreview: WisdomSummary | null;
  timestamp: number;
}

interface ChatBrainstormProps {
  user: UserProfile | null;
  onOpenAuth: () => void;
  onSaveSuccess: (entryId: string) => void;
  initialConversation?: ChatMessage[];
  initialPersonaId?: string;
}

export const ChatBrainstorm: React.FC<ChatBrainstormProps> = ({
  user,
  onOpenAuth,
  onSaveSuccess,
  initialConversation,
  initialPersonaId = 'socratic',
}) => {
  // Check for auto-recovery draft if no explicit initial conversation was provided
  const [restoredDraftInfo, setRestoredDraftInfo] = useState<{ restored: boolean; timestamp?: number }>(() => {
    if (initialConversation && initialConversation.length > 0) {
      return { restored: false };
    }
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed: LocalDraft = JSON.parse(saved);
        if (
          (parsed.messages && parsed.messages.length > 1) ||
          (parsed.input && parsed.input.trim().length > 0) ||
          parsed.summaryPreview
        ) {
          return { restored: true, timestamp: parsed.timestamp };
        }
      }
    } catch {
      // ignore
    }
    return { restored: false };
  });

  const [selectedPersonaId, setSelectedPersonaId] = useState<string>(() => {
    if (initialConversation && initialConversation.length > 0) {
      return initialPersonaId;
    }
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed: LocalDraft = JSON.parse(saved);
        if (parsed.selectedPersonaId) return parsed.selectedPersonaId;
      }
    } catch {}
    return initialPersonaId;
  });

  const [selectedModel, setSelectedModel] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed: LocalDraft = JSON.parse(saved);
        if (parsed.selectedModel) return parsed.selectedModel;
      }
    } catch {}
    return 'gemini-3.6-flash';
  });

  // Google Search Grounding state
  const [enableGoogleSearch, setEnableGoogleSearch] = useState<boolean>(true);

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (initialConversation && initialConversation.length > 0) {
      return initialConversation;
    }
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed: LocalDraft = JSON.parse(saved);
        if (Array.isArray(parsed.messages) && parsed.messages.length > 0) {
          return parsed.messages;
        }
      }
    } catch {}

    const persona = JOURNAL_PERSONAS.find((p) => p.id === initialPersonaId) || JOURNAL_PERSONAS[0];
    return [
      {
        id: 'init-msg',
        role: 'model',
        text: `Hello! I am your **${persona.name}**. What thoughts, dilemmas, diagrams, or ideas are on your mind today?`,
        timestamp: Date.now(),
      },
    ];
  });

  const [input, setInput] = useState<string>(() => {
    if (initialConversation && initialConversation.length > 0) return '';
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed: LocalDraft = JSON.parse(saved);
        if (parsed.input) return parsed.input;
      }
    } catch {}
    return '';
  });

  // Multimodal attachments state
  const [attachments, setAttachments] = useState<MediaAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [summaryPreview, setSummaryPreview] = useState<WisdomSummary | null>(() => {
    if (initialConversation && initialConversation.length > 0) return null;
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed: LocalDraft = JSON.parse(saved);
        if (parsed.summaryPreview) return parsed.summaryPreview;
      }
    } catch {}
    return null;
  });

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentSpeakingId, setCurrentSpeakingId] = useState<string | null>(null);

  // Zero-Knowledge Encrypt Modal state
  const [showEncryptModal, setShowEncryptModal] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentPersona =
    JOURNAL_PERSONAS.find((p) => p.id === selectedPersonaId) || JOURNAL_PERSONAS[0];

  // Speech Recognition (Dictation)
  const {
    isListening,
    isSupported: isSpeechSupported,
    startListening,
    stopListening,
  } = useSpeechRecognition({
    onResult: (spokenText) => {
      setInput((prev) => (prev ? `${prev} ${spokenText}` : spokenText));
    },
    onError: (err) => {
      console.warn('Dictation notice:', err);
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Auto-Save Draft to LocalStorage
  useEffect(() => {
    if (initialConversation && initialConversation.length > 0) return;

    const hasSubstantialData =
      messages.length > 1 || input.trim().length > 0 || summaryPreview !== null;

    if (hasSubstantialData) {
      const draft: LocalDraft = {
        messages,
        selectedPersonaId,
        selectedModel,
        input,
        summaryPreview,
        timestamp: Date.now(),
      };
      try {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
      } catch (err) {
        console.warn('Draft auto-save notice:', err);
      }
    }
  }, [messages, input, selectedPersonaId, selectedModel, summaryPreview, initialConversation]);

  const handleDiscardDraft = () => {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {}

    setRestoredDraftInfo({ restored: false });
    const defaultPersona = JOURNAL_PERSONAS.find((p) => p.id === initialPersonaId) || JOURNAL_PERSONAS[0];
    setSelectedPersonaId(defaultPersona.id);
    setSelectedModel('gemini-3.7-flash');
    setInput('');
    setAttachments([]);
    setSummaryPreview(null);
    setMessages([
      {
        id: 'init-msg',
        role: 'model',
        text: `Hello! I am your **${defaultPersona.name}**. What thoughts, dilemmas, or ideas are on your mind today?`,
        timestamp: Date.now(),
      },
    ]);
  };

  const getAuthenticatedToken = async (): Promise<string | null> => {
    let token = await getCurrentToken();
    if (!token) {
      try {
        await loginAnonymously();
        token = await getCurrentToken();
      } catch (authErr) {
        console.warn('Anonymous auth token fallback issue:', authErr);
      }
    }
    return token;
  };

  // Multimodal file upload handling
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (file.size > 8 * 1024 * 1024) {
        alert(`File "${file.name}" exceeds 8MB limit.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const [meta, dataBase64] = result.split(',');
        const mimeType = meta.split(':')[1]?.split(';')[0] || file.type || 'application/octet-stream';

        let mediaType: 'image' | 'audio' | 'document' = 'document';
        if (mimeType.startsWith('image/')) mediaType = 'image';
        else if (mimeType.startsWith('audio/')) mediaType = 'audio';

        const newAttachment: MediaAttachment = {
          id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: file.name,
          type: mediaType,
          mimeType,
          dataBase64,
          dataUrl: result,
          sizeBytes: file.size,
        };

        setAttachments((prev) => [...prev, newAttachment]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handlePersonaChange = (newPersonaId: string) => {
    setSelectedPersonaId(newPersonaId);
    const newPersona = JOURNAL_PERSONAS.find((p) => p.id === newPersonaId) || JOURNAL_PERSONAS[0];
    
    if (messages.length > 1) {
      setMessages((prev) => [
        ...prev,
        {
          id: `sys-${Date.now()}`,
          role: 'model',
          text: `*Switched to **${newPersona.name}** mode (${newPersona.roleTitle}).* How would you like to continue our reflection?`,
          timestamp: Date.now(),
        },
      ]);
    } else {
      setMessages([
        {
          id: 'init-msg',
          role: 'model',
          text: `Hello! I am your **${newPersona.name}**. What thoughts, dilemmas, or ideas are on your mind today?`,
          timestamp: Date.now(),
        },
      ]);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if ((!text && attachments.length === 0) || loading) return;

    if (isListening) {
      stopListening();
    }

    setErrorMessage(null);

    const token = await getAuthenticatedToken();
    if (!token) {
      onOpenAuth();
      setErrorMessage('Zero-Trust Authentication: Please sign in or initialize guest session to continue.');
      return;
    }

    const currentAttachments = [...attachments];

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      text: text || (currentAttachments.length > 0 ? `[Uploaded ${currentAttachments.length} attachment(s)]` : ''),
      timestamp: Date.now(),
      attachments: currentAttachments.length > 0 ? currentAttachments : undefined,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setAttachments([]);
    setLoading(true);
    setIsStreaming(true);

    const modelMessageId = `reply-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: modelMessageId,
        role: 'model',
        text: '',
        timestamp: Date.now(),
      },
    ]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: newMessages,
          systemInstruction: currentPersona.systemPrompt,
          personaId: currentPersona.id,
          model: selectedModel,
          enableGoogleSearch: enableGoogleSearch,
          stream: true,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          onOpenAuth();
          throw new Error('Authentication expired or invalid. Please re-authenticate.');
        }
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with ${response.status}`);
      }

      if (!response.body) {
        throw new Error('Streaming response body is unavailable.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let accumulatedText = '';
      let buffer = '';
      let streamError: string | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const jsonString = trimmed.replace(/^data:\s*/, '');
            if (!jsonString) continue;
            try {
              const data = JSON.parse(jsonString);
              if (data.error) {
                streamError = data.error;
                setErrorMessage(data.error);
                break;
              }
              if (data.text) {
                accumulatedText += data.text;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === modelMessageId ? { ...msg, text: accumulatedText } : msg
                  )
                );
              }
              if (data.groundingSources || data.groundingQueries) {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === modelMessageId
                      ? {
                          ...msg,
                          groundingSources: data.groundingSources || msg.groundingSources,
                          groundingQueries: data.groundingQueries || msg.groundingQueries,
                        }
                      : msg
                  )
                );
              }
            } catch (pErr: any) {
              if (pErr.message && !pErr.message.includes('Unexpected end')) {
                console.warn('Stream chunk notice:', pErr.message);
              }
            }
          }
        }
        if (streamError) break;
      }

      if (streamError) {
        // Remove empty placeholder message so we never show hardcoded fake response
        setMessages((prev) => prev.filter((m) => m.id !== modelMessageId));
      } else if (!accumulatedText.trim()) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === modelMessageId
              ? { ...msg, text: 'I am listening deeply. Please continue sharing your thoughts.' }
              : msg
          )
        );
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      setErrorMessage(
        err.message || 'Failed to receive AI response. Please verify your Gemini API key and connection.'
      );
      setMessages((prev) => prev.filter((m) => m.id !== modelMessageId));
    } finally {
      setLoading(false);
      setIsStreaming(false);
    }
  };

  const handleSynthesizeSummary = async () => {
    if (messages.filter((m) => m.role === 'user').length === 0) {
      setErrorMessage('Please exchange at least one thought before generating a summary.');
      return;
    }

    setSummarizing(true);
    setErrorMessage(null);

    const token = await getAuthenticatedToken();
    if (!token) {
      onOpenAuth();
      setErrorMessage('Zero-Trust Authentication: Please sign in or initialize guest session to synthesize wisdom.');
      setSummarizing(false);
      return;
    }

    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages,
          personaName: currentPersona.name,
          model: selectedModel,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          onOpenAuth();
          throw new Error('Authentication expired or invalid. Please sign in again.');
        }
        const errData = await response.json();
        throw new Error(errData.error || 'Summarization failed');
      }

      const data = await response.json();
      setSummaryPreview(data.summary);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch (err: any) {
      console.error('Summarize error:', err);
      setErrorMessage(err.message || 'Failed to extract structured wisdom.');
    } finally {
      setSummarizing(false);
    }
  };

  const handleSaveToFirestore = async (passkeyToEncrypt?: string) => {
    if (!user) {
      onOpenAuth();
      return;
    }

    setSaveStatus('saving');
    setErrorMessage(null);

    try {
      let finalSummary = summaryPreview;
      if (!finalSummary) {
        const token = await getAuthenticatedToken();
        if (token) {
          const res = await fetch('/api/summarize', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              messages,
              personaName: currentPersona.name,
              model: selectedModel,
            }),
          });
          if (res.ok) {
            const sumData = await res.json();
            finalSummary = sumData.summary;
          }
        }
      }

      const entryId = `entry-${Date.now()}`;
      const now = Date.now();
      const totalWords = messages.reduce((acc, m) => acc + m.text.split(/\s+/).length, 0);
      const title = finalSummary?.title || `Reflection with ${currentPersona.name} (${new Date(now).toLocaleDateString()})`;

      const baseEntry: JournalEntry = {
        id: entryId,
        userId: user.uid,
        title,
        createdAt: now,
        updatedAt: now,
        rawConversation: messages,
        summary: finalSummary,
        tags: finalSummary?.suggestedTags || ['reflection', currentPersona.id],
        isEncrypted: false,
        cipherData: null,
        pinned: false,
        favorite: false,
        personaId: currentPersona.id,
        wordCount: totalWords,
      };

      if (passkeyToEncrypt) {
        const sensitivePayload = {
          rawConversation: messages,
          summary: finalSummary,
          title,
        };
        const ciphertext = await encryptJournalData(sensitivePayload, passkeyToEncrypt);
        
        baseEntry.isEncrypted = true;
        baseEntry.cipherData = ciphertext;
        baseEntry.title = '🔒 [Encrypted Journal Entry]';
        baseEntry.rawConversation = [];
        baseEntry.summary = null;
      }

      await saveJournalEntry(user.uid, baseEntry);
      
      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch {}
      setRestoredDraftInfo({ restored: false });

      setSaveStatus('saved');
      
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      setTimeout(() => {
        onSaveSuccess(entryId);
      }, 800);
    } catch (err: any) {
      console.error('Save error:', err);
      setSaveStatus('error');
      setErrorMessage(err.message || 'Failed to save entry to Firestore.');
    }
  };

  const handleSpeechToggle = (messageId: string, textToSpeak: string) => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in this browser.');
      return;
    }

    if (isSpeaking && currentSpeakingId === messageId) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setCurrentSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = textToSpeak.replace(/[*#_`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => {
      setIsSpeaking(false);
      setCurrentSpeakingId(null);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setCurrentSpeakingId(null);
    };

    setCurrentSpeakingId(messageId);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Draft Restored Banner */}
      {restoredDraftInfo.restored && (
        <div className="mb-4 p-3 bg-indigo-950/50 border border-indigo-500/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-indigo-200 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <span>
              <strong>Draft Auto-Recovered:</strong> Restored uncommitted reflections from your previous session
              {restoredDraftInfo.timestamp ? ` (${new Date(restoredDraftInfo.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})` : ''}.
            </span>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              onClick={handleDiscardDraft}
              className="flex items-center gap-1 px-2.5 py-1 bg-red-950/60 hover:bg-red-900/80 border border-red-500/30 text-red-300 rounded-xl transition-all cursor-pointer font-medium"
            >
              <Trash2 className="w-3 h-3" />
              <span>Discard Draft</span>
            </button>
            <button
              onClick={() => setRestoredDraftInfo({ restored: false })}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-[#161B22] transition-colors"
              title="Dismiss Notice"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Top Bento Controller Bar */}
      <div className="bg-[#11161D] border border-[#30363D] rounded-2xl p-4 mb-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Persona Selector Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 shrink-0 mr-1 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              PERSONA:
            </span>
            {JOURNAL_PERSONAS.map((p) => {
              const isSelected = p.id === selectedPersonaId;
              return (
                <button
                  key={p.id}
                  id={`persona-btn-${p.id}`}
                  onClick={() => handlePersonaChange(p.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-500/20'
                      : 'bg-[#090B0F] text-slate-400 hover:text-slate-200 border border-[#30363D]'
                  }`}
                >
                  <span>{p.name}</span>
                </button>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              id="synthesize-wisdom-btn"
              onClick={handleSynthesizeSummary}
              disabled={summarizing || loading}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
            >
              {summarizing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>{summarizing ? 'Synthesizing...' : 'Synthesize Wisdom'}</span>
            </button>

            <div className="flex items-center gap-1">
              <button
                id="save-journal-btn"
                onClick={() => handleSaveToFirestore()}
                disabled={saveStatus === 'saving' || loading}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50"
              >
                {saveStatus === 'saving' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>{saveStatus === 'saving' ? 'Saving...' : 'Save to Firestore'}</span>
              </button>

              <button
                id="save-encrypted-btn"
                onClick={() => setShowEncryptModal(true)}
                title="Zero-Knowledge Client Encryption (Encrypt with Passkey)"
                className="p-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 rounded-xl text-xs transition-colors"
              >
                <Lock className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Persona Role Card Description & Model Selector */}
        <div className="mt-3 pt-3 border-t border-[#30363D] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
          <p className="flex-1">
            <span className="font-semibold text-white">{currentPersona.roleTitle}:</span>{' '}
            {currentPersona.description}
          </p>
          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            {/* Google Search Grounding Toggle */}
            <button
              id="toggle-search-grounding-btn"
              onClick={() => setEnableGoogleSearch((prev) => !prev)}
              title={
                enableGoogleSearch
                  ? 'Google Search Grounding is ON: Gemini retrieves live factual knowledge and web research.'
                  : 'Google Search Grounding is OFF: Pure reflective reasoning mode.'
              }
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition-all border ${
                enableGoogleSearch
                  ? 'bg-blue-600/20 border-blue-500/40 text-blue-300 shadow-sm shadow-blue-500/20'
                  : 'bg-[#090B0F] border-[#30363D] text-slate-500 hover:text-slate-300'
              }`}
            >
              <Globe className={`w-3.5 h-3.5 ${enableGoogleSearch ? 'text-blue-400 animate-pulse' : 'text-slate-500'}`} />
              <span>Google Grounding: {enableGoogleSearch ? 'Active' : 'Off'}</span>
            </button>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-mono text-slate-500">Model:</span>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="bg-[#090B0F] border border-[#30363D] text-indigo-300 rounded-lg px-2 py-1 text-xs font-mono focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="gemini-3.6-flash">gemini-3.6-flash (Ultra Stable - Recommended)</option>
                <option value="gemini-3.5-flash">gemini-3.5-flash (High Availability)</option>
                <option value="gemini-3.7-flash">gemini-3.7-flash (Cutting Edge)</option>
                <option value="gemini-flash-latest">gemini-flash-latest</option>
                <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Ultra Lite)</option>
                <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview (Deep Reasoning)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Error Alert */}
      {errorMessage && (
        <div className="mb-4 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in shadow-lg shadow-rose-950/20">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-rose-300">Generation Notice</p>
              <p className="text-slate-300 leading-relaxed text-[11px]">{errorMessage}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              onClick={() => setShowApiKeyModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow transition-all active:scale-95"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Configure API Key</span>
            </button>

            {enableGoogleSearch && (
              <button
                onClick={() => {
                  setEnableGoogleSearch(false);
                  setErrorMessage(null);
                  handleSendMessage();
                }}
                className="px-3 py-1.5 bg-[#161B22] hover:bg-[#1f242c] text-blue-300 border border-blue-500/40 rounded-xl text-xs transition-all"
              >
                Disable Grounding & Retry
              </button>
            )}

            {(errorMessage?.includes('503') || errorMessage?.includes('UNAVAILABLE') || errorMessage?.includes('high demand') || selectedModel !== 'gemini-3.6-flash') && (
              <button
                onClick={() => {
                  setSelectedModel('gemini-3.6-flash');
                  setErrorMessage(null);
                  setTimeout(() => handleSendMessage(), 150);
                }}
                className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs transition-all font-medium"
              >
                Switch to 3.6 Flash & Retry
              </button>
            )}

            <button
              onClick={() => setErrorMessage(null)}
              className="px-2.5 py-1.5 text-slate-400 hover:text-slate-200 text-xs"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Two-Column Layout (Chat Stream + AI Wisdom Matrix Preview) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Conversational Stream */}
        <div className="lg:col-span-2 flex flex-col bg-[#11161D] border border-[#30363D] rounded-2xl overflow-hidden shadow-sm min-h-[560px]">
          {/* Messages Container */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 max-h-[580px]">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              const isMessageStreaming = isStreaming && msg.role === 'model' && msg.id === messages[messages.length - 1]?.id;

              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-indigo-500/20 mt-1">
                      <Sparkles className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      isUser
                        ? 'bg-indigo-600 text-white rounded-tr-none shadow-md'
                        : 'bg-[#090B0F] border border-[#30363D] text-slate-200 rounded-tl-none shadow-sm'
                    }`}
                  >
                    {/* Multimodal Attachments in Message Bubble */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mb-2.5 flex flex-wrap gap-2">
                        {msg.attachments.map((att) => (
                          <div
                            key={att.id}
                            className="rounded-xl overflow-hidden border border-white/10 bg-black/30 max-w-[200px]"
                          >
                            {att.type === 'image' ? (
                              <img
                                src={att.dataUrl}
                                alt={att.name}
                                className="max-h-36 w-auto object-cover rounded-lg"
                              />
                            ) : (
                              <div className="p-2 flex items-center gap-2 text-xs">
                                <FileIcon className="w-4 h-4 text-indigo-300" />
                                <span className="truncate text-[11px]">{att.name}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {!isUser ? (
                      <div className="markdown-body space-y-2 text-slate-200 text-sm">
                        {msg.text ? (
                          <ReactMarkdown>{msg.text}</ReactMarkdown>
                        ) : (
                          <div className="flex items-center gap-2 text-xs text-indigo-400 py-1">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Reflecting and formulating insights...</span>
                          </div>
                        )}
                        {isMessageStreaming && msg.text && (
                          <span className="inline-block w-1.5 h-3.5 ml-1 bg-indigo-400 animate-pulse rounded-full align-middle" />
                        )}

                        {/* Google Search Grounding Sources & Citations */}
                        {msg.groundingSources && msg.groundingSources.length > 0 && (
                          <div className="mt-3 pt-2.5 border-t border-[#30363D] not-prose">
                            <div className="flex items-center gap-1.5 text-[11px] font-mono text-blue-400 mb-1.5">
                              <Globe className="w-3.5 h-3.5" />
                              <span>Verified Sources (Google Search Grounding):</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {msg.groundingSources.map((source, sIdx) => (
                                <a
                                  key={sIdx}
                                  href={source.uri}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-950/40 hover:bg-blue-900/60 border border-blue-500/30 text-[10px] text-blue-300 transition-colors max-w-xs truncate"
                                  title={source.uri}
                                >
                                  <span className="truncate">{source.title || source.uri}</span>
                                  <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-70" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    )}

                    <div
                      className={`flex items-center justify-between gap-4 mt-2 pt-1 border-t ${
                        isUser ? 'border-indigo-500/30 text-indigo-200' : 'border-[#30363D] text-slate-500'
                      } text-[10px] font-mono`}
                    >
                      <span>
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>

                      {!isUser && msg.text && (
                        <button
                          onClick={() => handleSpeechToggle(msg.id, msg.text)}
                          title={isSpeaking && currentSpeakingId === msg.id ? 'Stop Speech' : 'Listen with Audio'}
                          className="hover:text-indigo-400 transition-colors flex items-center gap-1"
                        >
                          {isSpeaking && currentSpeakingId === msg.id ? (
                            <>
                              <VolumeX className="w-3 h-3 text-indigo-400 animate-pulse" />
                              <span className="text-indigo-400">Playing</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3 h-3" />
                              <span>Read</span>
                            </>
                          )}
                        </button>
                      )}
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

            {loading && !isStreaming && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0 animate-pulse">
                  <Sparkles className="w-4 h-4 animate-spin" />
                </div>
                <div className="bg-[#090B0F] border border-[#30363D] rounded-2xl rounded-tl-none p-4 text-xs text-slate-400 flex items-center gap-3">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                  <span>Gemini is reflecting on your thoughts...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Starter Prompts Bar */}
          {messages.length <= 2 && (
            <div className="px-4 py-2.5 bg-[#090B0F] border-t border-[#30363D]">
              <p className="text-[11px] font-mono font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                THOUGHT STARTERS:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {currentPersona.starterPrompts.map((starter, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(starter)}
                    className="text-left text-xs px-2.5 py-1 rounded-lg bg-[#161B22] hover:bg-[#1f242c] text-slate-300 hover:text-white border border-[#30363D] hover:border-indigo-500/40 transition-all truncate max-w-full font-mono text-[11px]"
                  >
                    &ldquo;{starter}&rdquo;
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Staged Multimodal Attachments Preview */}
          {attachments.length > 0 && (
            <div className="p-3 bg-[#090B0F] border-t border-[#30363D] flex flex-wrap gap-2 items-center">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold mr-1">
                Staged Vault:
              </span>
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#161B22] border border-[#30363D] text-xs text-slate-200"
                >
                  {att.type === 'image' ? (
                    <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                  ) : (
                    <FileIcon className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  <span className="max-w-[120px] truncate text-[11px]">{att.name}</span>
                  <button
                    onClick={() => handleRemoveAttachment(att.id)}
                    className="text-slate-400 hover:text-rose-400 ml-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Input Box & Multimodal / Dictation Controls */}
          <div className="p-3 sm:p-4 bg-[#090B0F] border-t border-[#30363D]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              {/* Multimodal Attachment Button */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,audio/*,.pdf,.txt,.md"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Attach photo, handwritten journal OCR, mood board, or audio"
                className="p-2.5 bg-[#161B22] hover:bg-[#1f242c] text-slate-300 rounded-xl border border-[#30363D] hover:border-indigo-500/50 transition-all"
              >
                <Paperclip className="w-4 h-4 text-indigo-400" />
              </button>

              {/* Dictation (Speech-to-Text) Button */}
              {isSpeechSupported && (
                <button
                  type="button"
                  onClick={isListening ? stopListening : startListening}
                  title={isListening ? 'Stop Voice Dictation' : 'Voice-to-Text Dictation'}
                  className={`p-2.5 rounded-xl border transition-all ${
                    isListening
                      ? 'bg-rose-600 text-white border-rose-500 animate-pulse'
                      : 'bg-[#161B22] hover:bg-[#1f242c] text-slate-300 border-[#30363D]'
                  }`}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-indigo-400" />}
                </button>
              )}

              <input
                id="chat-message-input"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isListening ? 'Listening to your voice dictation...' : `Share thoughts with ${currentPersona.name}...`}
                disabled={loading}
                className="flex-1 bg-[#11161D] border border-[#30363D] rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all disabled:opacity-50"
              />

              <button
                id="send-chat-btn"
                type="submit"
                disabled={(!input.trim() && attachments.length === 0) || loading}
                className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-500/20 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Right 1 Col: Live AI Wisdom Matrix & Structured Summary */}
        <div className="flex flex-col bg-[#11161D] border border-[#30363D] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#30363D]">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-sm text-white">AI Wisdom Matrix</h4>
            </div>
            {summaryPreview && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Synthesized
              </span>
            )}
          </div>

          {summaryPreview ? (
            <div className="space-y-4 flex-1 overflow-y-auto max-h-[520px] pr-1">
              {/* Title & One Liner */}
              <div>
                <h5 className="font-bold text-base text-white tracking-tight">{summaryPreview.title}</h5>
                <p className="text-xs text-indigo-300 italic mt-1">&ldquo;{summaryPreview.oneLiner}&rdquo;</p>
              </div>

              {/* Clarity & Mood Meters */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-xl bg-[#090B0F] border border-[#30363D]">
                  <p className="text-[10px] text-slate-400 uppercase font-mono">Clarity Score</p>
                  <p className="text-xl font-extrabold text-cyan-400 mt-0.5">{summaryPreview.clarityScore}%</p>
                </div>
                <div className="p-3 rounded-xl bg-[#090B0F] border border-[#30363D]">
                  <p className="text-[10px] text-slate-400 uppercase font-mono">Valence State</p>
                  <p className="text-sm font-bold text-emerald-400 capitalize mt-1">{summaryPreview.moodValence}</p>
                </div>
              </div>

              {/* Key Insights */}
              {summaryPreview.keyInsights?.length > 0 && (
                <div>
                  <p className="text-xs font-mono font-semibold text-slate-300 mb-1.5 uppercase">Cognitive Insights:</p>
                  <ul className="space-y-1.5">
                    {summaryPreview.keyInsights.map((ins, idx) => (
                      <li key={idx} className="text-xs text-slate-300 bg-[#090B0F] p-2.5 rounded-xl border border-[#30363D] flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                        <span>{ins}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Items Checklist with Calendar Export Button */}
              {summaryPreview.actionItems?.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs font-mono font-semibold text-slate-300 uppercase">Action Steps:</p>
                    <button
                      onClick={() =>
                        downloadIcsFile(
                          summaryPreview.title,
                          summaryPreview.actionItems,
                          summaryPreview.executiveSummary
                        )
                      }
                      title="Export all action steps to .ICS Calendar file"
                      className="flex items-center gap-1 text-[10px] font-mono text-indigo-300 hover:text-white px-2 py-0.5 rounded-lg bg-[#090B0F] border border-[#30363D] transition-colors"
                    >
                      <CalendarIcon className="w-3 h-3 text-indigo-400" />
                      <span>Export .ICS</span>
                    </button>
                  </div>
                  <div className="space-y-1">
                    {summaryPreview.actionItems.map((act) => (
                      <div
                        key={act.id}
                        className="text-xs bg-[#090B0F] p-2.5 rounded-xl border border-[#30363D] flex items-center justify-between"
                      >
                        <span className="text-slate-300">{act.text}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded uppercase font-mono font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                          {act.priority}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Socratic Question */}
              {summaryPreview.socraticQuestion && (
                <div className="p-3 rounded-xl bg-[#090B0F] border border-indigo-500/30 text-xs">
                  <p className="text-[10px] font-mono text-indigo-400 uppercase font-semibold mb-1">
                    Follow-Up Reflection
                  </p>
                  <p className="text-indigo-200">{summaryPreview.socraticQuestion}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <Sparkles className="w-10 h-10 text-slate-700 mb-3" />
              <p className="text-xs text-slate-400 font-medium">No active synthesis yet</p>
              <p className="text-[11px] text-slate-500 mt-1 max-w-[200px]">
                Chat with Gemini, attach photos/audio, and click &quot;Synthesize Wisdom&quot; to extract key insights, mood scores, and action items.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Zero-Knowledge Passkey Encryption Modal */}
      <CryptoModal
        isOpen={showEncryptModal}
        mode="encrypt"
        title="Zero-Knowledge Passkey Lock"
        onClose={() => setShowEncryptModal(false)}
        onSubmit={(passkey) => handleSaveToFirestore(passkey)}
      />

      {/* Gemini API Key Configuration Modal */}
      <ApiKeyModal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        onKeyUpdated={() => {
          setErrorMessage(null);
        }}
      />
    </div>
  );
};
