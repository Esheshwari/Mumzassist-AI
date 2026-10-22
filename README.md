# MumzAssist.A — Multilingual AI Customer Support Triage System

**MumzAssist.A** is a production-grade, AI-powered multilingual customer support triage and response-assistance platform designed for support teams handling customer inquiries across **English**, **Hindi** (Devanagari script & Latin-script Hinglish), and **Arabic** (full right-to-left layout and bidirectional isolation).

---

## 1. Core Architectural Principles

- **Agent-Assisted, Not an Autonomous Bot:** High-risk messages (payment disputes, legal threats, credit card fraud, damaged perishable goods) automatically trigger safety escalation and human review flags. Suggested responses are queued as editable drafts for human support agents and are **never dispatched to real customers automatically**.
- **Strict Grounding in Verified Knowledge:** The AI drafts suggested responses exclusively utilizing factual data from active, verified Knowledge Base articles. If the knowledge base lacks sufficient evidence, the model refuses to fabricate delivery windows or refund rules and flags the ticket for human agent resolution.
- **Relational PostgreSQL Persistence:** All customers, tickets, AI analyses, grounded article references, and audit logs are stored in a normalized relational PostgreSQL schema with constraints, foreign keys, and indexes. Zero mock in-memory arrays.
- **Strict Zod Output Validation:** Model responses are constrained to a strict JSON schema and parsed through Zod. Malformed outputs or confidence failures trigger circuit-breaker fallback triage with human review.

---

## 2. Supported Languages

| Language | Script / Modality | Notes |
| :--- | :--- | :--- |
| **English** | Latin | Global standard, intent extraction, entity recognition |
| **Hindi** | Devanagari (`हिन्दी`) & Latin Hinglish | Dual script recognition; captures colloquial South Asian phrasing |
| **Arabic** | Arabic Script (`العربية`) | Native right-to-left (RTL) formatting; isolates Latin order IDs |

---

## 3. Technology Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS, Lucide Icons, Motion.
- **Backend:** Node.js, Express REST API, TypeScript (`tsx`).
- **AI Engine:** Google Gemini API (`gemini-3.8-flash`) via the official `@google/genai` SDK with server-side proxying and `aistudio-build` telemetry headers.
- **Database:** PostgreSQL (supports Neon, Supabase, Vercel Postgres, AWS RDS, Cloud SQL) with automatic connection pooling (`pg.Pool`) and seamless embedded PostgreSQL (`@electric-sql/pglite`) fallback for zero-config local testing.
- **Validation:** Zod for all API route payloads and structured AI model outputs.
- **Test Suite:** Vitest for deterministic unit, integration, and end-to-end tests.

---

## 4. Database Schema

The normalized PostgreSQL schema is located in `server/db/schema.sql` and includes:

1. `customers` — Customer contact references, preferred language, and timestamps.
2. `knowledge_base_articles` — Verified policies with multilingual content, category tagging, keywords, and active flags.
3. `agents` — Support specialists and role assignments.
4. `tickets` — Ticket records with unique IDs (`TIK-xxxx`), original message, language, category, priority, sentiment, status, suggested response, and timestamps.
5. `ticket_analyses` — Historical snapshot of every AI triage run (intent, confidence, extracted entities, recommended actions).
6. `ticket_article_references` — Relational link between tickets and cited knowledge-base articles.
7. `ticket_events` — Audit trail recording every status change, triage run, response approval, or escalation.

---

## 5. Exactly 17 Deterministic Functional Tests

MumzAssist.A includes 17 named functional tests covering end-to-end behaviors:

1. `Create a ticket and persist it in PostgreSQL`
2. `Retrieve a ticket by ID`
3. `List tickets with pagination`
4. `Filter tickets by status`
5. `Filter tickets by priority and category`
6. `Search tickets by message text`
7. `Detect English correctly for the defined test cases`
8. `Detect Hindi correctly for the defined test cases`
9. `Detect Arabic correctly for the defined test cases`
10. `Validate a correctly structured AI analysis response`
11. `Reject malformed AI output and mark the ticket for review`
12. `Retrieve relevant active knowledge-base articles`
13. `Generate a response grounded in supplied article content`
14. `Flag a case for human review when no reliable answer is available`
15. `Update ticket status and persist an audit event`
16. `Render Arabic content in the correct direction and preserve the original message`
17. `Run the main application build and verify the critical ticket workflow using an appropriate automated integration or end-to-end test`

### Running the Test Suite:
```bash
npm run test
```

---

## 6. Local Setup & Quick Start

### 1. Prerequisites
- Node.js 20+ installed.

### 2. Environment Variables
Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```
Fill in your credentials:
```env
DATABASE_URL="postgresql://user:password@host:5432/mumzassist?sslmode=require"
GEMINI_API_KEY="your-gemini-api-key"
PORT=3000
```
*(Note: If `DATABASE_URL` is omitted locally, the app will automatically run against the built-in embedded PostgreSQL engine).*

### 3. Install Dependencies
```bash
npm install
```

### 4. Start the Application
```bash
npm run dev
```
Open `http://localhost:3000` to access MumzAssist.A.

---

## 7. Vercel Deployment Instructions

1. **Deploy to Vercel:**
   Connect your GitHub repository to Vercel. Set the framework to **Vite / Node.js** (or use the Express server entry point).
2. **Environment Variables on Vercel:**
   Configure the following in your Vercel Project Settings:
   - `DATABASE_URL`: Hosted PostgreSQL connection string (from Neon, Supabase, or Vercel Postgres).
   - `GEMINI_API_KEY`: Your Google Gemini API key.
   - `NODE_ENV`: `production`.
3. **Build Command:**
   ```bash
   npm run build
   ```
4. **Health Check Endpoint:**
   Verify your deployment via:
   ```http
   GET https://your-deployment-domain.vercel.app/api/health
   ```
