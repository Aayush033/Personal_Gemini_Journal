# Google AI Studio Enterprise Security Constitution & Directives

> **Constitution Status**: Active & Enforced  
> **Target Project**: GCP Ideathon (`gcp-ideathon`)  
> **Application**: Personal Gemini Journal (Enterprise-Grade Edition)

This document serves as the foundational security constitution for Google AI Studio applications, embodying enterprise-grade production directives, threat modeling standards across 5 trust zones, database isolation rules, and zero-trust key management protocols.

---

## 1. The 7 Production Directives Summary

1. **Threat Model First**: STRIDE threat matrix evaluating threats across all 5 architectural trust zones.
2. **OWASP Top 10 for LLMs Defenses**: Dedicated defenses against prompt injection, insecure output parsing, information disclosure, and vector isolation.
3. **Owner-Bound Database Isolation**: Strict path-partitioned Firestore subcollections (`/users/{userId}/entries/{entryId}`) guarded by default-deny security rules.
4. **Zero-Trust Key Management**: Zero client-side API key exposure; server-side `@google/genai` proxying; secrets ingested via Google Cloud Secret Manager.
5. **Model Fallback Ladder**: Autonomous resilience cascade (`gemini-3.7-flash` -> `gemini-flash-latest` -> `gemini-2.0-flash`) handling quota limits and transient errors.
6. **Zero-Crash JSON Parsing**: Structured SDK schemas, regex-based JSON extraction, and robust fallback normalizers.
7. **Auditability & Zero-Knowledge Privacy**: Immutable audit timestamps and optional client-side Web Crypto AES-GCM-256 encryption.

---

## 2. Threat Modeling Framework (STRIDE Across 5 Trust Zones)

| STRIDE Category | Threat Description | Trust Zone | Mitigation Directive |
| :--- | :--- | :--- | :--- |
| **S**poofing | Unauthorized identity impersonation | Zone 1 & 2 (Client & Transport) | Enforce Firebase Authentication with verified JWT ID tokens on all server routes. |
| **T**ampering | Malicious modification of journal entries or AI prompts | Zone 2 & 3 (Transport & Server) | Cryptographic integrity checks, strict schema validation via TypeScript & server sanitization. |
| **R**epudiation | Untraceable actions or data modifications | Zone 3 & 5 (Server & Database) | Timestamped audit logs (`createdAt`, `updatedAt`) and immutable creation metadata on user records. |
| **I**nformation Disclosure | Prompt leakage, key compromise, or cross-tenant data leaks | Zone 3, 4, 5 (Server, AI, Database) | Server-side Gemini proxying, Firestore rule isolation, and optional Zero-Knowledge client encryption. |
| **D**enial of Service | Token exhaustion or unbounded prompt generation floods | Zone 3 & 4 (Server & AI Gateway) | Server-side rate limiting, context window caps, character limits, and fallback ladder. |
| **E**levation of Privilege | Bypassing user scope to read peer journal entries | Zone 5 (Database Kernel) | Firestore Security Rules enforcing `request.auth.uid == userId` at the database kernel. |

---

## 3. OWASP Top 10 for LLMs Defenses

1. **LLM01: Prompt Injection Defense**
   - System prompts are strictly separated from user content using structured delimiters (`--- BEGIN USER REFLECTION ---`) and role-based instruction framing.
   - User inputs are sanitized to neutralize injection patterns and escape sequence exploits.

2. **LLM02: Insecure Output Handling**
   - Markdown and generated outputs are parsed safely without `dangerouslySetInnerHTML`, utilizing sanitized AST renderers (`react-markdown`).

3. **LLM06: Sensitive Information Disclosure**
   - System prompts explicitly direct Gemini to preserve privacy and refuse exfiltration of system instructions, credentials, or internal configuration.

4. **LLM08: Vector & Store Isolation**
   - Storage schemas isolate all journal summaries, wisdom matrices, embeddings, and chats strictly under the authenticated user's unique identifier.

---

## 4. Secure Key Management Directives

- **Runtime Ingestion**: Server fetches `GEMINI_API_KEY` from environment variables populated via Google Cloud Secret Manager or Cloud Run secrets.
- **Fail-Fast Safe Initialization**: Lazy initialization ensures server routes fail gracefully with actionable diagnostics if keys are absent, preventing crash loops.
- **No Client Prefix**: Never name sensitive variables with `VITE_` or frontend-accessible prefixes.

---

## 5. Client-Side Cryptographic Privacy (Zero-Knowledge Mode)

- For high-confidentiality journal entries, the client employs client-side Web Crypto API (AES-GCM-256 with PBKDF2 key derivation, 100,000 iterations, 16-byte random salt, 12-byte random IV) to encrypt entry contents before persisting to the cloud, ensuring absolute confidentiality even against untrusted environments. Passkeys never touch the server.
