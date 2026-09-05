# Google AI Studio Security & Development Directives

> **Constitution Status**: Active & Enforced  
> **Target Project**: GCP Ideathon (`gcp-ideathon`)  
> **Application**: Personal Gemini Journal (Enterprise-Grade Edition)

---

## The 7 Enterprise Production Directives

### Directive 1: Threat Model First (STRIDE & 5 Trust Zones)
- Conduct exhaustive STRIDE threat modeling across 5 trust zones:
  1. **Client Runtime (Browser)**: Untrusted environment; all inputs sanitized, optional client-side AES-GCM-256 zero-knowledge encryption for private reflections.
  2. **Transport Layer**: TLS 1.3 encrypted HTTPS / WSS communication enforcing Firebase Auth Bearer JWT tokens.
  3. **Application Server (Cloud Run)**: Express proxy boundary enforcing Bearer token verification, payload rate limiting, and parameter schema validation.
  4. **AI Inference Boundary (Gemini API)**: Zero client-side API key leakage; all interactions routed through server-side `@google/genai` proxy with strict system prompts.
  5. **Data Persistence (Firestore Database Kernel)**: Multi-tenant partition isolating entries exclusively under `users/{userId}/*`.

### Directive 2: OWASP Top 10 for LLMs Defensive Guardrails
- **LLM01: Prompt Injection**: System prompts and user inputs are segregated using explicit delimiter framing (`--- BEGIN USER INPUT ---`).
- **LLM02: Insecure Output Handling**: All AI-generated markdown is parsed safely through React AST renderers (`react-markdown`), strictly forbidding `dangerouslySetInnerHTML`.
- **LLM06: Sensitive Information Disclosure**: System prompts enforce privacy boundaries, prohibiting exfiltration of internal instructions, environment variables, or administrative credentials.
- **LLM08: Vector & Store Isolation**: Embeddings and memory records are strictly scoped per authenticated user UID.

### Directive 3: Owner-Bound Database Isolation & Default-Deny Security Rules
- Multi-tenant Firestore subcollection structure: `/users/{userId}/entries/{entryId}`, `/users/{userId}/tags/*`, `/users/{userId}/metrics/*`.
- Kernel-enforced security rules: `allow read, write: if request.auth != null && request.auth.uid == userId;`.
- Default-deny policy (`allow read, write: if false;`) applied to all unmapped collections and root queries.

### Directive 4: Zero Secret Exposure & Cloud Secret Manager Ingestion
- `GEMINI_API_KEY` is loaded exclusively from environment variables / Google Cloud Secret Manager at server runtime.
- Never prefix backend secrets with `VITE_` or bundle them into client-facing build artifacts.
- Fail-fast, safe initialization provides actionable diagnostics without crash looping.

### Directive 5: Multi-Tier Model Fallback Ladder & Resilient Availability
- The server implements an automatic fallback ladder across Gemini models:
  1. Primary: `gemini-3.7-flash` (cutting-edge reasoning, fast latency)
  2. Secondary: `gemini-flash-latest` (high availability alias)
  3. Tertiary: `gemini-2.0-flash` (production fallback)
- Transient errors (HTTP 503, 404, 429) automatically cascade down the ladder.
- HTTP 429 quota exhaustion returns structured, user-actionable recovery instructions.

### Directive 6: Zero-Crash JSON Parsing & Schema Validation
- All structured AI generation (summaries, action items, mood matrices, panel deliberation) utilizes GenAI SDK `responseSchema` with JSON type constraints.
- Employs `safeParseJson` to cleanly extract JSON payloads even if wrapped in conversational text or markdown code fences.
- Null-safe default transformers guarantee arrays, objects, and nested fields are always fully shaped.

### Directive 7: Auditability, Repudiation Defense & Zero-Knowledge Privacy
- All journal creations, updates, and AI syntheses persist immutable timestamps (`createdAt`, `updatedAt`).
- Zero-Knowledge Mode uses browser-native Web Crypto API (AES-GCM-256 with PBKDF2 key derivation, 100k iterations, cryptographically random salt and IV) to encrypt entries before cloud persistence. Passkeys are never transmitted to or stored on servers.
- RFC-5545 compliant `.ics` calendar generation allows users to export action items with UTC date validation and 75-octet line folding.
