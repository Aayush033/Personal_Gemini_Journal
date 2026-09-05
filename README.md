# 🌟 Personal Gemini Journal (Enterprise-Grade Edition)

[![Google AI Studio](https://img.shields.io/badge/Google%20AI%20Studio-Powered-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![Gemini 3.7 Flash](https://img.shields.io/badge/Model-Gemini%203.7%20Flash-34A853?logo=googlegemini&logoColor=white)](https://ai.google.dev/)
[![React 19](https://img.shields.io/badge/Frontend-React%2019%20+%20Tailwind-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vitest](https://img.shields.io/badge/Tests-32%20Passed%20(100%25)-green?logo=vitest&logoColor=white)](./EVALUATION.md)
[![Zero-Knowledge](https://img.shields.io/badge/Security-Zero--Knowledge%20AES--GCM--256-orange?logo=shield&logoColor=white)](./AGENTS.md)
[![Cloud Run](https://img.shields.io/badge/Deploy-Google%20Cloud%20Run-4285F4?logo=googlecloud&logoColor=white)](https://cloud.google.com/run)

> A security-hardened, full-stack personal AI journaling and cognitive brainstorming application. Empowers founders, executives, and thinkers to decompress thoughts, challenge assumptions through specialized Socratic personas, synthesize multi-agent strategic consensus, and store reflections in a cryptographically isolated vault.

---

## 🚀 Live Cloud Run Deployment

- **Production Application URL**: `[YOUR_DEPLOYED_CLOUD_RUN_URL_HERE]`
- **Google Cloud Project**: `gcp-ideathon` (GCP Ideathon)
- **Cloud Run Service Name**: `personal-gemini-journal`
- **Target Region**: `us-central1`
- **Challenge Verification Label**: `dev-tutorial=cloud-run-ai-challenge`

---

## 🏛️ System Architecture & Implementation Highlights

Overview of core capabilities, security controls, and key implementation locations:

| Core Capability | Technical Implementation | Architecture Reference |
| :--- | :--- | :--- |
| **Zero-Knowledge Privacy** | Client-side AES-GCM-256 + PBKDF2 (100k iter) encryption before cloud sync. | [`src/lib/crypto.ts`](./src/lib/crypto.ts), [`src/components/CryptoModal.tsx`](./src/components/CryptoModal.tsx) |
| **Multi-Tenant Isolation** | Strict Firestore kernel rules enforcing `request.auth.uid == userId`. | [`firestore.rules`](./firestore.rules), [`src/lib/firestoreService.ts`](./src/lib/firestoreService.ts) |
| **Zero Secret Exposure** | Server-side proxy for `@google/genai`; zero client-side key leakage. | [`server.ts`](./server.ts) |
| **Model Fallback Ladder** | Resilient cascade across `gemini-3.7-flash` -> `gemini-flash-latest` -> `gemini-2.0-flash`. | [`server.ts`](./server.ts) |
| **Socratic Reasoning** | 5 distinct inquiry personas (Socratic Mirror, Stoic, Strategist, etc.). | [`src/lib/personas.ts`](./src/lib/personas.ts), [`src/components/ChatBrainstorm.tsx`](./src/components/ChatBrainstorm.tsx) |
| **Multi-Agent Deliberation** | Parallel 4-persona round-table council + meta-consensus synthesis matrix. | [`server.ts`](./server.ts) (`/api/panel-deliberation`), [`src/components/PanelDiscussion.tsx`](./src/components/PanelDiscussion.tsx) |
| **Longitudinal RAG** | Vector embeddings via `text-embedding-004` with task context + Cosine RAG. | [`server.ts`](./server.ts) (`/api/embed`, `/api/rag-search`), [`src/components/SemanticMemorySearch.tsx`](./src/components/SemanticMemorySearch.tsx) |
| **Web Grounding** | Real-time Google Search citations and queries streamed over SSE. | [`server.ts`](./server.ts) (`/api/chat`), [`src/components/ChatBrainstorm.tsx`](./src/components/ChatBrainstorm.tsx) |
| **Calendar Integration** | RFC-5545 compliant `.ics` calendar export with UTC stamps & text folding. | [`src/lib/calendarExport.ts`](./src/lib/calendarExport.ts), [`src/components/JournalDetail.tsx`](./src/components/JournalDetail.tsx) |
| **Threat Modeling** | Full STRIDE threat analysis matrix across 5 trust zones & OWASP Top 10 defenses. | [`AGENTS.md`](./AGENTS.md), [`src/lib/threatModelData.ts`](./src/lib/threatModelData.ts), [`src/components/SecurityInspector.tsx`](./src/components/SecurityInspector.tsx) |
| **Test Verification** | 32 automated integration & unit tests (100% pass rate). | [`npm test`](#test-suite-execution), [`EVALUATION.md`](./EVALUATION.md) |

---

## 🚀 Production Deployment (Google Cloud Run)

The application is containerized and deployed to Google Cloud Run with Google Cloud Secret Manager integration:

```bash
# 1. Set active GCP project & enable required services
gcloud config set project gcp-ideathon
gcloud services enable run.googleapis.com secretmanager.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com

# 2. Store Gemini API key in Secret Manager & grant Cloud Run runtime access
echo -n "$GEMINI_API_KEY" | gcloud secrets create GEMINI_API_KEY --data-file=-
PROJECT_NUMBER=$(gcloud projects describe gcp-ideathon --format="value(projectNumber)")
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# 3. Deploy containerized service with hackathon challenge verification label
gcloud run deploy personal-gemini-journal \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest" \
  --update-labels=dev-tutorial=cloud-run-ai-challenge
```

---

## 💡 Value Proposition

Traditional AI journaling tools transmit vulnerable personal reflections across public APIs and store them in plain-text databases, posing critical risks:
1. **Intimate Data Exposure**: Raw journal entries stored without client-side encryption are vulnerable to database breaches and administrative inspection.
2. **Model Retraining Anxiety**: Users hesitate to share authentic thoughts when concerned their musings might train future public AI models.
3. **Shallow AI Echo Chambers**: Standard conversational chatbots simply agree with the user instead of challenging blindspots or offering structured frameworks.

### How Personal Gemini Journal Solves This:
- **Absolute Privacy with Zero-Knowledge Encryption**: Sensitive reflections can be encrypted in the browser using AES-GCM-256 with PBKDF2 key derivation before hitting Firestore. The server and database never receive the encryption passkey.
- **Socratic Thinking Companions**: Choose from 5 cognitive personas designed to probe assumptions, structure action milestones, and provide emotional grounding.
- **Multi-Agent Deliberation Council**: Engage a panel of AI advisors in parallel and extract an actionable Decision Matrix.
- **Longitudinal Semantic Memory**: Search past reflections using Gemini `text-embedding-004` vector representations to uncover cognitive patterns and habit shifts over time.

---

## 🛡️ Technical Challenges Solved

### 1. Client-Side Zero-Knowledge Encryption (Web Crypto API)
- **Challenge**: Storing highly sensitive journal data in the cloud without trusting the cloud host or database kernel with plaintext access.
- **Solution**: Implemented browser-native WebCrypto AES-GCM-256 in [`src/lib/crypto.ts`](./src/lib/crypto.ts). Every encryption action generates a fresh, cryptographically secure 12-byte Initialization Vector (IV) and 16-byte PBKDF2 salt with 100,000 iterations. Passkeys are never stored, logged, or transmitted.

### 2. Multi-Tenant Database Kernel Isolation (Row-Level Security)
- **Challenge**: Preventing cross-tenant data leakage in multi-user Firestore environments.
- **Solution**: Designed a path-partitioned subcollection layout: `/users/{userId}/entries/{entryId}`. Configured [`firestore.rules`](./firestore.rules) enforcing `request.auth.uid == userId` with default-deny policies on all root queries.

### 3. Multi-Tier Model Fallback Ladder
- **Challenge**: Quota limits (`429 RESOURCE_EXHAUSTED`) or region overloads (`503 Service Unavailable`) on preview models disrupt continuous journaling workflows.
- **Solution**: Engineered `generateContentWithFallback()` in [`server.ts`](./server.ts) cascading automatically across `gemini-3.7-flash` -> `gemini-flash-latest` -> `gemini-2.0-flash`. For embeddings, an automatic 768-dimensional deterministic semantic fallback prevents vector query failures.

### 4. Real-Time Google Search Grounding over SSE Streams
- **Challenge**: Standard SSE stream proxies forward raw text chunks, dropping grounding metadata (citation URLs, sources, and search queries) which the GenAI SDK attaches to candidate metadata rather than the main text stream.
- **Solution**: The Express proxy in [`server.ts`](./server.ts) intercepts `chunk.candidates[0].groundingMetadata` on every chunk and immediately emits a dedicated SSE event block so citation badges render dynamically as the user watches.

### 5. RFC-5545 Compliant `.ics` Action Item Calendar Exports
- **Challenge**: Calendar clients (Apple Calendar, Google Calendar, Outlook) silently reject or truncate calendar files when descriptions contain unescaped commas, semicolons, or lines exceeding the 75-octet specification.
- **Solution**: Built [`src/lib/calendarExport.ts`](./src/lib/calendarExport.ts) with strict UTC date serialization (`YYYYMMDDTHHMMSSZ`), complete RFC character escaping, and an automatic line-folding algorithm (`foldIcsLine`).

---

## 💻 Local Development & Setup Instructions

You can run and test this project locally using either **Node.js** directly or inside a sandboxed **Python Virtual Environment (`venv`)** in VS Code.

### Option A: Standard Node.js Setup

#### 1. Prerequisites
- Node.js 18+ and npm installed
- Google AI Studio Gemini API Key ([Get one here](https://aistudio.google.com/))

#### 2. Clone & Configure
```bash
# Clone the repository
git clone <repo-url>
cd <repo-folder>

# Copy environment variable template
cp .env.example .env
```

Open `.env` and configure your API key:
```env
GEMINI_API_KEY="AIzaSy..."
```

#### 3. Install & Launch
```bash
# Install dependencies
npm install

# Start the full-stack dev server (bound to http://localhost:3000)
npm run dev

# Run all 32 automated tests
npm test
```

---

### Option B: VS Code Python Virtualenv (`venv`) Setup

If you prefer testing inside a Python virtual environment in VS Code without installing global system packages, use [`requirements.txt`](./requirements.txt):

```bash
# 1. Create and activate a Python virtual environment
python3 -m venv venv
source venv/bin/activate       # On Windows: venv\Scripts\activate

# 2. Install Python requirements (includes nodeenv & test tooling)
pip install -r requirements.txt

# 3. Sandbox Node.js & npm inside your virtualenv (no global packages!)
nodeenv -p

# 4. Install project packages inside the virtualenv
npm install

# 5. Verify your setup and API key connectivity
python verify_env.py

# 6. Start the development server
npm run dev
```

---

## 🧪 Test Suite Execution

Run the complete test suite verifying zero-knowledge cryptography, Socratic personas, STRIDE threat models, server boundaries, and calendar exports:

```bash
npm test
```

### Test Suite Output:
```
 ✓ tests/draftAndSecurity.test.ts (3 tests)
 ✓ tests/summarizeParser.test.ts  (2 tests)
 ✓ tests/serverLogic.test.ts      (9 tests)
 ✓ tests/personas.test.ts         (4 tests)
 ✓ tests/threatModel.test.ts      (3 tests)
 ✓ tests/crypto.test.ts           (4 tests)
 ✓ src/__tests__/app.test.ts      (7 tests)

 Test Files  7 passed (7)
      Tests  32 passed (32)
```

Detailed test logs and architecture benchmarks are documented in [`EVALUATION.md`](./EVALUATION.md).

---

## 📁 Repository Structure

```
.
├── Dockerfile                   # Multi-stage container build for Google Cloud Run
├── .dockerignore                # Production container exclude list
├── .gitignore                   # Shields credentials, .env files, and build artifacts
├── .env.example                 # Template for required environment variables
├── AGENTS.md                    # Google AI Studio Enterprise Security Constitution (7 Directives)
├── EVALUATION.md                # Comprehensive test benchmark & evaluation report
├── GEMINI.md                    # AI Studio architectural & model directives
├── README.md                    # Value proposition, setup, & technical challenges
├── requirements.txt             # Python venv requirements for isolated VS Code testing
├── verify_env.py                # Environment verification & diagnostic script
├── firebase-applet-config.json  # Firebase configuration (project: gcp-ideathon)
├── firestore.rules              # Multi-tenant Firestore security isolation rules
├── index.html                   # HTML entry point with metadata sync
├── metadata.json                # Application permissions and major capabilities
├── package.json                 # Node dependencies, scripts, and build targets
├── server.ts                    # Express server with Vite middleware, Gemini proxy, SSE, & RAG
├── tsconfig.json                # TypeScript compiler configuration
├── vite.config.ts               # Vite bundler & Tailwind configuration
├── tests/                       # Vitest integration test suites
│   ├── crypto.test.ts           # Zero-Knowledge cryptography tests
│   ├── draftAndSecurity.test.ts # Draft recovery & Bearer auth tests
│   ├── personas.test.ts         # Persona engine & system prompt tests
│   ├── serverLogic.test.ts      # Server security and model routing tests
│   ├── summarizeParser.test.ts  # Structured summarization parser tests
│   └── threatModel.test.ts      # STRIDE & OWASP verification tests
└── src/                         # React 19 Client-side source code
    ├── App.tsx                  # Main controller with guest auto-auth & persistent tabs
    ├── index.css                # Tailwind base styling & dark mode palette
    ├── types.ts                 # Shared TypeScript interfaces and data models
    ├── __tests__/app.test.ts    # Unit tests for crypto, .ics, and personas
    ├── lib/
    │   ├── calendarExport.ts    # RFC-5545 iCalendar (.ics) generation & text folding
    │   ├── crypto.ts            # Web Crypto API (AES-GCM-256 + PBKDF2)
    │   ├── firebase.ts          # Firebase Auth & Firestore client SDK init
    │   ├── firestoreService.ts  # Multi-tenant Firestore CRUD operations
    │   ├── personas.ts          # 5 Socratic cognitive persona definitions
    │   ├── sampleData.ts        # Pre-structured demo sessions for judges
    │   └── threatModelData.ts   # STRIDE threat matrix and OWASP catalog
    └── components/
        ├── AnalyticsDashboard.tsx   # Cognitive analytics & mood valence charts
        ├── AuthModal.tsx            # Google, Email, & Guest authentication
        ├── ChatBrainstorm.tsx       # Reflection chat, voice, attachments, & wisdom extraction
        ├── CryptoModal.tsx          # Passkey dialog for zero-knowledge encryption
        ├── Header.tsx               # Navigation bar with user status & tab switching
        ├── JournalDetail.tsx        # Saved reflection viewer with .ICS export
        ├── JournalList.tsx          # Entry directory with demo session loader
        ├── PanelDiscussion.tsx      # Multi-Agent Deliberation Council UI
        ├── SecurityInspector.tsx    # Interactive security sandbox & STRIDE inspector
        └── SemanticMemorySearch.tsx # Longitudinal RAG & vector memory search
```

---

## 🔒 Security & Privacy Directives

This application strictly enforces the rules defined in [`AGENTS.md`](./AGENTS.md) and [`GEMINI.md`](./GEMINI.md):
- **Zero-Trust Architecture**: Every API route validates Firebase Auth Bearer tokens.
- **No Client Secret Exposure**: `GEMINI_API_KEY` is loaded lazily on the server from environment variables.
- **Client-Side Cryptography**: Optional AES-GCM-256 encryption encrypts entry content before transmission.
- **Defensive Prompt Engineering**: System prompts enforce strict ethical boundaries, neutralize injection attempts, and strip markdown code fences safely.
