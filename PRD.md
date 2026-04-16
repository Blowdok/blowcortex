# BlowCortex — Document des exigences produit (PRD)

**Version :** 1.0
**Type de document :** Spécification d'implémentation IA
**Implémenteur cible :** Agent de codage autonome (Claude Code, Cursor, ou similaire)
**Dernière mise à jour :** Avril 2026

---

## 0. Instructions pour l'IA chargée de l'implémentation

Ce document est la source unique de vérité pour construire BlowCortex. Lisez-le entièrement avant d'écrire le moindre code.

**Comment utiliser ce document :**
1. Implémentez dans l'ordre spécifié à la Section 11 (Phases d'implémentation). Ne sautez pas d'étapes.
2. Chaque critère d'acceptation doit être testable. Écrivez le test avant le code lorsque c'est possible.
3. Lorsqu'une section dit "MUST", c'est non négociable. "SHOULD" autorise un jugement. "MAY" est optionnel.
4. Si vous rencontrez une ambiguïté, choisissez par défaut l'implémentation la plus simple qui satisfait toutes les exigences MUST, et documentez votre hypothèse dans un fichier `DECISIONS.md`.
5. Utilisez TypeScript avec le mode strict activé sur l'ensemble du codebase.
6. N'introduisez pas de nouvelles dépendances sans justification dans `DECISIONS.md`.
7. Suivez exactement la structure de dossiers de la Section 4.3.
8. Faites un commit après chaque critère d'acceptation atteint, avec le format de message : `[Phase-Sprint] <what was done>`.

**Vos principes de codage :**
- Favoriser la composition plutôt que l'héritage.
- Chaque appel externe (LLM, DB, API) doit être encapsulé dans une gestion d'erreurs avec des erreurs typées.
- Chaque agent doit avoir une garde de budget ; les boucles non bornées sont des bugs.
- Tous les secrets proviennent de variables d'environnement, jamais codés en dur.
- Toutes les données persistées doivent être validées par schéma avec Zod.

---

## 1. Vision produit (concise)

BlowCortex est un système d'IA proactive qui se construit autour de la vie professionnelle d'un utilisateur. Contrairement aux chatbots (qui attendent une entrée) ou aux frameworks d'agents (qui nécessitent une configuration), BlowCortex observe, comprend et agit.

**Proposition de valeur centrale :** "BlowCortex thinks for you when you're not thinking about it."

**Quatre couches de capacités :**
1. **Brain** — ingère en continu les sources de données de l'utilisateur et construit un graphe de connaissance temporel de son contexte de travail.
2. **Hands** — exécute des actions dans les outils de l'utilisateur (email, calendrier, Slack, etc.) avec une confiance progressive.
3. **Organization** — lance dynamiquement des agents spécialisés en fonction des besoins détectés chez l'utilisateur.
4. **Forge** — génère des micro-applications personnalisées lorsque des schémas récurrents nécessitent des outils dédiés.

**Périmètre de ce PRD :** Phase 1 (Brain + Hands, Organization partielle). Les Phases 2-4 sont décrites mais spécifiées avec un niveau de détail plus faible.

---

## 2. Stack technique définitive

| Layer | Technology | Version | Non-negotiable |
|---|---|---|---|
| Language (backend) | TypeScript | 5.5+ | Yes |
| Language (frontend) | TypeScript + React | 19+ | Yes |
| Web framework | Next.js | 15+ | Yes |
| Mobile framework | Expo | 52+ | Yes |
| UI components | shadcn/ui + Tailwind | Latest | Yes |
| API framework | Hono | 4+ | Yes |
| Agent framework | Vercel AI SDK + OpenRouter | Latest | Yes |
| Event orchestration | Inngest | Latest | Yes |
| Durable workflows | Temporal | Cloud | Phase 2+ only |
| Relational DB | PostgreSQL | 16+ | Yes (via Supabase) |
| Graph DB | Neo4j | 5+ (Aura) | Yes |
| Cache/Queue | Redis | 7+ (Redis Stack) | Yes |
| Memory framework | Zep (Graphiti) | Latest | Yes |
| Personalization memory | Mem0 | Latest | Phase 2+ |
| LLM provider | OpenRouter (https://openrouter.ai/api/v1) | dynamic — model list fetched at runtime via `GET /api/v1/models` | Yes |
| LLM gateway | OpenRouter (built-in fallback + cost routing) | — | Yes |
| Observability | Langfuse | Cloud | Yes |
| Auth | Clerk | Latest | Yes |
| Schema validation | Zod | 3+ | Yes |
| ORM | Drizzle | Latest | Yes |
| Package manager | pnpm | 9+ | Yes |
| Monorepo | Turborepo | Latest | Yes |
| Error tracking | Sentry | Latest | Yes |
| Deployment (web) | Vercel | — | Yes |
| Deployment (workers) | Railway | — | Yes |
| Storage | Cloudflare R2 | — | Yes |

---

## 3. Schéma d'architecture

```
┌─────────────────────────────────────────────────────────────┐
│ CLIENT LAYER                                                │
│ apps/web (Next.js)  ·  apps/mobile (Expo)                   │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS + WebSocket
┌──────────────────────▼──────────────────────────────────────┐
│ API LAYER — apps/api (Hono on Node.js)                      │
│                                                             │
│  /v1/auth   /v1/connectors   /v1/agents   /v1/graph         │
│  /v1/events /v1/actions      /v1/briefings                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
       ┌───────────────┼───────────────┐
       ▼               ▼               ▼
┌────────────┐  ┌────────────┐  ┌────────────────┐
│ INGESTION  │  │ AGENTS     │  │ ACTIONS        │
│ (Inngest)  │  │ (OpenRouter│  │ (typed         │
│ webhooks + │  │  via AI    │  │  executors)    │
│ pollers    │  │   SDK)     │  │                │
└─────┬──────┘  └─────┬──────┘  └────────┬───────┘
      │               │                  │
      └───────────────┼──────────────────┘
                      ▼
       ┌──────────────────────────────┐
       │ DATA LAYER                   │
       │                              │
       │ Postgres (metadata, audit)   │
       │ Neo4j via Zep (graph)        │
       │ Redis (cache, queues)        │
       │ R2 (files, artifacts)        │
       └──────────────────────────────┘
```

---

## 4. Structure du dépôt

### 4.1 Organisation du monorepo

```
BlowCortex/
├── apps/
│   ├── web/                  # Next.js 15 web app
│   ├── mobile/               # Expo app
│   ├── api/                  # Hono API (Node.js)
│   └── workers/              # Inngest functions (agents, ingestion)
├── packages/
│   ├── core/                 # Domain logic, types, Zod schemas
│   ├── db/                   # Drizzle ORM, migrations
│   ├── graph/                # Zep client, graph queries
│   ├── agents/               # Agent definitions, prompts, tools
│   ├── connectors/           # MCP clients, OAuth flows
│   ├── llm/                  # OpenRouter client wrapper, model registry, budget guards
│   ├── ui/                   # Shared shadcn/ui components
│   └── config/               # Shared ESLint, TSConfig, Tailwind
├── infra/
│   ├── docker/               # docker-compose for local dev
│   └── migrations/           # SQL migrations (Drizzle)
├── tests/
│   ├── e2e/                  # Playwright
│   └── integration/          # Vitest integration tests
├── DECISIONS.md              # AI decision log
├── README.md
├── pnpm-workspace.yaml
├── turbo.json
└── .env.example
```

### 4.2 Variables d'environnement (`.env.example`)

```bash
# Core
NODE_ENV=development
BlowCortex_BASE_URL=http://localhost:3000
BlowCortex_API_URL=http://localhost:3100

# Database
DATABASE_URL=postgresql://BlowCortex:BlowCortex@localhost:5432/BlowCortex
NEO4J_URI=neo4j+s://xxxxx.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=
REDIS_URL=redis://localhost:6379

# Zep
ZEP_API_KEY=
ZEP_API_URL=https://api.getzep.com

# LLM
OPENROUTER_API_KEY=
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_DEFAULT_MODEL=anthropic/claude-sonnet-4.5
OPENROUTER_MAX_TOKENS=4096
OPENROUTER_HTTP_REFERER=http://localhost:3000
OPENROUTER_X_TITLE=BlowCortex

# Auth
CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Observability
LANGFUSE_PUBLIC_KEY=
LANGFUSE_SECRET_KEY=
SENTRY_DSN=

# Event orchestration
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=

# Connectors
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
SLACK_CLIENT_ID=
SLACK_CLIENT_SECRET=
NOTION_CLIENT_ID=
NOTION_CLIENT_SECRET=

# Storage
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=BlowCortex-artifacts
```

---

## 5. Modèles de données

### 5.1 PostgreSQL schema (Drizzle)

```typescript
// packages/db/schema.ts

import { pgTable, uuid, text, timestamp, integer, jsonb, boolean, pgEnum } from "drizzle-orm/pg-core";

export const trustLevelEnum = pgEnum("trust_level", ["0", "1", "2", "3"]);
export const agentStatusEnum = pgEnum("agent_status", ["active", "paused", "disabled"]);
export const connectorStatusEnum = pgEnum("connector_status", ["connected", "expired", "revoked", "error"]);
export const actionStatusEnum = pgEnum("action_status", ["pending", "approved", "rejected", "executed", "failed"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkId: text("clerk_id").notNull().unique(),
  email: text("email").notNull().unique(),
  name: text("name"),
  timezone: text("timezone").notNull().default("UTC"),
  trustLevel: trustLevelEnum("trust_level").notNull().default("0"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const connectors = pgTable("connectors", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(), // 'gmail' | 'gcal' | 'slack' | 'notion'
  status: connectorStatusEnum("status").notNull().default("connected"),
  accessTokenEnc: text("access_token_enc").notNull(), // AES-256 encrypted
  refreshTokenEnc: text("refresh_token_enc"),
  tokenExpiresAt: timestamp("token_expires_at"),
  scopes: jsonb("scopes").$type<string[]>().notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const agents = pgTable("agents", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // 'engagement_tracker' | 'meeting_briefer' | etc.
  name: text("name").notNull(),
  status: agentStatusEnum("status").notNull().default("active"),
  config: jsonb("config").$type<AgentConfig>().notNull(),
  budgetTokensMonthly: integer("budget_tokens_monthly").notNull().default(5_000_000),
  budgetTokensUsedThisMonth: integer("budget_tokens_used_this_month").notNull().default(0),
  lastHeartbeatAt: timestamp("last_heartbeat_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const actions = pgTable("actions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  agentId: uuid("agent_id").references(() => agents.id),
  type: text("type").notNull(), // 'send_email' | 'create_ticket' | 'update_doc'
  status: actionStatusEnum("status").notNull().default("pending"),
  payload: jsonb("payload").$type<ActionPayload>().notNull(),
  preview: text("preview").notNull(), // human-readable summary
  rationale: text("rationale").notNull(), // why the agent proposed this
  contextRefs: jsonb("context_refs").$type<string[]>(), // Zep node IDs
  approvedAt: timestamp("approved_at"),
  executedAt: timestamp("executed_at"),
  failureReason: text("failure_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const engagements = pgTable("engagements", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  dueAt: timestamp("due_at"),
  sourceType: text("source_type").notNull(), // 'email' | 'slack' | 'meeting'
  sourceRef: text("source_ref").notNull(), // message ID or similar
  withUser: text("with_user"), // email or identifier of the other party
  status: text("status").notNull().default("open"), // 'open' | 'fulfilled' | 'overdue' | 'dismissed'
  confidence: integer("confidence").notNull(), // 0-100
  detectedAt: timestamp("detected_at").notNull().defaultNow(),
  fulfilledAt: timestamp("fulfilled_at"),
});

export const briefings = pgTable("briefings", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  eventId: text("event_id").notNull(), // Google Calendar event ID
  eventStartsAt: timestamp("event_starts_at").notNull(),
  content: jsonb("content").$type<BriefingContent>().notNull(),
  deliveredAt: timestamp("delivered_at"),
  openedAt: timestamp("opened_at"),
  helpful: boolean("helpful"), // user feedback
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  agentId: uuid("agent_id").references(() => agents.id),
  eventType: text("event_type").notNull(),
  details: jsonb("details").$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
// NOTE: audit_log is append-only. No UPDATE or DELETE statements on this table.

export const llmUsage = pgTable("llm_usage", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  agentId: uuid("agent_id").references(() => agents.id),
  model: text("model").notNull(),
  inputTokens: integer("input_tokens").notNull(),
  outputTokens: integer("output_tokens").notNull(),
  cachedTokens: integer("cached_tokens").notNull().default(0),
  costUsd: integer("cost_usd_cents").notNull(), // in cents
  purpose: text("purpose").notNull(), // 'briefing' | 'engagement_detection' | etc.
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
```

### 5.2 Types de domaine TypeScript

```typescript
// packages/core/types.ts

export interface AgentConfig {
  instructions: string;
  tools: string[]; // tool names the agent can use
  heartbeatCron: string | null; // cron expression; null for event-driven only
  // OpenRouter model slug (e.g. "anthropic/claude-sonnet-4.5",
  // "openai/gpt-4o-mini", "google/gemini-2.5-pro"). Validated at boot
  // against the catalog returned by GET /api/v1/models — never hardcoded.
  model: string;
  maxTokensPerRun: number; // upper bound per agent; cannot exceed OPENROUTER_MAX_TOKENS
}

export interface ActionPayload {
  type: "send_email";
  to: string[];
  subject: string;
  body: string;
  replyToMessageId?: string;
}
// Union with other action types as they are added.

export interface BriefingContent {
  meetingTitle: string;
  participants: { email: string; name?: string; role?: string }[];
  summary: string; // 2-3 sentence context
  lastInteractions: { date: string; snippet: string; sourceRef: string }[];
  openEngagements: { description: string; dueAt?: string }[];
  relevantDocs: { title: string; url: string }[];
  suggestedQuestions?: string[];
}
```

### 5.3 Schéma du graphe Zep

Zep uses a temporal knowledge graph. For BlowCortex, we define the entity and edge types below.

**Entity types:**
- `Person` — properties: email, name, company, role
- `Project` — properties: name, status, startedAt
- `Document` — properties: title, url, sourceType (gdoc, notion, etc.)
- `Meeting` — properties: title, startsAt, endsAt, location
- `Decision` — properties: summary, madeAt
- `Topic` — properties: name

**Edge types (with temporal validity):**
- `PARTICIPATED_IN` — Person → Meeting
- `DISCUSSED` — Meeting → Topic
- `DECIDED` — Meeting → Decision
- `INVOLVES` — Project → Person
- `REFERENCES` — Document → Project/Topic
- `PROMISED_TO` — Person → Person (the engagement edge)
- `WORKS_WITH` — Person → Person (inferred from frequent interactions)

**User scoping:** All data is partitioned by `user_id`. A `Zep session` maps 1:1 to a user.

---

## 6. Contrats d'API

### 6.1 Conventions

- Base URL: `${BlowCortex_API_URL}/v1`
- All endpoints require `Authorization: Bearer <clerk_jwt>` header except `/auth/*` and `/health`.
- All request and response bodies are JSON.
- All timestamps are ISO 8601 UTC.
- All endpoints return `{ data: ... }` on success or `{ error: { code, message, details? } }` on failure.
- Rate limit: 100 req/min per user.

### 6.2 Endpoints principaux (Phase 1)

```typescript
// Health
GET /health
// Response: { data: { status: "ok", version: string } }

// User
GET /v1/me
// Response: { data: User }

PATCH /v1/me
// Body: Partial<{ name, timezone, trustLevel }>
// Response: { data: User }

// Connectors
GET /v1/connectors
// Response: { data: Connector[] }

POST /v1/connectors/:provider/oauth/start
// Response: { data: { authUrl: string, state: string } }

POST /v1/connectors/:provider/oauth/callback
// Body: { code: string, state: string }
// Response: { data: Connector }

DELETE /v1/connectors/:id
// Response: { data: { success: true } }

// Agents
GET /v1/agents
// Response: { data: Agent[] }

POST /v1/agents
// Body: { type: string, name: string, config: AgentConfig }
// Response: { data: Agent }

PATCH /v1/agents/:id
// Body: Partial<{ name, status, config, budgetTokensMonthly }>
// Response: { data: Agent }

// Actions (proposed actions awaiting user approval)
GET /v1/actions?status=pending
// Response: { data: Action[] }

POST /v1/actions/:id/approve
// Response: { data: Action }

POST /v1/actions/:id/reject
// Body: { reason?: string }
// Response: { data: Action }

// Engagements
GET /v1/engagements?status=open
// Response: { data: Engagement[] }

PATCH /v1/engagements/:id
// Body: Partial<{ status, dueAt }>
// Response: { data: Engagement }

// Briefings
GET /v1/briefings/upcoming
// Response: { data: Briefing[] }

GET /v1/briefings/:id
// Response: { data: Briefing }

POST /v1/briefings/:id/feedback
// Body: { helpful: boolean }
// Response: { data: Briefing }

// Graph queries (natural language)
POST /v1/graph/search
// Body: { query: string, limit?: number }
// Response: { data: { results: Array<{ type, entity, score, context }> } }
```

### 6.3 Endpoints webhook (internes, appelés par Inngest)

```typescript
POST /internal/webhooks/gmail
POST /internal/webhooks/gcal
POST /internal/webhooks/slack
POST /internal/webhooks/notion
// All signed with HMAC. Validation required.
```

---

## 7. Spécifications des agents

Each agent is a deterministic configuration + a prompt template. Agents are instantiated per user.

### 7.1 Agent de détection d'engagements

**Purpose:** Detect commitments ("I'll send you this", "we'll do X", "I'll get back to you") in incoming messages.

**Trigger:** Event — new message ingested (email, Slack DM).

**Model:** any chat model exposed by OpenRouter; default = `OPENROUTER_DEFAULT_MODEL` (e.g. `anthropic/claude-sonnet-4.5`). The user may override per agent in settings; the dropdown is populated from `GET /api/v1/models`.

**Tools:** `create_engagement`, `update_graph_entity`

**System prompt (exact):**
```
You are the Engagement Detector agent for BlowCortex. Your single job is to identify commitments made by the user or to the user in written communications.

A commitment is a statement where someone (the user or another party) promises to do something by some time. Examples:
- "I'll send you the proposal by Friday" → commitment by the user to deliver a proposal
- "Can you get back to me on the budget?" → NOT a commitment yet, it's a request
- "Sure, will do by tomorrow" → commitment by the user

For each message you analyze, output a structured JSON array of detected commitments. If none, output [].

Each commitment must have:
- description: one-sentence summary of what is to be done
- made_by: "user" | "other"
- to_whom: email or name of the other party
- due_at: ISO 8601 datetime if specified, else null
- confidence: 0-100 (how certain you are this is a commitment)
- evidence: exact quoted phrase from the message

Be conservative. Only output commitments with confidence >= 70. Vague intentions ("we should probably") are not commitments.
```

**Input format:** `{ messageId, messageBody, sender, timestamp, threadContext }`

**Output format:** Array of `{ description, made_by, to_whom, due_at, confidence, evidence }`

**Acceptance criteria:**
- [ ] When fed a message with clear commitment, returns ≥1 result with confidence ≥70.
- [ ] When fed a message with no commitment, returns empty array.
- [ ] Precision on the test dataset (see Section 12) must be ≥85%.

### 7.2 Agent de briefing de réunion

**Purpose:** Generate a pre-meeting briefing 15 minutes before any calendar event with ≥1 participant other than the user.

**Trigger:** Scheduled — runs 15 minutes before event start (via Inngest sleep).

**Model:** OpenRouter slug chosen by the user; default = `OPENROUTER_DEFAULT_MODEL`. A classifier may upgrade strategic meetings to a stronger slug (e.g. `anthropic/claude-opus-4.5` or `openai/gpt-4o`) when the user has authorized this in settings.

**Tools:** `query_graph`, `search_past_interactions`, `get_relevant_docs`

**System prompt (exact):**
```
You are the Meeting Briefer agent for BlowCortex. You produce concise, actionable briefings that prepare the user for an upcoming meeting.

You will receive:
- Meeting details (title, participants, time)
- Last N interactions with each participant (from the knowledge graph)
- Open engagements involving the participants
- Documents referenced in recent communications with them

Output a JSON object matching the BriefingContent schema:
- summary: 2-3 sentences of context. Answer: "What is this meeting about and why does it matter now?"
- lastInteractions: list up to 5 recent relevant exchanges, most recent first
- openEngagements: list all engagements involving this participant that are still open
- relevantDocs: up to 5 documents that are likely relevant
- suggestedQuestions: up to 3 questions the user might want to raise (optional)

Constraints:
- Total length of summary: under 60 words
- Do not fabricate. If you lack context, say so in the summary.
- Do not include information unrelated to the meeting.
```

**Acceptance criteria:**
- [ ] Briefing is generated before every calendar event with external participants.
- [ ] Briefing is delivered to the user via push notification 15 minutes before start.
- [ ] ≥70% user feedback positive on a test cohort of 20 briefings.

### 7.3 Infrastructure d'orchestration des agents

Each agent exposes:

```typescript
// packages/agents/src/base.ts

export interface Agent<TInput, TOutput> {
  id: string;
  type: string;
  model: string; // OpenRouter slug, validated against the model registry
  systemPrompt: string;
  tools: Tool[];

  run(userId: string, input: TInput, context: RunContext): Promise<TOutput>;
}

export interface RunContext {
  traceId: string;
  langfuseTrace: Trace;
  budgetGuard: BudgetGuard;
  zepClient: ZepClient;
  toolRegistry: ToolRegistry;
}

export interface BudgetGuard {
  check(estimatedTokens: number): Promise<{ ok: boolean; reason?: string }>;
  record(actualTokens: { input: number; output: number; cached: number }): Promise<void>;
}
```

---

## 8. Workflows clés

### 8.1 Flux d'ingestion d'emails

```
1. Gmail webhook → POST /internal/webhooks/gmail
2. API verifies HMAC, emits Inngest event "gmail.message.received"
3. Inngest function "ingest-gmail-message":
   a. Fetch message via Gmail API
   b. Store metadata in Postgres (messages table — defined by impl AI)
   c. Add entity/facts to Zep graph (sender, subject as topic)
   d. Emit event "message.ingested" with payload
4. Inngest function "detect-engagements" (triggered by "message.ingested"):
   a. Load Engagement Detector agent for user
   b. Run agent with message content
   c. For each detected engagement:
      - INSERT into engagements table
      - Add edge PROMISED_TO in Zep with valid_from=now, valid_to=null
      - If due_at is set, schedule reminder via Inngest (step.sleepUntil)
5. If engagement detected from external party AND user is in meeting in <30min:
   - Emit event "briefing.recompute" for that meeting
```

### 8.2 Flux de génération de briefing

```
1. Every 5 minutes, Inngest cron job polls Google Calendar for upcoming events
2. For each event starting in 14-16 minutes without a briefing yet:
   a. Emit event "briefing.generate" with { userId, eventId }
3. Inngest function "generate-briefing":
   a. Fetch event details (participants, time, location, description)
   b. Query Zep for context on each participant (last 30 days)
   c. Query Postgres for open engagements with participants
   d. Run Meeting Briefer agent
   e. INSERT into briefings table
   f. Emit event "briefing.ready"
4. Inngest function "deliver-briefing":
   a. Send push notification to user via Expo Push
   b. Update briefings.deliveredAt
```

### 8.3 Flux d'approbation d'action (Trust Level 0-1)

```
User side:
1. User opens app, sees a pending action card
2. Card shows: preview, rationale, context refs (expandable)
3. User taps "Approve" or "Reject"
4. On approve → POST /v1/actions/:id/approve

Backend side:
1. Validate action is still pending and user is owner
2. Update status → "approved", set approvedAt
3. Emit event "action.approved"
4. Inngest function "execute-action":
   a. Dispatch by payload.type to the correct executor
   b. Execute (e.g., send email via Gmail API)
   c. On success: update status → "executed", set executedAt
   d. On failure: update status → "failed", set failureReason
5. Write audit_log entry
```

### 8.4 Progression du niveau de confiance

```
Level 0 (default): All actions require approval.
Level 1: Email replies that are clarifications or confirmations (detected via classifier) auto-execute after 60s delay with undo option.
Level 2: Routine internal messages auto-execute. External communications still require approval.
Level 3: All communications auto-execute. User reviews journal after the fact.

Progression:
- User explicitly advances trust level via settings.
- Each level requires user to have approved >=20 actions of the type being auto-promoted.
- Any reject/undo at level N reverts to level N-1 for that action type for 48h.
```

---

## 9. Spécification frontend

### 9.1 Pages (Next.js app router)

```
apps/web/app/
├── (auth)/
│   ├── sign-in/page.tsx
│   └── sign-up/page.tsx
├── (app)/
│   ├── layout.tsx                # App shell with nav
│   ├── page.tsx                  # Home = Feed (see 9.2)
│   ├── briefings/
│   │   ├── page.tsx              # List upcoming briefings
│   │   └── [id]/page.tsx         # Detail view
│   ├── engagements/page.tsx      # All open engagements
│   ├── actions/page.tsx          # Pending actions queue
│   ├── agents/
│   │   ├── page.tsx              # List and manage agents
│   │   └── [id]/page.tsx
│   ├── connectors/page.tsx       # Add/remove integrations
│   ├── graph/page.tsx            # Search the knowledge graph
│   └── settings/page.tsx         # User settings, trust level
└── api/                          # Next.js API routes (proxy to Hono API)
```

### 9.2 Spécification du composant Home Feed

The home feed is the primary UI. It shows a unified timeline of:
- Pending actions (highest priority)
- Upcoming briefings (next 2 hours)
- Open engagements due today
- New insights from agents (pattern detections)

**Layout:** Single column, max-width 720px, cards sorted by urgency + time.

**Card types:**
- `ActionCard` — red accent, "Approve/Reject" buttons
- `BriefingCard` — blue accent, "Open briefing" action
- `EngagementCard` — amber accent for overdue, gray for upcoming
- `InsightCard` — purple accent, dismissible

**State management:** Use TanStack Query with 15-second polling on `/v1/feed` (implementer defines endpoint). Optimistic updates on approve/reject.

### 9.3 Design tokens

Use shadcn/ui defaults. Override:
- Primary color: `#6366f1` (indigo-500)
- Font: Geist Sans (via `next/font`)
- Border radius default: 0.75rem
- Dark mode: required, toggle in settings

### 9.4 App mobile (Expo)

Phase 1 mobile scope: read-only + approve/reject. No content creation on mobile.

Screens:
- Home (feed, same as web)
- Briefing detail
- Action approval
- Settings (trust level, notifications, sign out)

Push notifications: deliver briefings and urgent engagements. Use Expo Push with topic-based subscriptions.

---

## 10. Infrastructure LLM

The LLM provider is **OpenRouter** — a single OpenAI-compatible endpoint giving access to 300+ models (Anthropic, OpenAI, Google, Meta, Mistral, DeepSeek, etc.). The model list is **never hardcoded**: it is fetched at runtime from `GET /api/v1/models`, cached, and exposed to the user as a dropdown in settings.

### 10.1 Wrapper du client OpenRouter

```typescript
// packages/llm/src/client.ts

import OpenAI from "openai"; // OpenRouter is OpenAI-compatible

const openrouter = new OpenAI({
  baseURL: process.env.OPENROUTER_BASE_URL!, // https://openrouter.ai/api/v1
  apiKey: process.env.OPENROUTER_API_KEY!,
  defaultHeaders: {
    "HTTP-Referer": process.env.OPENROUTER_HTTP_REFERER ?? "",
    "X-Title": process.env.OPENROUTER_X_TITLE ?? "BlowCortex",
  },
});

export interface LlmCallOptions {
  model: string;          // OpenRouter slug (e.g. "anthropic/claude-sonnet-4.5")
  system: string;
  messages: Message[];
  tools?: Tool[];
  maxTokens: number;     // capped by OPENROUTER_MAX_TOKENS at the wrapper boundary
  temperature?: number;
  userId: string;        // for budget tracking
  agentId?: string;      // for attribution
  purpose: string;       // for audit/analytics
  traceParent?: string;  // Langfuse trace context
}

export async function callLlm(opts: LlmCallOptions): Promise<LlmResponse> {
  // MUST:
  // 1. Resolve `opts.model` against the cached model registry (10.2). Reject unknown slugs.
  // 2. Cap `opts.maxTokens` at min(opts.maxTokens, OPENROUTER_MAX_TOKENS, model.top_provider.max_completion_tokens).
  // 3. Check user budget before calling. Throw BudgetExceededError if over limit.
  // 4. Compute USD cost from the model's pricing.prompt / pricing.completion (USD per 1 token, returned as strings).
  // 5. Log usage to llm_usage table (input/output tokens + USD cents + model slug).
  // 6. Trace to Langfuse with full inputs/outputs and cost.
  // 7. Retry on 429/503 with exponential backoff (max 3 attempts).
  // 8. On 400 (invalid request), do not retry — throw immediately.
}
```

### 10.2 Registre dynamique des modèles

A small in-memory cache (refreshed every 6 h via Inngest cron) holds the OpenRouter catalog:

```typescript
// packages/llm/src/registry.ts

export interface OpenRouterModel {
  id: string;                // slug — e.g. "anthropic/claude-sonnet-4.5"
  name: string;              // display name
  context_length: number;
  pricing: {
    prompt: string;          // USD per 1 prompt token
    completion: string;      // USD per 1 completion token
  };
  top_provider: {
    max_completion_tokens: number;
    is_moderated: boolean;
  };
  supported_parameters: string[];
}

export async function fetchModelRegistry(): Promise<OpenRouterModel[]> {
  const res = await fetch(`${process.env.OPENROUTER_BASE_URL}/models`, {
    headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}` },
  });
  const { data } = await res.json();
  return data;
}

// UI helper: convert per-token price (USD) to per-1M-tokens for display.
export const pricePer1M = (perToken: string) => Number(perToken) * 1_000_000;
```

The settings dropdown (`/settings`) and the agent config form both consume this registry to render available models with their context length and price per 1M tokens.

### 10.3 Stratégie de prompt caching

OpenRouter forwards Anthropic-style `cache_control` markers automatically when the underlying model supports implicit caching (`endpoint.supports_implicit_caching === true`).

All agent calls SHOULD:
- Place the system prompt and the static user-context prefix in early messages (cache-friendly).
- Keep the dynamic part (current event/message) at the tail.

Target cache hit rate: ≥70% after 1 week of usage per user, on cache-supporting models (e.g. Anthropic Claude family).

### 10.4 Cache sémantique (Phase 2)

For briefing generation: before calling the LLM, embed the meeting signature (participants + topic + last activity) and query Redis vector cache for similar briefings generated in the last 24h. If similarity >= 0.92, reuse.

---

## 11. Phases d'implémentation

Each sprint = 2 weeks of work for a coding agent. Acceptance criteria must all pass before moving to the next sprint.

### Phase 1 — MVP (Sprints 1-6)

#### Sprint 1 : Fondations

**Goal:** Working skeleton with auth, DB, and deployment.

Acceptance criteria:
- [ ] Monorepo initialized with structure from Section 4.1.
- [ ] `apps/web` boots with Clerk sign-in flow.
- [ ] `apps/api` serves `/health` returning 200.
- [ ] PostgreSQL schema migrated (Section 5.1).
- [ ] Neo4j/Zep credentials validated.
- [ ] Redis connection validated.
- [ ] Vercel deploy for web, Railway deploy for API.
- [ ] CI passes: lint + typecheck + basic tests.
- [ ] `DECISIONS.md` exists with initial entries.

#### Sprint 2 : Connecteur Gmail + ingestion

**Goal:** Ingest a user's email into the system.

Acceptance criteria:
- [ ] OAuth flow for Gmail works end-to-end.
- [ ] Connector row created in DB with encrypted tokens.
- [ ] Inngest function `ingest-gmail-initial` pulls last 7 days of emails.
- [ ] Each email creates a `Person` entity (sender), `Message` fact, `DISCUSSED` edges in Zep.
- [ ] Webhook registered on Gmail for live updates.
- [ ] New emails arriving post-setup are ingested in <2 minutes.
- [ ] `/v1/connectors` endpoint returns connection status.

#### Sprint 3 : Agent Engagement Detector

**Goal:** Detect commitments in incoming emails.

Acceptance criteria:
- [ ] Engagement Detector agent implemented per Section 7.1 spec.
- [ ] Triggered automatically on `message.ingested` event.
- [ ] Detected engagements persist to `engagements` table.
- [ ] Matching edge added to Zep graph.
- [ ] Test dataset of 100 labeled emails: precision ≥85%, recall ≥60%.
- [ ] LLM usage logged to `llm_usage` with correct attribution.
- [ ] Langfuse traces visible for every detection run.
- [ ] UI: `/engagements` page lists open engagements.

#### Sprint 4 : Google Calendar + Briefings

**Goal:** Automated pre-meeting briefings.

Acceptance criteria:
- [ ] Google Calendar OAuth and connector working.
- [ ] Inngest cron polls every 5 min for upcoming events.
- [ ] Meeting Briefer agent implemented per Section 7.2 spec.
- [ ] Briefing generated 15 min before each qualifying event.
- [ ] Web UI: `/briefings` lists upcoming and recent briefings.
- [ ] Mobile app: push notification delivered 15 min before meeting with deep link to briefing.
- [ ] Feedback mechanism: user can mark briefing "helpful" or not.

#### Sprint 5 : Actions + flux d'approbation

**Goal:** User can approve BlowCortex-drafted email replies.

Acceptance criteria:
- [ ] When an engagement has `due_at < now + 24h` and user hasn't acted, BlowCortex drafts a follow-up email.
- [ ] Draft appears as pending Action in `/actions` queue.
- [ ] User can approve → email is sent via Gmail API.
- [ ] User can reject with optional reason (stored in `audit_log`).
- [ ] Audit log is written for every action state change.
- [ ] Action payload + preview + rationale all present and renders correctly in UI.

#### Sprint 6 : Observabilité + polish + bêta

**Goal:** Production-ready for beta testing.

Acceptance criteria:
- [ ] Langfuse dashboard shows traces, costs, latency per agent.
- [ ] Budget enforcement: when user hits monthly cap, agents pause and user is notified.
- [ ] Sentry captures and reports errors.
- [ ] Onboarding flow polished: new user can connect Gmail + Calendar in <3 min.
- [ ] E2E Playwright test: sign up → connect Gmail → wait for first briefing → approve an action.
- [ ] Documentation: `README.md` with setup instructions, `ARCHITECTURE.md` with system diagram.
- [ ] 50-user beta launched.

### Phase 2 — Intelligence (Sprints 7-12, specified at lower fidelity)

- Slack connector + multi-source graph.
- Notion connector.
- Pattern detector agent: identifies recurring habits, blind spots.
- Additional dynamic agents: users can propose new agent types in natural language; BlowCortex generates the config.
- Agent-to-agent communication via internal ticket system (inspired by Paperclip).
- Trust level progression automation.
- Mem0 integration for personalization memory.
- Semantic cache for briefings (Redis vector).
- Team plan foundations (multi-user, shared graph).

### Phase 3 — The Forge (Sprints 13-20)

- Meta-agent that detects repeated manual workflows and proposes micro-app generation.
- A high-capability OpenRouter model (e.g. `anthropic/claude-opus-4.5` or `openai/gpt-4o`) generates React/JSX artifacts from detected patterns.
- Sandboxed rendering of user-specific micro-apps.
- Natural language modification of generated apps.
- Artifact versioning and rollback.

### Phase 4 — Ecosystem (Sprints 21+)

- Public API + MCP server (BlowCortex exposes user context to other agents).
- Template marketplace for common agent configurations.
- Enterprise features: SOC 2, SSO, self-hosting option.

---

## 12. Datasets de test & évaluation

### 12.1 Jeu de test de détection d'engagements

Location: `tests/fixtures/engagements.json`

Schema:
```typescript
{
  id: string;
  message: string;
  sender: string;
  timestamp: string;
  expected: {
    hasCommitment: boolean;
    commitments: Array<{
      description: string;
      madeBy: "user" | "other";
    }>;
  };
}
```

Minimum 100 examples, 50/50 positive/negative, covering:
- Clear commitments ("I'll send it by Friday")
- Ambiguous cases ("we should discuss this")
- Negated commitments ("I can't do X")
- Multi-commitment emails
- Non-English examples (10%)

Evaluation script: `pnpm test:eval:engagements`

### 12.2 Évaluation de la qualité des briefings

Manual review of first 20 briefings in beta. Each briefing rated on:
- Accuracy (no hallucinations): 0-5
- Relevance (useful context): 0-5
- Conciseness (not too long): 0-5

Target: mean ≥4.0 across all three dimensions.

### 12.3 Tests automatisés

- Unit tests: every pure function in `packages/core` and `packages/agents`.
- Integration tests: every Inngest function with mocked LLM.
- E2E tests: 3 critical paths (sign-up, connect, receive briefing).

Coverage target: ≥70% on `packages/core` and `packages/agents`.

---

## 13. Exigences de sécurité & confidentialité

**MUST:**
- All OAuth tokens encrypted at rest (AES-256-GCM, key from env).
- All secrets in environment variables, never committed.
- TLS-only in production.
- Audit log append-only (DB-level constraint).
- User can delete account + all data within 30 days (GDPR compliance).
- No user data sent to LLM beyond what's necessary for the current task.
- LLM calls go through OpenRouter; only providers/models with a no-training / zero-retention policy are enabled in production (filterable via OpenRouter's privacy settings).

**SHOULD:**
- Rate limit all endpoints per user.
- Use Clerk's built-in MFA support.
- Log suspicious patterns (bulk data access) and alert.

---

## 14. Considérations opérationnelles

### 14.1 Développement local

`docker-compose.yml` in `infra/docker/` must start:
- Postgres
- Redis
- (Neo4j optional — use Zep cloud for dev)

`pnpm dev` starts all apps in parallel via Turborepo.

### 14.2 Migrations

All DB changes via Drizzle migrations. Never modify tables manually in production.

### 14.3 Monitoring

Dashboards required (Langfuse + Sentry + PostHog):
- Active users (DAU, WAU)
- LLM cost per user (moving 7-day average)
- Agent success rate (executed actions / proposed actions)
- Briefing delivery rate (delivered / scheduled)
- Cache hit rate (prompt + semantic)

### 14.4 Réponse aux incidents

If `avg_cost_per_user > $40/month`: alert, investigate, throttle if needed.
If `engagement_precision < 0.80` on rolling window: alert, investigate prompts.
If error rate > 2%: page on-call (in Phase 2+).

---

## 15. Glossaire

- **Agent** — A configured LLM instance (model slug + system prompt + tools + budget) routed through OpenRouter.
- **Brain** — The data layer: Zep graph + Mem0 + Postgres + Redis.
- **Hands** — The action execution layer.
- **Connector** — An OAuth-linked integration with a user's external tool (Gmail, Slack, etc.).
- **Engagement** — A commitment made by or to the user, detected from communications.
- **Briefing** — A pre-meeting summary generated by the Meeting Briefer agent.
- **Trust Level** — User's setting determining how autonomously BlowCortex acts (0-3).
- **The Forge** — Phase 3 capability: BlowCortex generates custom micro-apps for the user.
- **Heartbeat** — Scheduled recurring run of an agent (vs event-driven).
- **MCP** — Model Context Protocol, the standard for connecting agents to tools.

---

## 16. Questions ouvertes pour les humains

These must be answered before the AI can proceed past Sprint 2:

1. Which OpenRouter slugs are the launch defaults? (Default + smart + fast tier — confirm the three IDs.)
2. Is Zep Cloud available in the deployment region required by data residency?
3. What is the target region for initial launch (affects GDPR/data residency choices)?
4. Is there a design file (Figma) or should the AI design UI from scratch using shadcn/ui defaults?
5. For the beta test dataset (Section 12.1), can we get real anonymized emails or should we synthesize?

If unanswered, default behavior:
1. Default = `anthropic/claude-sonnet-4.5`, reasoning-heavy = `anthropic/claude-opus-4.5`, classification/cheap = `openai/gpt-4o-mini` or `google/gemini-2.5-flash`. The user can override any of these in settings.
2. Assume Zep Cloud available in EU region.
3. Target EU (GDPR strict).
4. Design from scratch with shadcn/ui defaults.
5. Synthesize test data using a strong OpenRouter model (e.g. `anthropic/claude-opus-4.5`).

---

## Annexe A : Prompt de démarrage rapide pour l'IA d'implémentation

If you are an autonomous coding agent starting this project, begin with:

```
I am going to build BlowCortex per the PRD in this repository.

My plan:
1. Read the full PRD.
2. Verify open questions in Section 16. Apply defaults where not specified.
3. Begin Sprint 1: Foundation. Complete all acceptance criteria.
4. Commit and request review before Sprint 2.

My first command will be to set up the monorepo structure per Section 4.1 using pnpm + Turborepo.

I will not skip ahead. I will not add dependencies without documenting in DECISIONS.md.
I will use TypeScript strict mode. I will write tests before or alongside code.

Starting now.
```

End of PRD.
