import { ThreatItem } from '../types';

export const THREAT_MODEL_ITEMS: ThreatItem[] = [
  {
    stride: 'Spoofing',
    component: 'User Identity & Authentication Provider',
    threatDescription: 'Attacker crafts fake user identities or tries accessing endpoints with forged client headers.',
    mitigationControl: 'Firebase Authentication with cryptographically signed RS256 JWT tokens. Token claims and UID are verified against request.auth in Firestore security rules.',
    enforcementLayer: 'Firebase Auth JWT',
    status: 'enforced',
  },
  {
    stride: 'Tampering',
    component: 'Journal Entries & Thought Stream',
    threatDescription: 'Malicious actors attempt to modify or inject unauthorized metadata into another user\'s journal records.',
    mitigationControl: 'Document-level Firestore security rules enforce request.auth.uid == userId. Client payload validation ensures immutable creation timestamps.',
    enforcementLayer: 'Firestore Rules',
    status: 'enforced',
  },
  {
    stride: 'Repudiation',
    component: 'Audit Trail & Entry History',
    threatDescription: 'User denies taking an action, or session modifications occur without trace.',
    mitigationControl: 'Deterministic updatedAt and createdAt timestamps recorded on all document operations. Revision logs preserved within user boundaries.',
    enforcementLayer: 'Firestore Rules',
    status: 'enforced',
  },
  {
    stride: 'Information Disclosure',
    component: 'API Keys & Secrets (Gemini API)',
    threatDescription: 'Leaking GEMINI_API_KEY into client bundles, browser network tab, or devtools console.',
    mitigationControl: 'Google Cloud Secret Manager / Server-Side Environment Ingestion. Frontend never imports @google/genai. All AI generation is isolated behind Express /api/* proxy.',
    enforcementLayer: 'Cloud Secret Manager',
    status: 'enforced',
  },
  {
    stride: 'Information Disclosure',
    component: 'Confidential Journal Entries',
    threatDescription: 'Unauthorized disclosure of intimate journal entries even in the event of database access.',
    mitigationControl: 'Zero-Knowledge Client-Side AES-GCM-256 with PBKDF2 encryption. Passkey is never transmitted or stored on cloud servers.',
    enforcementLayer: 'Client WebCrypto',
    status: 'enforced',
  },
  {
    stride: 'Denial of Service',
    component: 'AI Generation & Context Window Bombing',
    threatDescription: 'Malicious prompt flooding or infinite recursive token generation draining API quota.',
    mitigationControl: 'Backend rate limiting, max message length caps (10,000 chars), context window truncation, and structured JSON output guards.',
    enforcementLayer: 'Server Validation',
    status: 'enforced',
  },
  {
    stride: 'Elevation of Privilege',
    component: 'Firestore Multi-Tenant Isolation',
    threatDescription: 'Attacker queries /users/* to list other users\' journal entries, summaries, or metadata.',
    mitigationControl: 'Firestore Rules enforce absolute denial of collection listing outside own UID subtree (/users/{userId}/**). Root query access is completely blocked (match /{document=**} { allow read, write: if false; }).',
    enforcementLayer: 'Firestore Rules',
    status: 'enforced',
  },
];

export const OWASP_LLM_DEFENSES = [
  {
    id: 'LLM01',
    name: 'Prompt Injection Defense',
    description: 'Separation of system instructions and user input through strict conversational turn structures and input filtering.',
    status: 'Passed',
  },
  {
    id: 'LLM02',
    name: 'Insecure Output Handling',
    description: 'Safe rendering via sanitized AST markdown parser (react-markdown) preventing XSS/HTML injection.',
    status: 'Passed',
  },
  {
    id: 'LLM06',
    name: 'Sensitive Information Disclosure',
    description: 'Zero AI client exposure; API keys never injected into HTML or JS client bundles.',
    status: 'Passed',
  },
  {
    id: 'LLM08',
    name: 'Vector & Store Isolation',
    description: 'Per-user partitioned subcollections ensuring zero cross-tenant knowledge base cross-contamination.',
    status: 'Passed',
  },
];
