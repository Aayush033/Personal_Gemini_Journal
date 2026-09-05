import { JournalEntry } from '../types';
import { saveJournalEntry } from './firestoreService';

/**
 * Pre-populated Demo Journal Sessions for Hackathon Reviewers and instant system exploration.
 * Covers diverse topics: Career Strategy, System Architecture, and Somatic Mindfulness.
 */
export const SAMPLE_JOURNAL_ENTRIES: Omit<JournalEntry, 'userId'>[] = [
  {
    id: 'demo-career-pivot-01',
    title: 'Career Strategic Pivot: Executive Leadership vs AI Startup Founder',
    createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2 days ago
    updatedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
    personaId: 'clarity',
    wordCount: 840,
    pinned: true,
    favorite: true,
    isEncrypted: false,
    tags: ['Career', 'Strategy', 'Startup', 'Risk', 'Leadership'],
    rawConversation: [
      {
        id: 'msg-c1',
        role: 'user',
        text: 'I am contemplating leaving my steady VP of Engineering role to bootstrap an AI multi-agent platform. I have 18 months of runway, but the fear of losing status and predictable stability is creating cognitive paralysis. How should I rigorously evaluate this decision?',
        timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000 - 100000,
      },
      {
        id: 'msg-c2',
        role: 'model',
        text: 'Let us dismantle this dilemma systematically through the lens of asymmetric upside versus manageable downside.\n\n### 1. The Real Cost of "Safety"\nGolden handcuffs create the psychological illusion that staying is zero-risk. In reality, during an exponential platform shift (like Generative AI), remaining static carries a compounding opportunity cost. If you delay 18 months, the landscape will be entirely different.\n\n### 2. Downside Containment\nWith 18 months of personal runway:\n- **Worst-case scenario:** You build for 12 months, gain irreplaceable founder muscle, and even if revenue is modest, your market value as an AI leader who shipped in the arena is 2x higher than if you stayed.\n- **Actionable De-risking:** Can you secure 3 signed letters of intent (LOI) or run customer discovery calls on weekends before formally submitting your resignation?\n\nWhat is the single irreversible factor holding you back?',
        timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000 - 80000,
      },
      {
        id: 'msg-c3',
        role: 'user',
        text: 'It is primarily the fear of telling my peers and family that I am stepping into uncertainty without a guaranteed salary. But intellectually, I know I will regret inaction far more in 10 years.',
        timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000 - 50000,
      },
      {
        id: 'msg-c4',
        role: 'model',
        text: 'That is profound clarity. Regret of omission is permanent, whereas reputational uncertainty is temporary. Let us lock in a 90-day milestone checklist: validate 5 design partners, define a clear MVP scope, and set a hard decision date.',
        timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000 - 20000,
      },
    ],
    summary: {
      title: 'Career Strategic Pivot: Executive Leadership vs AI Startup Founder',
      oneLiner: 'Evaluated trade-offs between steady enterprise leadership and bootstrapping an AI vertical venture with a 12-month runway framework.',
      executiveSummary: 'Detailed exploration of personal risk tolerance, equity dynamics, and founder readiness. Determined that building an MVP in parallel while validating 5 pilot customers mitigates 80% of downside risk before resigning.',
      keyInsights: [
        'Enterprise golden handcuffs create an illusion of safety while compounding opportunity cost in exponential AI shifts.',
        'Securing 3 paid letters of intent (LOI) reduces seed-stage uncertainty more effectively than speculative pitch decks.',
        'Dichotomy of control: market cycles and macroeconomic tides are volatile, but daily customer discovery remains strictly within personal agency.',
      ],
      actionItems: [
        { id: 'act-101', text: 'Draft customer discovery script for 10 prospective enterprise design partners', completed: true, priority: 'high', dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 'act-102', text: 'Model personal 18-month burn rate and define emergency capital floor', completed: true, priority: 'high', dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 'act-103', text: 'Schedule exploratory advisory chats with 2 exited founders who made the same pivot', completed: false, priority: 'medium', dueDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 'act-104', text: 'Complete technical architecture spike for core real-time reasoning agent', completed: false, priority: 'high', dueDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString() },
      ],
      cognitiveThemes: ['Career Pivot', 'Risk Mitigation', 'Founder Readiness', 'Opportunity Cost'],
      suggestedTags: ['Career', 'Strategy', 'Startup', 'Risk', 'Leadership'],
      socraticQuestion: 'What is the realistic worst-case outcome if the startup does not achieve product-market fit in 18 months, and how easily can you re-enter the leadership market?',
      moodValence: 'determined',
      moodScore: 88,
      clarityScore: 92,
    },
  },
  {
    id: 'demo-ai-architecture-02',
    title: 'AI Multi-Agent Architecture: Zero-Leakage Isolation & RAG Reasoning',
    createdAt: Date.now() - 4 * 24 * 60 * 60 * 1000, // 4 days ago
    updatedAt: Date.now() - 4 * 24 * 60 * 60 * 1000,
    personaId: 'socratic',
    wordCount: 960,
    pinned: true,
    favorite: false,
    isEncrypted: false,
    tags: ['Architecture', 'AI', 'Security', 'VectorDB', 'ZeroKnowledge'],
    rawConversation: [
      {
        id: 'msg-a1',
        role: 'user',
        text: 'How can we guarantee absolute zero cross-tenant leakage in our personal AI journaling system when combining Firestore subcollections with server-side Gemini 3.7 and text-embedding-004 vector embeddings?',
        timestamp: Date.now() - 4 * 24 * 60 * 60 * 1000 - 120000,
      },
      {
        id: 'msg-a2',
        role: 'model',
        text: 'To achieve defense-in-depth zero-trust security:\n\n1. **Kernel Isolation:** Firestore security rules enforce `match /users/{userId}/entries/{entryId} { allow read, write: if request.auth != null && request.auth.uid == userId; }`.\n2. **Server Identity Verification:** Every API route (`/api/chat`, `/api/rag-search`) verifies Firebase Auth ID tokens cryptographically. The server never accepts raw user-supplied UIDs in payloads.\n3. **Client-Side Zero-Knowledge Encryption:** For high-sensitivity thoughts, the client applies AES-GCM-256 with PBKDF2 derived keys. The server and database only ever store ciphertext.\n4. **Vector Privacy:** Vector embeddings are generated on-demand and stored exclusively inside the user document scope.',
        timestamp: Date.now() - 4 * 24 * 60 * 60 * 1000 - 90000,
      },
    ],
    summary: {
      title: 'AI Multi-Agent Architecture: Zero-Leakage Isolation & RAG Reasoning',
      oneLiner: 'Architected a zero-trust personal intelligence vault combining server-side Gemini proxying with client-side WebCrypto AES-GCM-256.',
      executiveSummary: 'Comprehensive systems design session addressing multi-tenant isolation, prompt injection defenses, and 768-dimensional cosine similarity indexing. Established that private keys must never touch server logs or shared cache pools.',
      keyInsights: [
        'Zero-Knowledge encryption guarantees that even compromised database kernels cannot decrypt private journal reflections.',
        'Pre-computing 768-dim text-embedding-004 vectors at entry creation accelerates longitudinal RAG synthesis to sub-200ms.',
        'Defense-in-depth: Firestore security rules validate UID match on every read/write while server middleware verifies JWT cryptographic signatures.',
      ],
      actionItems: [
        { id: 'act-201', text: 'Implement PBKDF2 100,000-iteration key derivation for zero-knowledge vault passkeys', completed: true, priority: 'high', dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 'act-202', text: 'Benchmark cosine similarity latency on 100 vectorized reflections in Node.js', completed: true, priority: 'medium', dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 'act-203', text: 'Write integration test suite validating STRIDE threat mitigation across all endpoints', completed: true, priority: 'high', dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString() },
      ],
      cognitiveThemes: ['Zero-Trust', 'Multi-Tenant Isolation', 'Vector Embeddings', 'STRIDE Security'],
      suggestedTags: ['Architecture', 'AI', 'Security', 'VectorDB', 'ZeroKnowledge'],
      socraticQuestion: 'Where is the exact boundary where convenience threatens user sovereignty?',
      moodValence: 'creative',
      moodScore: 92,
      clarityScore: 96,
    },
  },
  {
    id: 'demo-mindfulness-03',
    title: 'Mindfulness & Somatic Decompression: Managing High-Velocity Sprint Fatigue',
    createdAt: Date.now() - 6 * 24 * 60 * 60 * 1000, // 6 days ago
    updatedAt: Date.now() - 6 * 24 * 60 * 60 * 1000,
    personaId: 'empathy',
    wordCount: 720,
    pinned: false,
    favorite: true,
    isEncrypted: false,
    tags: ['Mindfulness', 'Wellbeing', 'Burnout', 'MentalHealth', 'Equanimity'],
    rawConversation: [
      {
        id: 'msg-m1',
        role: 'user',
        text: 'After a 14-day continuous product sprint, my mind feels overstimulated and unable to switch off. Even during breaks, I am mentally refactoring code or projecting customer objections. How can I reset my nervous system?',
        timestamp: Date.now() - 6 * 24 * 60 * 60 * 1000 - 80000,
      },
      {
        id: 'msg-m2',
        role: 'model',
        text: 'Let us take a deep breath together. When you have spent weeks in high-beta brainwave states of hyper-vigilance, the nervous system forgets how to down-regulate automatically.\n\n### Somatic Grounding Ritual:\n1. **Sensory Reset:** Unplug from screens for 30 minutes. Step outside and let your gaze soften onto natural horizons (panoramic vision triggers parasympathetic calm).\n2. **Physical Boundary Ritual:** Physically close your laptop, place it in a drawer, and change your clothes to signal the end of the warrior state.\n3. **Cognitive Release:** Write down all open loops on paper so your working memory can let go.\n\nRemember: Deep recovery is not the absence of work; it is the active reconstruction of mental elasticity.',
        timestamp: Date.now() - 6 * 24 * 60 * 60 * 1000 - 50000,
      },
    ],
    summary: {
      title: 'Mindfulness & Somatic Decompression: Managing High-Velocity Sprint Fatigue',
      oneLiner: 'Reframed perfectionist urgency into sustainable cyclical pacing and established evening disconnection protocols.',
      executiveSummary: 'Reflective somatic session exploring cognitive overload from continuous context switching. Identified physical manifestations of tension in the jaw and shoulders, establishing breathwork pauses and boundary rituals.',
      keyInsights: [
        'Rest is not a reward for productivity; it is the biological prerequisite for high-order cognitive performance.',
        'Perfectionism is often an anxious defense mechanism disguising itself as dedication to quality.',
        'A 10-minute transition walk without audio input restores prefrontal cortex focus faster than passive screen scrolling.',
      ],
      actionItems: [
        { id: 'act-301', text: 'Institute a hard stop ritual at 7:00 PM with laptop closed and placed in cabinet', completed: true, priority: 'high', dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 'act-302', text: 'Incorporate 4-7-8 diaphragmatic breathing before entering high-stakes deliberations', completed: true, priority: 'medium', dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 'act-303', text: 'Schedule a screen-free weekend afternoon for nature immersion', completed: false, priority: 'medium', dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString() },
      ],
      cognitiveThemes: ['Somatic Awareness', 'Cyclical Pacing', 'Burnout Recovery', 'Equanimity'],
      suggestedTags: ['Mindfulness', 'Wellbeing', 'Burnout', 'MentalHealth', 'Equanimity'],
      socraticQuestion: 'What essential insight are you too rushed to notice right now?',
      moodValence: 'calm',
      moodScore: 85,
      clarityScore: 90,
    },
  },
];

/**
 * Helper to bulk save sample sessions to the authenticated user's isolated Firestore collection.
 */
export async function loadSampleEntriesToFirestore(userId: string): Promise<void> {
  if (!userId) throw new Error('User ID is required to populate demo sessions');
  for (const sample of SAMPLE_JOURNAL_ENTRIES) {
    const entry: JournalEntry = {
      ...sample,
      userId,
    };
    await saveJournalEntry(userId, entry);
  }
}
