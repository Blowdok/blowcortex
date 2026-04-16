# BlowCortex — Guide de configuration des services externes

Instructions complètes de configuration pour chaque service externe requis afin d'exécuter BlowCortex en développement et en production.

**Temps total estimé de configuration :** 2-3 heures (tous les services, comptes de dev uniquement)
**Coût mensuel estimé pour le dev :** $0 (tous les services ont des offres gratuites suffisantes pour un développeur solo)
**Coût mensuel estimé pour la production avec 100 utilisateurs :** ~$300-500
**Coût mensuel estimé pour la production avec 1000 utilisateurs :** ~$2,500-3,500 (principalement les coûts LLM)

---

## Ordre de configuration (recommandé)

Faites-les dans cet ordre. Certains services dépendent d'autres.

1. OpenRouter (fournisseur LLM unifié — dépendance principale)
2. Clerk (authentification)
3. Supabase or Neon (PostgreSQL)
4. Upstash or Redis Cloud (Redis)
5. Zep Cloud (graphe mémoire — remplace le besoin d'un Neo4j séparé)
6. Inngest (orchestration d'événements)
7. Langfuse (observabilité)
8. Sentry (suivi des erreurs)
9. Google Cloud Console (OAuth Gmail + Calendar)
10. Slack API (OAuth Slack — peut être reporté à la Phase 2)
11. Notion Integration (peut être reporté à la Phase 2)
12. Cloudflare R2 (stockage — peut être reporté jusqu'à ce que nécessaire)
13. Vercel + Railway (déploiement — uniquement lorsque vous êtes prêt à déployer)

---

## 1. OpenRouter

**What it provides:** A single OpenAI-compatible endpoint that proxies 300+ models from Anthropic, OpenAI, Google, Meta, Mistral, DeepSeek, etc. Built-in fallback, cost routing, prompt caching pass-through. The heart of BlowCortex's LLM layer.

**Why OpenRouter and not Anthropic directly:**
- One API key, one bill, all providers.
- Switch model per agent (or per request) without changing code.
- Cheaper models available for high-volume tasks (classification, parsing).
- The model catalog (id, context length, price per token, max completion tokens) is exposed via `GET /api/v1/models` — BlowCortex fetches it at runtime to populate the model picker dropdown. **Never hardcode model IDs in business code.**

### Configuration

1. Go to https://openrouter.ai and sign up (Google or GitHub OAuth).
2. Add credit (minimum $5) — pay-as-you-go, no subscription.
3. Navigate to https://openrouter.ai/settings/keys → **Create Key**.
4. Name it `BlowCortex-dev`. Optionally set a per-key credit limit (recommended for dev: $25).
5. Copy the key (starts with `sk-or-v1-...`).

### Configurer

In `.env.local`:
```bash
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# Optional attribution headers — appear in your OpenRouter dashboard analytics.
OPENROUTER_HTTP_REFERER=http://localhost:3000
OPENROUTER_X_TITLE=BlowCortex

# Default model + safety ceiling on max_tokens. The user can pick another slug
# in the settings UI; the dropdown is populated from GET /api/v1/models.
OPENROUTER_DEFAULT_MODEL=anthropic/claude-sonnet-4.5
OPENROUTER_MAX_TOKENS=4096
```

### Paramètres importants

- **Per-key credit limit** in https://openrouter.ai/settings/keys — primary safety net against runaway cost. Recommended for dev: $25/month.
- **Provider preferences** in https://openrouter.ai/settings/preferences — disable providers that train on your data; pin EU-hosted providers if you need data residency.
- **Implicit prompt caching** is automatic on models that support it (Anthropic Claude family, OpenAI GPT-4 family). No code change required — OpenRouter forwards the right markers.

### Tester l'API rapidement

```bash
# List the catalog (use jq to filter on price)
curl https://openrouter.ai/api/v1/models \
  -H "Authorization: Bearer $OPENROUTER_API_KEY" | jq '.data[0:5]'

# One-shot chat completion
curl https://openrouter.ai/api/v1/chat/completions \
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "anthropic/claude-sonnet-4.5",
    "max_tokens": 64,
    "messages": [{"role": "user", "content": "ping"}]
  }'
```

### Attentes de coût

OpenRouter's price = the underlying provider's price + a small routing fee (typically 0–5 %). Examples (per 1M tokens, indicative):

| Slug | Prompt | Completion | Use case |
|---|---:|---:|---|
| `openai/gpt-4o-mini` | ~$0.15 | ~$0.60 | classification, parsing |
| `google/gemini-2.5-flash` | ~$0.30 | ~$2.50 | fast reasoning, briefings |
| `anthropic/claude-sonnet-4.5` | ~$3.00 | ~$15.00 | default agent — strong reasoning |
| `anthropic/claude-opus-4.5` | ~$15.00 | ~$75.00 | strategic briefings, complex tool use |

- Dev usage (you testing alone): $2-15/month.
- Production per active user: $5-25/month after caching/routing/model-tier optimizations (per PRD Section 10). **Lower than calling Anthropic directly because cheap models can absorb classification and parsing workloads.**

---

## 2. Clerk (Authentification)

**What it provides:** User authentication (email, OAuth, MFA), session management, user profiles.

### Configuration

1. Go to https://clerk.com and sign up.
2. Create a new application named "BlowCortex".
3. Choose authentication methods: enable Email, Google, and Passkeys at minimum.
4. Skip "add your domain" for now (dev uses localhost).

### Configurer

From the Clerk dashboard, copy these values. In `.env.local`:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Clerk URLs (defaults work for dev)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding
```

### Vérification JWT pour le backend

Your Hono API will need to verify Clerk JWTs:

1. In Clerk dashboard → API Keys → JWT Public Key.
2. Copy the public key.
3. Add to `.env.local`:
```bash
CLERK_JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n..."
```

### Webhook pour la synchronisation des utilisateurs

To sync users to your Postgres on signup:

1. Clerk dashboard → Webhooks → Add Endpoint.
2. URL: `https://your-api-url/v1/webhooks/clerk` (for prod) or use ngrok/Cloudflare Tunnel for dev.
3. Events: `user.created`, `user.updated`, `user.deleted`.
4. Copy the signing secret:
```bash
CLERK_WEBHOOK_SECRET=whsec_...
```

### Coût

- Free tier: 10,000 monthly active users. More than enough for MVP and early growth.
- Paid starts at $25/month when you exceed limits.

---

## 3. PostgreSQL (Supabase recommandé)

**What it provides:** Primary relational database for all BlowCortex metadata.

**Alternatives:** Neon (excellent serverless option), Railway Postgres (simple), or self-hosted.

### Configuration avec Supabase

1. Go to https://supabase.com and sign up.
2. New project → name it `BlowCortex-dev`.
3. Choose region closest to your users (EU for GDPR compliance if targeting EU).
4. Set a strong database password and save it.
5. Wait ~2 minutes for provisioning.

### Configure

From Project Settings → Database → Connection String (choose "Transaction" mode for Drizzle):

```bash
DATABASE_URL=postgresql://postgres.xxx:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
DATABASE_DIRECT_URL=postgresql://postgres.xxx:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres
```

`DATABASE_URL` = pooled (use this for runtime).
`DATABASE_DIRECT_URL` = direct (use this for migrations).

### Configuration des migrations Drizzle

After Sprint 1 where Drizzle is installed, run:
```bash
pnpm db:generate  # generates SQL from schema
pnpm db:migrate   # applies to Supabase
```

BlowCortex's `packages/db` should include a `drizzle.config.ts` using `DATABASE_DIRECT_URL`.

### Row-level security (production)

Before production, enable RLS on all tables with user-scoped data:

```sql
-- Example for engagements table
ALTER TABLE engagements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users can only see their own engagements"
  ON engagements FOR ALL
  USING (user_id = current_setting('BlowCortex.user_id')::uuid);
```

Your API sets `BlowCortex.user_id` per request via `SET LOCAL`.

### Coût

- Free tier: 500MB database, 1GB bandwidth. Fine for dev.
- Pro ($25/month): 8GB, daily backups, point-in-time recovery. Upgrade before going to production.

### Alternative : Neon

Neon is great for serverless deployments (auto-scaling, branches for dev/staging):

1. https://neon.tech → new project
2. Same connection string pattern
3. Branching feature useful for preview deployments

---

## 4. Redis (Upstash recommandé)

**What it provides:** Cache, session store, queue backing, semantic cache, rate limiting.

**Must have:** Vector search support (Redis Stack features) for semantic caching later.

### Configuration avec Upstash

1. Go to https://upstash.com and sign up.
2. Create Redis database → name `BlowCortex-dev`.
3. Type: **Redis Stack** (not standard Redis — we need vector search).
4. Region: match your Postgres region.
5. Eviction: `noeviction` (we'll manage TTLs manually).

### Configure

From the database dashboard:

```bash
REDIS_URL=rediss://default:xxx@yyy.upstash.io:6379
```

For REST-based access (optional, simpler for serverless):
```bash
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx
```

BlowCortex's `packages/redis` should wrap a single client.

### Cost

- Free tier: 10,000 commands/day, 256MB. Fine for early dev.
- Pay-as-you-go: $0.2 per 100K commands. For 100 users, expect ~$5-15/month.

---

## 5. Zep Cloud (Graphe mémoire)

**What it provides:** Temporal knowledge graph (via Graphiti under the hood), entity extraction, semantic search, memory management.

**Why Zep over self-hosting:** Zep Cloud handles Neo4j for you. Self-hosting means managing Neo4j separately, which is significant operational overhead for a solo team.

### Configuration

1. Go to https://www.getzep.com and sign up.
2. Create a project named `BlowCortex`.
3. Navigate to API Keys → Create new key.
4. Choose the region — match your other services for latency.

### Configurer

```bash
ZEP_API_KEY=z_...
ZEP_API_URL=https://api.getzep.com
```

### Modèle de données dans Zep

Zep organizes data around `User` and `Session`:

- Each BlowCortex user → one Zep user (with same ID).
- Each BlowCortex user → one Zep session that represents their "lifetime" context.
- Messages, facts, and entities are added to the session.

On first sign-up of a BlowCortex user, your API must:
```typescript
await zep.user.add({
  user_id: BlowCortexUserId,
  email: userEmail,
  first_name: firstName,
});
await zep.memory.addSession({
  session_id: `BlowCortex-${BlowCortexUserId}`,
  user_id: BlowCortexUserId,
});
```

### Types d'entités

Zep supports custom entity types. Define them once at boot (per PRD Section 5.3):

```typescript
await zep.graph.setEntityTypes({
  entityTypes: [
    { name: "Person", description: "A human the user interacts with" },
    { name: "Project", description: "A work project the user is involved in" },
    { name: "Document", description: "A document referenced in conversations" },
    { name: "Meeting", description: "A calendar event" },
    { name: "Decision", description: "A decision made in a meeting or conversation" },
    { name: "Topic", description: "A subject of discussion" },
  ],
});
```

### Cost

- Free tier: 1 user, enough for dev and testing.
- Start plan: $49/month, 100 users. Enough for early beta.
- Pro: $299/month, 1000 users + advanced features.

### Si vous voulez l'auto-héberger

Use Graphiti open-source + Neo4j. Stack:

- Neo4j Aura (free tier: 1 instance, enough for dev): https://neo4j.com/cloud/aura/
- Graphiti Python server: https://github.com/getzep/graphiti

This adds ~1 day of setup work. Only do this if data residency/cost makes Zep Cloud impossible.

---

## 6. Inngest (Orchestration d'événements)

**What it provides:** Durable event-driven function execution. Replaces the need for BullMQ + workers + queue management.

### Configuration

1. Go to https://www.inngest.com and sign up.
2. Create a new environment → name `BlowCortex-dev`.
3. Install the Inngest dev server locally:
```bash
npx inngest-cli@latest dev
```
4. Keep it running on port 8288 during development.

### Configurer

For cloud connection:

```bash
INNGEST_EVENT_KEY=xxx       # From dashboard → Keys
INNGEST_SIGNING_KEY=signkey-xxx  # From dashboard → Keys
```

For local dev (the SDK detects automatically when `NODE_ENV=development`):

```bash
# No additional config needed, SDK talks to localhost:8288
```

### Structure des fonctions

Your `apps/workers` should export an Inngest client and functions:

```typescript
// apps/workers/src/client.ts
import { Inngest } from "inngest";
export const inngest = new Inngest({
  id: "BlowCortex",
  eventKey: process.env.INNGEST_EVENT_KEY,
});

// apps/workers/src/functions/ingest-gmail-message.ts
export const ingestGmailMessage = inngest.createFunction(
  { id: "ingest-gmail-message" },
  { event: "gmail.message.received" },
  async ({ event, step }) => {
    const message = await step.run("fetch-message", async () => {
      return await gmailApi.getMessage(event.data.messageId);
    });
    await step.run("add-to-graph", async () => {
      await zep.memory.add({ /* ... */ });
    });
    await step.sendEvent("message.ingested", {
      name: "message.ingested",
      data: { userId: event.data.userId, messageId: message.id },
    });
  }
);
```

### Endpoint webhook

Your `apps/api` must expose `/api/inngest` which receives invocations:

```typescript
import { serve } from "inngest/hono";
app.all("/api/inngest", serve({ client: inngest, functions: [...] }));
```

### Coût

- Free tier: 50,000 function invocations/month, 100,000 step invocations/month. Covers early beta.
- Hobby: $20/month for 100K/1M.
- Pro: $50/month for unlimited functions + longer history.

---

## 7. Langfuse (Observabilité)

**What it provides:** Tracing of LLM calls, cost tracking, evaluation infrastructure. Critical for debugging agent behavior.

### Setup

1. Go to https://cloud.langfuse.com and sign up.
2. Create new project → name `BlowCortex`.
3. Settings → API Keys → Create key pair.

### Configure

```bash
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_SECRET_KEY=sk-lf-...
LANGFUSE_HOST=https://cloud.langfuse.com  # or https://us.cloud.langfuse.com for US
```

### Integration

Every LLM call in `packages/llm` must create a trace:

```typescript
import { Langfuse } from "langfuse";

const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  secretKey: process.env.LANGFUSE_SECRET_KEY,
});

const trace = langfuse.trace({
  name: "engagement-detection",
  userId: BlowCortexUserId,
  metadata: { agentId, messageId },
});

const generation = trace.generation({
  name: "openrouter-call",
  model: agent.model, // OpenRouter slug, e.g. "anthropic/claude-sonnet-4.5"
  input: messages,
});

// ... call OpenRouter ...

generation.end({ output: response });
```

### Evaluations (Phase 2)

Langfuse supports automatic LLM-as-judge evaluations. For BlowCortex, set up a rubric to score:
- Briefing quality (accuracy, relevance, conciseness)
- Engagement detection precision

### Cost

- Free tier: 50K traces/month. Enough for beta.
- Core: $59/month for 200K traces + more features.

---

## 8. Sentry (Suivi des erreurs)

**What it provides:** Exception tracking across frontend, backend, and mobile.

### Setup

1. Go to https://sentry.io and sign up.
2. Create three projects:
   - `BlowCortex-web` (Next.js)
   - `BlowCortex-api` (Node.js)
   - `BlowCortex-mobile` (React Native / Expo)
3. Copy DSN for each.

### Configure

```bash
SENTRY_DSN_WEB=https://...@sentry.io/...
SENTRY_DSN_API=https://...@sentry.io/...
SENTRY_DSN_MOBILE=https://...@sentry.io/...

# For source map upload
SENTRY_ORG=your-org
SENTRY_PROJECT_WEB=BlowCortex-web
SENTRY_AUTH_TOKEN=...  # from Sentry → Settings → Auth Tokens
```

### Integration

Use the official SDKs:
- `@sentry/nextjs` for web
- `@sentry/node` for API
- `@sentry/react-native` for mobile

### Cost

- Free tier: 5K errors/month. Enough for beta.
- Team: $26/month for 50K errors.

---

## 9. Google Cloud Console (Gmail + Calendar OAuth)

**What it provides:** OAuth access to a user's Gmail and Google Calendar.

This is the most complex setup step. Budget 30-45 minutes.

### Setup

1. Go to https://console.cloud.google.com.
2. Create a new project named `BlowCortex`.
3. Enable APIs:
   - Gmail API
   - Google Calendar API
   - Google People API (for contact enrichment)
4. Go to APIs & Services → OAuth consent screen:
   - User type: External
   - App name: BlowCortex
   - User support email: your email
   - Developer contact: your email
   - Add scopes:
     - `https://www.googleapis.com/auth/gmail.modify` (read/send/modify email)
     - `https://www.googleapis.com/auth/calendar` (full calendar access)
     - `https://www.googleapis.com/auth/userinfo.email`
     - `https://www.googleapis.com/auth/userinfo.profile`
   - Add test users (your own email) — required while in dev mode.
   - Save.

5. Credentials → Create Credentials → OAuth Client ID:
   - Type: Web application
   - Name: BlowCortex Web
   - Authorized JavaScript origins: `http://localhost:3000` (and your prod domain later)
   - Authorized redirect URIs:
     - `http://localhost:3100/v1/connectors/google/oauth/callback`
     - Your production callback URL
   - Save.

6. Copy Client ID and Client Secret.

### Configure

```bash
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx
GOOGLE_REDIRECT_URI_DEV=http://localhost:3100/v1/connectors/google/oauth/callback
GOOGLE_REDIRECT_URI_PROD=https://api.BlowCortex.app/v1/connectors/google/oauth/callback
```

### Gmail Pub/Sub for webhooks (real-time email notifications)

For live email ingestion (not polling):

1. In Cloud Console → Pub/Sub → Create topic named `BlowCortex-gmail-updates`.
2. Create subscription → Push → URL: `https://your-api/v1/webhooks/gmail-pubsub`.
3. Grant the Gmail service account publisher role on the topic:
```bash
gcloud pubsub topics add-iam-policy-binding BlowCortex-gmail-updates \
  --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
  --role=roles/pubsub.publisher
```
4. Per user, call `gmail.users.watch()` with this topic to subscribe.

```bash
GCP_PROJECT_ID=BlowCortex-xxxxx
GMAIL_PUBSUB_TOPIC=projects/BlowCortex-xxxxx/topics/BlowCortex-gmail-updates
```

### Going to production

Before production, submit for Google verification:
1. OAuth consent screen → Publish app.
2. Verification process (takes 2-6 weeks). Requires:
   - Privacy policy URL
   - Terms of service URL
   - Verified domain ownership
   - Demo video showing how BlowCortex uses the requested scopes
   - Security assessment for "restricted scopes" (Gmail modify is restricted)

**Plan for this early.** Without verification, you're capped at 100 test users.

### Cost

- Google APIs: free for this use case (well within limits).
- Pub/Sub: first 10GB/month free. More than enough.

---

## 10. Slack API (Phase 2)

### Setup

1. Go to https://api.slack.com/apps → Create New App → From scratch.
2. Name: BlowCortex. Workspace: your test workspace.
3. OAuth & Permissions → Scopes → Add Bot Token Scopes:
   - `channels:history`, `channels:read`
   - `groups:history`, `groups:read` (private channels, if needed)
   - `im:history`, `im:read`
   - `chat:write`
   - `users:read`, `users:read.email`
4. User Token Scopes (for search):
   - `search:read`
5. Redirect URLs: `https://your-api/v1/connectors/slack/oauth/callback`
6. Event Subscriptions → Request URL: `https://your-api/v1/webhooks/slack`
7. Subscribe to bot events: `message.channels`, `message.im`, `message.groups`.

### Configure

```bash
SLACK_CLIENT_ID=xxx
SLACK_CLIENT_SECRET=xxx
SLACK_SIGNING_SECRET=xxx  # from Basic Information
```

### MCP alternative

Per PRD, prefer using Slack's official MCP server once stable. Check https://docs.slack.dev/ai/slack-mcp-server/ for current setup.

### Cost

Free for BlowCortex's usage.

---

## 11. Notion Integration (Phase 2)

### Setup

1. Go to https://www.notion.so/my-integrations → New integration.
2. Public integration (for multi-user).
3. Capabilities: Read content, Update content, Read user info.
4. OAuth Domain & URIs: add your callback URL.
5. Copy OAuth Client ID and Client Secret.

### Configure

```bash
NOTION_CLIENT_ID=xxx
NOTION_CLIENT_SECRET=xxx
NOTION_REDIRECT_URI=https://your-api/v1/connectors/notion/oauth/callback
```

### Cost

Free.

---

## 12. Cloudflare R2 (Stockage d'objets)

**What it provides:** S3-compatible storage for user files, Forge-generated artifacts, and document caches. Zero egress fees.

### Setup

1. Sign up at https://cloudflare.com (free account is fine).
2. R2 → Create bucket → name `BlowCortex-artifacts-dev`.
3. Settings → R2 → Manage API Tokens → Create API token.
4. Permissions: Object Read & Write.
5. Copy credentials.

### Configure

```bash
R2_ACCOUNT_ID=xxx
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET=BlowCortex-artifacts-dev
R2_ENDPOINT=https://xxx.r2.cloudflarestorage.com
```

### Accès

Use the AWS S3 SDK (R2 is S3-compatible):

```typescript
import { S3Client } from "@aws-sdk/client-s3";
const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID!, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY! },
});
```

### Cost

- Free tier: 10GB storage, 1M Class A ops/month. Enough for beta.
- Beyond: $0.015/GB/month. Very cheap.

---

## 13. Déploiement (Vercel + Railway)

**Only set these up when ready to deploy (end of Sprint 6).**

### Vercel (web app)

1. https://vercel.com → import repo.
2. Root directory: `apps/web`.
3. Framework: Next.js (auto-detected).
4. Environment variables: copy all `NEXT_PUBLIC_*` + Clerk keys.
5. Deploy.

### Railway (API + workers)

1. https://railway.app → new project → deploy from GitHub.
2. Add two services:
   - `BlowCortex-api` from `apps/api`
   - `BlowCortex-workers` from `apps/workers`
3. Environment variables: copy all server-side keys.
4. Set up custom domains: `api.BlowCortex.app` and `workers.BlowCortex.app`.
5. Deploy.

### Cost

- Vercel: free tier usually sufficient. Pro $20/month if needed.
- Railway: $5/month trial, then $5+ based on usage.

---

## Résumé : checklist des clés requises

Paste this into `.env.local` and fill in:

```bash
# === Core ===
NODE_ENV=development
BlowCortex_BASE_URL=http://localhost:3000
BlowCortex_API_URL=http://localhost:3100
ENCRYPTION_KEY=  # Generate: openssl rand -base64 32 (for OAuth token encryption)

# === OpenRouter ===
OPENROUTER_API_KEY=
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_DEFAULT_MODEL=anthropic/claude-sonnet-4.5
OPENROUTER_MAX_TOKENS=4096
OPENROUTER_HTTP_REFERER=http://localhost:3000
OPENROUTER_X_TITLE=BlowCortex

# === Clerk ===
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_JWT_PUBLIC_KEY=
CLERK_WEBHOOK_SECRET=

# === Database ===
DATABASE_URL=
DATABASE_DIRECT_URL=

# === Redis ===
REDIS_URL=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# === Zep ===
ZEP_API_KEY=
ZEP_API_URL=https://api.getzep.com

# === Inngest ===
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=

# === Observability ===
LANGFUSE_PUBLIC_KEY=
LANGFUSE_SECRET_KEY=
LANGFUSE_HOST=https://cloud.langfuse.com
SENTRY_DSN_WEB=
SENTRY_DSN_API=
SENTRY_DSN_MOBILE=
SENTRY_ORG=
SENTRY_AUTH_TOKEN=

# === Google (Phase 1 Sprint 2+) ===
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI_DEV=http://localhost:3100/v1/connectors/google/oauth/callback
GCP_PROJECT_ID=
GMAIL_PUBSUB_TOPIC=

# === Slack (Phase 2) ===
SLACK_CLIENT_ID=
SLACK_CLIENT_SECRET=
SLACK_SIGNING_SECRET=

# === Notion (Phase 2) ===
NOTION_CLIENT_ID=
NOTION_CLIENT_SECRET=
NOTION_REDIRECT_URI=

# === Storage ===
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
R2_ENDPOINT=
```

---

## Checklist de santé des services

After setup, verify each service manually:

- [ ] OpenRouter: `curl` `/api/v1/models` and `/api/v1/chat/completions`, get a response
- [ ] Clerk: sign up with a test email, receive verification
- [ ] Postgres: connect with `psql` or Drizzle Studio, run `SELECT 1`
- [ ] Redis: connect with `redis-cli`, run `PING`
- [ ] Zep: create a test user via SDK, confirm it appears
- [ ] Inngest: run local dev server, send a test event, see it in the dashboard
- [ ] Langfuse: create a manual trace via SDK, see it in the dashboard
- [ ] Sentry: throw a test error, see it captured
- [ ] Google OAuth: complete OAuth flow with your test account
- [ ] R2: upload a test file, download it

If all 10 pass, you're ready to hand off to Claude Code.

---

## Résumé des coûts

### Développement (dev solo, aucun utilisateur)
- OpenRouter: $2-15/month (your testing, mix of cheap + premium models)
- Everything else: $0 (free tiers)
- **Total: $2-15/month**

### Bêta (50 utilisateurs)
- OpenRouter: $250-700 (~$5-15/user, with tier-routing on cheap models for parsing/classification)
- Clerk: $0 (under 10K MAU)
- Supabase Pro: $25
- Upstash: ~$10
- Zep Start: $49
- Inngest Hobby: $20
- Langfuse: $0 (under 50K traces)
- Sentry: $0 (under 5K errors)
- R2: $0
- Vercel + Railway: ~$30
- **Total: ~$390-850/month**

### Production (1000 utilisateurs)
- OpenRouter: $5000-15000 (post-optimization per PRD §10 — significant savings vs. Anthropic-only thanks to model routing)
- Clerk: $25 (+ overage)
- Supabase Pro: $25-100
- Redis: ~$100
- Zep Pro: $299
- Inngest Pro: $50-200
- Langfuse Core: $59
- Sentry Team: $26
- R2: ~$20
- Deployment: ~$100
- **Total: ~$5700-15800/month, ~85-95% LLM**

Which is why PRD Section 5 (cost optimization) is so critical.

---

## Dépannage

### Problème : le webhook Clerk ne se déclenche pas en local

Clerk can't reach `localhost`. Use ngrok or Cloudflare Tunnel:
```bash
cloudflared tunnel --url http://localhost:3100
```
Use the generated URL as the Clerk webhook target.

### Problème : Google OAuth renvoie l'avertissement "unverified app"

Expected in dev. Users must click "Advanced → Go to BlowCortex (unsafe)". Fine for test users. Will go away after verification (required for production).

### Problème : Gmail Pub/Sub renvoie 403 lors de la publication

Grant the `gmail-api-push@system.gserviceaccount.com` service account `roles/pubsub.publisher` on the topic (see step in Section 9).

### Problème : les entités Zep ne sont pas extraites

Zep extracts entities asynchronously. Give it 10-30 seconds after adding a message. Verify via the dashboard → Graph view.

### Problème : les événements Inngest ne déclenchent pas les fonctions

Three common causes:
1. Local dev server not running (`npx inngest-cli dev`)
2. Function not registered in the `/api/inngest` endpoint
3. Event name mismatch between producer and consumer

Check Inngest local dashboard at `http://localhost:8288`.

### Problème : les coûts LLM explosent en dev

Check Langfuse to find which call is expensive. Common culprits:
- Forgot to add cache_control markers (only effective on cache-supporting models — see PRD §10.3)
- Looping agent without step limits
- Routing classification/parsing tasks to a premium model (e.g. `anthropic/claude-opus-4.5`) when a cheap one (e.g. `openai/gpt-4o-mini`) would suffice
- `OPENROUTER_MAX_TOKENS` set too high

Safety nets to set in this order:
1. **Per-key credit limit** in https://openrouter.ai/settings/keys (hard cap).
2. **`OPENROUTER_MAX_TOKENS`** in `.env.local` (default 4096 — lower it for dev).
3. **User budget** enforced in `packages/llm` per PRD §10.

---

End of external services setup guide.
