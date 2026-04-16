# CONFIG.md — Guide de configuration de `.env.local`

> Document d'accompagnement en français pour remplir `.env.local` pas à pas.
> Complète [`external-services-setup.md`](./external-services-setup.md) (plus exhaustif mais en partie en anglais).
>
> **Règle d'or :** `.env.local` est ignoré par git (`.gitignore:37`). **Ne jamais le committer**, ne jamais coller ses secrets dans une PR ou un message.

---

## 1. État actuel de votre `.env.local`

Analyse au **2026-04-16** après votre dernière modification.

### ✅ Déjà correctement rempli

| Variable | Utilité | Sprint |
| --- | --- | --- |
| `NODE_ENV`, `BLOWCORTEX_BASE_URL`, `BLOWCORTEX_API_URL` | Cœur | Sprint 1 |
| `ENCRYPTION_KEY` (AES-256 généré) | Chiffrement tokens OAuth | Sprint 2 |
| `OPENROUTER_API_KEY`, `OPENROUTER_BASE_URL`, `OPENROUTER_HTTP_REFERER`, `OPENROUTER_X_TITLE`, `OPENROUTER_DEFAULT_MODEL`, `OPENROUTER_MAX_TOKENS` | LLM | Sprint 3 |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` | Auth web + API | Sprint 1 |
| `DATABASE_URL`, `DATABASE_DIRECT_URL` | Postgres (docker local) | Sprint 1 |
| `REDIS_URL` | Redis (docker local) | Sprint 1 |
| `ZEP_API_KEY`, `ZEP_API_URL` | Graphe temporel | Sprint 2+ |
| `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY` | Orchestration événementielle | Sprint 2+ |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (optionnel) | Supabase côté client | Sprint 6 si vous migrez vers Supabase |

### ⚠️ Erreurs détectées — à corriger

#### A. `CLERK_JWT_PUBLIC_KEY`

**Vous avez mis** votre `pk_test_…` (la clé publique Clerk, utilisée côté navigateur).

**Ce qui est attendu :** une **clé publique RSA au format PEM**, qui commence par :

```
-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA…
…
-----END PUBLIC KEY-----
```

**Où l'obtenir :**

1. Allez sur <https://dashboard.clerk.com> → votre application **BlowCortex** → **Configure** → **API keys**.
2. Section **JWT templates** (ou directement **Advanced → JWT public key**).
3. Cliquez sur **Copy public key** (format PEM).
4. Collez la valeur **entre guillemets doubles** dans `.env.local`, en gardant les sauts de ligne codés avec `\n` :

```bash
CLERK_JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkq…\n…\n-----END PUBLIC KEY-----"
```

**À quoi ça sert :** notre API Hono (`apps/api`) vérifie les JWT émis par Clerk pour authentifier les requêtes. Sans cette clé, `/v1/*` refusera toutes les requêtes authentifiées (Sprint 2+).

**Non bloquant pour Sprint 1** (seule l'UI `apps/web` tourne, et elle parle à Clerk directement).

---

#### B. `CLERK_WEBHOOK_SECRET`

**Vous avez mis** votre `sk_test_…` (la Clerk Secret Key). Ce n'est pas la même chose.

**Ce qui est attendu :** un secret de webhook qui commence par **`whsec_…`**.

**Où l'obtenir :**

1. Dashboard Clerk → **Webhooks** → **Add Endpoint**.
2. **Endpoint URL** : en local, utilisez un tunnel (sinon Clerk ne peut pas joindre `localhost`) :
   ```bash
   cloudflared tunnel --url http://localhost:3100
   # → vous donne une URL https://xxxxx.trycloudflare.com
   ```
   Collez `https://xxxxx.trycloudflare.com/v1/webhooks/clerk` dans Clerk.
3. **Subscribe to events** : cochez `user.created`, `user.updated`, `user.deleted`.
4. **Create** → en bas du détail, copiez le **Signing secret** (`whsec_…`).
5. Dans `.env.local` :

```bash
CLERK_WEBHOOK_SECRET=whsec_VOTRE_SECRET_ICI
```

**À quoi ça sert :** Clerk nous envoie un webhook quand un utilisateur s'inscrit pour qu'on crée sa ligne dans `users` (Postgres). Sans ça, les nouveaux utilisateurs ne seront pas connus du backend.

**Non bloquant pour Sprint 1** (le webhook handler sera implémenté au Sprint 2).

---

## 2. À remplir selon les sprints à venir

### Sprint 2 — Connecteur Gmail (priorité haute, dès que vous lancez le Sprint 2)

#### `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

1. Allez sur <https://console.cloud.google.com>.
2. Créez un projet nommé **BlowCortex** (ou sélectionnez-en un existant).
3. **APIs & Services → Library** : activez
   - **Gmail API**
   - **Google Calendar API**
   - **Google People API** (enrichissement contacts)
4. **APIs & Services → OAuth consent screen** :
   - User type : **External**
   - App name : **BlowCortex**
   - User support email + Developer contact : votre email
   - **Scopes** : ajoutez
     - `https://www.googleapis.com/auth/gmail.modify`
     - `https://www.googleapis.com/auth/calendar`
     - `https://www.googleapis.com/auth/userinfo.email`
     - `https://www.googleapis.com/auth/userinfo.profile`
   - **Test users** : ajoutez votre email Gmail (nécessaire en mode dev).
   - **Save**.
5. **Credentials → Create Credentials → OAuth Client ID** :
   - Type : **Web application**
   - Name : **BlowCortex Web**
   - **Authorized JavaScript origins** : `http://localhost:3000`
   - **Authorized redirect URIs** : `http://localhost:3100/v1/connectors/google/oauth/callback`
   - **Create**.
6. Copiez le **Client ID** (`xxx.apps.googleusercontent.com`) et le **Client secret** (`GOCSPX-…`).

Dans `.env.local` :

```bash
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx
# Les deux URIs sont déjà pré-remplies — ne pas modifier en dev.
```

#### `GCP_PROJECT_ID`, `GMAIL_PUBSUB_TOPIC` (optionnels Sprint 2)

Nécessaires uniquement pour les **webhooks d'email en temps réel** (push au lieu de polling). Si vous êtes OK avec un polling toutes les 2 minutes pour commencer, laissez vides.

Sinon :

1. **GCP Console → Pub/Sub → Create topic** → nom `blowcortex-gmail-updates`.
2. **Create subscription** → type **Push** → URL : votre tunnel HTTPS + `/v1/webhooks/gmail-pubsub`.
3. Donnez à `gmail-api-push@system.gserviceaccount.com` le rôle **Pub/Sub Publisher** sur le topic.
4. Valeurs :

```bash
GCP_PROJECT_ID=blowcortex-xxxxx   # le project ID de votre projet GCP
GMAIL_PUBSUB_TOPIC=projects/blowcortex-xxxxx/topics/blowcortex-gmail-updates
```

---

### Sprint 3 — Observabilité LLM (Langfuse)

#### `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`

Langfuse trace chaque appel LLM (coût, latence, tokens, prompts/outputs) — indispensable pour maîtriser les coûts.

1. <https://cloud.langfuse.com> → sign up.
2. **New project** → nom **BlowCortex**.
3. **Settings → API Keys → Create key pair**.
4. Copiez les deux clés :

```bash
LANGFUSE_PUBLIC_KEY=pk-lf-xxx
LANGFUSE_SECRET_KEY=sk-lf-xxx
# LANGFUSE_HOST est déjà rempli (cloud.langfuse.com)
```

**Coût :** 50 000 traces/mois gratuites. Largement suffisant pour la bêta.

---

### Sprint 6 — Error tracking (Sentry) et stockage (R2)

#### `SENTRY_DSN_WEB`, `SENTRY_DSN_API`, `SENTRY_DSN_MOBILE`, `SENTRY_ORG`, `SENTRY_AUTH_TOKEN`

1. <https://sentry.io> → sign up.
2. Créez **3 projets séparés** :
   - Type **Next.js** → `cortex-web` (=> `SENTRY_DSN_WEB`)
   - Type **Node.js** → `cortex-api` (=> `SENTRY_DSN_API`)
   - Type **React Native** → `cortex-mobile` (=> `SENTRY_DSN_MOBILE`)
3. Pour chaque projet : **Settings → Client Keys (DSN)** → copiez le DSN (format `https://xxx@oXXX.ingest.sentry.io/XXX`).
4. **SENTRY_ORG** : votre slug d'organisation Sentry (visible dans l'URL du dashboard).
5. **SENTRY_AUTH_TOKEN** : **Settings → Auth Tokens → Create** avec scopes `project:releases`, `project:read`.

```bash
SENTRY_DSN_WEB=https://xxx@oXXX.ingest.sentry.io/1111
SENTRY_DSN_API=https://xxx@oXXX.ingest.sentry.io/2222
SENTRY_DSN_MOBILE=https://xxx@oXXX.ingest.sentry.io/3333
SENTRY_ORG=votre-org
SENTRY_AUTH_TOKEN=sntrys_xxx
```

**Coût :** 5 000 erreurs/mois gratuites.

#### `R2_*` (Cloudflare R2 — stockage de fichiers)

Nécessaire si vos utilisateurs uploadent des fichiers ou quand la Forge (Phase 3) génère des artefacts.

1. <https://dash.cloudflare.com> → créez un compte (gratuit).
2. **R2 → Create bucket** → nom `blowcortex-artifacts-dev`.
3. **R2 → Manage API Tokens → Create API token** → permissions **Object Read & Write**.
4. Copiez les credentials :

```bash
R2_ACCOUNT_ID=xxx            # visible dans l'URL de votre dashboard R2
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET=blowcortex-artifacts-dev
R2_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com
```

**Coût :** 10 GB gratuits, egress gratuit (très économique vs S3).

---

### Phase 2 — Connecteurs supplémentaires (pas avant sprint 7)

#### Slack (`SLACK_*`)

1. <https://api.slack.com/apps> → **Create New App** → **From scratch** → nom **BlowCortex**.
2. **OAuth & Permissions → Scopes → Bot Token Scopes** : `channels:history`, `channels:read`, `groups:history`, `groups:read`, `im:history`, `im:read`, `chat:write`, `users:read`, `users:read.email`.
3. **User Token Scopes** : `search:read`.
4. **Redirect URLs** : `https://VOTRE_DOMAINE/v1/connectors/slack/oauth/callback`.
5. **Event Subscriptions** : `message.channels`, `message.im`, `message.groups`.
6. **Basic Information** → copiez Client ID, Client Secret, Signing Secret.

```bash
SLACK_CLIENT_ID=xxx
SLACK_CLIENT_SECRET=xxx
SLACK_SIGNING_SECRET=xxx
```

#### Notion (`NOTION_*`)

1. <https://www.notion.so/my-integrations> → **New integration** → type **Public**.
2. Capabilities : **Read content**, **Update content**, **Read user information**.
3. OAuth : ajoutez votre callback URL.
4. Copiez Client ID et Secret.

```bash
NOTION_CLIENT_ID=xxx
NOTION_CLIENT_SECRET=xxx
NOTION_REDIRECT_URI=https://VOTRE_DOMAINE/v1/connectors/notion/oauth/callback
```

---

## 3. Note sur Supabase

Vous avez renseigné `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Ces deux valeurs vont servir si vous voulez utiliser les **Supabase client libraries** (auth anonyme, realtime, storage) **depuis le navigateur**. Pour l'instant BlowCortex n'utilise pas Supabase-auth (on a Clerk à la place), donc elles ne sont pas consommées par le code du Sprint 1.

### Si vous voulez migrer `DATABASE_URL` vers Supabase (au lieu du docker local)

1. Dashboard Supabase → **Project Settings → Database → Connection string**.
2. **Transaction mode** (pooled) → copiez l'URL → c'est votre nouveau `DATABASE_URL`.
3. **Session mode** (direct) → copiez l'URL → c'est votre nouveau `DATABASE_DIRECT_URL`.
4. Ensuite : `pnpm db:generate && pnpm db:migrate` appliquera le schéma sur Supabase.

**Recommandation Sprint 1–3 :** garder le docker local (plus rapide, aucun coût, pas de latence réseau). Migrer vers Supabase au Sprint 5–6, au moment de préparer le déploiement.

---

## 4. Note sur `OPENROUTER_DEFAULT_MODEL`

Vous avez mis `deepseek/deepseek-chat` comme modèle par défaut (économique, ~$0.14 / 1M tokens). C'est un choix valide pour la phase de développement : les appels quotidiens coûteront centimes plutôt que euros.

**Attention** pour les sprints 3+ :

- L'**Engagement Detector** (PRD §7.1) fonctionnera très bien avec `deepseek/deepseek-chat`.
- Le **Meeting Briefer** (PRD §7.2) donne de meilleurs résultats avec un modèle plus puissant pour les réunions stratégiques. Vous pourrez surcharger ce modèle dans la configuration de l'agent (`agents.config.model`) sans changer le défaut.
- Le défaut initial du PRD était `anthropic/claude-sonnet-4.5`. C'est un compromis qualité/prix que j'ai noté dans DECISIONS.md.

**Recommandation :** gardez `deepseek/deepseek-chat` jusqu'à la première campagne de tests qualité (Sprint 3), puis évaluez si vous upgradez le Briefer vers `anthropic/claude-sonnet-4.5` ou `google/gemini-2.5-pro`.

---

## 5. Checklist rapide avant Sprint 2

Avant de me dire « Go Sprint 2 », vérifier :

- [ ] Corriger `CLERK_JWT_PUBLIC_KEY` (clé PEM RSA, pas votre pk_test)
- [ ] Corriger `CLERK_WEBHOOK_SECRET` (doit commencer par `whsec_`, pas votre sk_test)
- [ ] Renseigner `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`
- [ ] Optionnel mais recommandé : `LANGFUSE_PUBLIC_KEY` + `LANGFUSE_SECRET_KEY` (vous gagnerez de la visibilité dès que les agents appellent l'LLM)

Avant production (Sprint 6) :

- [ ] Sentry DSN + auth token
- [ ] Cloudflare R2
- [ ] Optionnel : migration `DATABASE_URL` vers Supabase/Neon

---

## 6. Commandes utiles pour vérifier vos clés

```bash
# Tester OpenRouter (liste des modèles disponibles)
curl https://openrouter.ai/api/v1/models \
  -H "Authorization: Bearer $OPENROUTER_API_KEY" | jq '.data[0:3]'

# Tester l'envoi d'un prompt court (Deepseek, très peu coûteux)
curl https://openrouter.ai/api/v1/chat/completions \
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"deepseek/deepseek-chat","max_tokens":32,"messages":[{"role":"user","content":"ping"}]}'

# Tester Zep (liste de vos users)
curl https://api.getzep.com/api/v2/users \
  -H "Authorization: Api-Key $ZEP_API_KEY"

# Tester Postgres local (après pnpm docker:up)
docker compose -f infra/docker/docker-compose.yml ps
psql "$DATABASE_URL" -c "SELECT 1;"

# Tester Redis local
redis-cli -u "$REDIS_URL" PING
# → PONG
```

---

## 7. En cas de doute

1. Consultez d'abord [`external-services-setup.md`](./external-services-setup.md) (plus détaillé).
2. Regardez les erreurs au boot : `@blowcortex/api` plante **de façon explicite** si une variable est invalide ou manquante — lisez le message Zod, il indique la variable exacte.
3. Vérifiez [`DECISIONS.md`](./DECISIONS.md) pour les choix d'architecture passés.

---

_Document mis à jour au fil des sprints. Toute nouvelle variable ajoutée dans `.env.example` aura son paragraphe ici._
