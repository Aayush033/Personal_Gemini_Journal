/**
 * Core type definitions for Personal Gemini Journal
 */

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
  lastLoginAt?: number;
}

export interface MediaAttachment {
  id: string;
  name: string;
  type: 'image' | 'audio' | 'document';
  mimeType: string;
  dataBase64: string; // Base64 data (omits data: URL prefix for API)
  dataUrl: string; // Full data URL for client display/playback
  sizeBytes: number;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: number;
  thoughts?: string;
  attachments?: MediaAttachment[];
  personaId?: string; // For multi-agent panel identifying which agent spoke
  personaName?: string;
  groundingSources?: GroundingSource[];
  groundingQueries?: string[];
}

export type MoodType =
  | 'reflective'
  | 'energized'
  | 'calm'
  | 'anxious'
  | 'creative'
  | 'determined'
  | 'grateful'
  | 'overwhelmed';

export interface ActionItem {
  id: string;
  text: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  dueDate?: string; // Optional ISO string for calendar integration
}

export interface WisdomSummary {
  title: string;
  oneLiner: string;
  executiveSummary: string;
  keyInsights: string[];
  actionItems: ActionItem[];
  moodValence: MoodType;
  moodScore: number; // 1 - 100
  cognitiveThemes: string[];
  suggestedTags: string[];
  socraticQuestion: string;
  clarityScore: number; // 0 - 100
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  rawConversation: ChatMessage[];
  summary: WisdomSummary | null;
  tags: string[];
  isEncrypted: boolean;
  cipherData?: string | null;
  pinned: boolean;
  favorite: boolean;
  personaId: string;
  wordCount: number;
  embedding?: number[]; // Vector embedding for semantic memory and RAG
  attachments?: MediaAttachment[];
}

export interface RagSearchResult {
  entry: JournalEntry;
  similarity: number; // 0.0 to 1.0 cosine similarity
  relevanceExplanation?: string;
}

export interface PanelAgentContribution {
  personaId: string;
  personaName: string;
  roleTitle: string;
  badgeColor: string;
  response: string;
  perspective: string;
}

export interface DecisionMatrixItem {
  personaId: string;
  personaName: string;
  coreStance: string;
  pros: string[];
  risks: string[];
  recommendation: string;
}

export interface PanelDiscussionRound {
  prompt: string;
  contributions: PanelAgentContribution[];
  synthesizedConsensus?: string;
  decisionMatrix?: DecisionMatrixItem[];
  timestamp: number;
}

export interface JournalPersona {
  id: string;
  name: string;
  roleTitle: string;
  description: string;
  iconName: string;
  badgeColor: string;
  systemPrompt: string;
  starterPrompts: string[];
}

export interface ThreatItem {
  stride: 'Spoofing' | 'Tampering' | 'Repudiation' | 'Information Disclosure' | 'Denial of Service' | 'Elevation of Privilege';
  component: string;
  threatDescription: string;
  mitigationControl: string;
  enforcementLayer: 'Firestore Rules' | 'Cloud Secret Manager' | 'Firebase Auth JWT' | 'Client WebCrypto' | 'Server Validation';
  status: 'enforced' | 'verified';
}

export interface SecurityAuditReport {
  secretManagerStatus: 'SECURE_INJECTED' | 'DEVELOPMENT_FALLBACK';
  backendProxyEnforced: boolean;
  firestoreIsolationEnforced: boolean;
  zeroKnowledgeSupport: boolean;
  threatModelCount: number;
  timestamp: string;
}
