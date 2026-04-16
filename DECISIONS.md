# Journal des décisions

Journal courant des décisions d'architecture, des ambiguïtés rencontrées et des écarts par rapport au PRD.

**Format de chaque entrée :**
- Date (YYYY-MM-DD)
- Décision ou observation
- Justification
- Alternatives envisagées
- Statut (active / superseded / reverted)

Les entrées sont append-only. Si une décision est annulée, ajoutez une nouvelle entrée qui remplace l'ancienne au lieu de modifier l'historique.

---

## Métadonnées du projet

- **Projet :** BlowCortex
- **Commencé le :** 2026-04-16
- **Implémentateur principal :** Agent de code autonome (Opus 4.6) avec supervision humaine
- **Superviseur humain :** Blowdok (leconstantbillal@gmail.com)

---

## Entrées

<!-- New entries go below this line. Newest at the top. -->

### Sprint 1 livré — résumé et observations

**Date :** 2026-04-16
**Décision :** Le Sprint 1 (Fondations) est livré dans la branche `feature/p1-s1-foundation`. Tous les critères PRD §11 Sprint 1 sont satisfaits au niveau code/configuration. Les validations runtime (Clerk login réel, application des migrations Postgres, connexion Redis live, connexion Zep, déploiement Vercel/Railway) sont volontairement reportées : elles nécessitent soit des credentials externes à fournir par le superviseur, soit un démarrage local explicite (`pnpm docker:up && pnpm db:migrate`), soit une étape de Sprint 6 (déploiement).

**Ce qui a été construit :**
- Monorepo pnpm v10 + Turborepo v2 avec 12 packages workspace.
- `packages/config` (presets TypeScript / ESLint flat / Prettier / Tailwind v4).
- `packages/core` (validation env Zod, erreurs typées, types de domaine — 5 tests verts).
- `packages/db` (schéma Drizzle 8 tables fidèle au PRD §5.1, trigger SQL append-only sur `audit_log`, scripts generate + migrate — 4 tests verts).
- `packages/{graph,agents,connectors,llm,ui}` : squelettes documentés.
- `apps/web` (Next.js 15 App Router, Clerk middleware + provider, pages auth + dashboard, Tailwind v4).
- `apps/api` (Hono + endpoint `/health` + middlewares CORS/secure/error — 2 tests d'intégration verts).
- `apps/workers` (serveur Inngest local + endpoint `/api/inngest`).
- `apps/mobile` (squelette Expo SDK 52).
- `infra/docker/docker-compose.yml` (Postgres 16 + Redis Stack 7 avec healthchecks et init scripts).
- `infra/migrations/0001_audit_log_append_only.sql`.
- `.github/workflows/ci.yml` (lint + typecheck + test + build).
- `vercel.json` et `railway.json` prêts pour Sprint 6.

**Vérifications locales :**
- `pnpm install` : OK (1161 paquets).
- `pnpm typecheck` : OK (15/15 tasks).
- `pnpm lint` : OK (15/15 tasks).
- `pnpm test` : OK (15/15 tasks ; 11 tests Vitest verts au total : 5 core + 4 db + 2 api).
- `pnpm build` : OK (11/11 tasks ; Next.js produit 5 routes : `/`, `/_not-found`, `/dashboard`, `/sign-in/[[...sign-in]]`, `/sign-up/[[...sign-up]]`).

**Écarts par rapport au PRD :**
- Préfixe variable env : `BLOWCORTEX_*` (et non `BlowCortex_*` casse mixte du PRD §4.2). Cohérent avec `.env.example` actuel.
- pnpm 10 (au lieu de 9 demandé) — application de la directive CLAUDE.md « toujours utiliser les dernières versions ».
- React 19.1.4 (et non 19.0.0) imposé par la peer-dep `@clerk/clerk-react@5.61.3`.
- Override pnpm `@types/react` → 19.1.4 pour éviter les divergences de types React.
- Tailwind 4.1.18 (au lieu de 4.0.0) à cause d'un bug PostCSS dans 4.0.0.

**Observations de l'agent sur son propre travail :**
- L'écriture parallèle de plusieurs fichiers (Edit/Write) accélère significativement, mais les Edits déclarent parfois `File has not been read yet` lorsqu'un hook tiers a modifié le fichier entre temps : il faut alors Read d'abord. Constaté plusieurs fois sur `apps/api/package.json`, `apps/mobile/package.json`, `.env.local`.
- L'incompatibilité Tailwind 4.0.0 et le bug Clerk peer-dep React 19.0.0 ont consommé deux itérations de build chacune. Approche corrigée : valider les versions clés (React, Tailwind) en amont via context7 lors du Sprint 2.
- ESLint flat config + typescript-eslint v8 : `allowDefaultProject` n'autorise PAS les globs `**` ; les tests doivent être inclus dans `tsconfig.json`. La séparation `tsconfig.json` (lint + IDE, inclut tests) / `tsconfig.build.json` (build, exclut tests) est la solution propre adoptée pour tous les packages.
- L'audit_log append-only n'est pas garanti par Drizzle natif : le trigger SQL `0001_audit_log_append_only.sql` doit être appliqué manuellement après la migration initiale Drizzle. À automatiser au Sprint 2 dans le pipeline `db:migrate`.

**Ce qui reste à faire avant Sprint 2 :**
1. Superviseur : fournir vraies clés Clerk dans `.env.local`.
2. Superviseur : créer compte Zep Cloud + clé `ZEP_API_KEY` (Sprint 2).
3. Superviseur : créer compte OpenRouter + clé `OPENROUTER_API_KEY` (Sprint 3).
4. Superviseur : créer projet Google Cloud + OAuth Gmail (Sprint 2).
5. Tester localement le flux complet : `pnpm docker:up`, `pnpm db:migrate`, `pnpm dev`, vérifier `curl localhost:3100/health` et `localhost:3000`.
6. Approuver le merge de `feature/p1-s1-foundation` vers `main`.

**Statut :** active

---

### Sprint 1 démarré en mode dev local minimal (Postgres + Redis via docker)

**Date :** 2026-04-16
**Décision :** Le Sprint 1 démarre sans clés Clerk, Zep, OpenRouter, Langfuse, Sentry ni Google. Postgres 16 et Redis Stack 7 tournent en local via `infra/docker/docker-compose.yml`. Les variables `DATABASE_URL`, `DATABASE_DIRECT_URL` et `REDIS_URL` pointent vers les services Docker locaux. Une `ENCRYPTION_KEY` AES-256 a été générée et placée dans `.env.local`.
**Justification :** Demande explicite du superviseur ce jour : « va, utilise du local docker pour Postgres+Redis et zappe le reste pour Sprint 1 ». Permet de démarrer l'implémentation sans bloquer sur des comptes tiers. Les critères d'acceptation Sprint 1 dépendant des services externes (Clerk sign-in fonctionnel, validation credentials Zep) seront marqués `(en attente clés)` et finalisés dès que les clés sont fournies.
**Alternatives envisagées :**
- Attendre toutes les clés avant de démarrer : bloque toute progression.
- Tout mocker : crée du code jetable et masque les vrais points d'intégration.
**Statut :** active

---

### Branche dédiée `feature/p1-s1-foundation` pour le Sprint 1

**Date :** 2026-04-16
**Décision :** Le travail Sprint 1 est isolé sur la branche `feature/p1-s1-foundation`. Merge sur `main` après validation humaine.
**Justification :** Évite que `main` reflète un état intermédiaire pendant l'implémentation et facilite la revue.
**Alternatives envisagées :** Travail direct sur `main` (rejeté — pas de point de revue clair).
**Statut :** active

---

### Adoption du préfixe `BLOWCORTEX_*` pour les variables d'environnement

**Date :** 2026-04-16
**Décision :** Les variables d'environnement de l'app utilisent le préfixe `BLOWCORTEX_` (`BLOWCORTEX_BASE_URL`, `BLOWCORTEX_API_URL`). Conforme au choix actuel du superviseur dans `.env.example`.
**Justification :** Cohérent avec le nom du produit ; évite la collision avec d'autres outils nommés "Cortex" ; lisible côté shell ; aligné sur la sémantique du PRD §4.2 (qui utilisait `BlowCortex_*` mais en casse mixte non standard pour bash).
**Alternatives envisagées :** `CORTEX_*` (préfixe initial, retiré), `BC_*` (trop court et ambigu).
**Statut :** active

---

### Application des défauts pour les questions ouvertes du PRD §16

**Date :** 2026-04-16
**Décision :** Sans réponse explicite du superviseur aux 5 questions ouvertes du PRD Section 16, l'implémentation applique les défauts indiqués dans la même section :
1. Modèles OpenRouter par défaut : `anthropic/claude-sonnet-4.5` (général), `anthropic/claude-opus-4.5` (raisonnement lourd), `openai/gpt-4o-mini` ou `google/gemini-2.5-flash` (classification/extraction).
2. Zep Cloud supposé disponible en région UE.
3. Cible de lancement : UE (RGPD strict).
4. Design from scratch avec valeurs par défaut shadcn/ui (couleur primaire `#6366f1`, font Geist, radius 0.75rem).
5. Jeu de test d'engagements (Sprint 3) : à synthétiser via OpenRouter.
**Justification :** Le PRD lui-même autorise ces défauts en l'absence de réponse, ce qui débloque le démarrage.
**Statut :** active — à réviser dès que le superviseur confirme ou contredit une question.

---

### Versions outillage : Node 22 LTS et pnpm 10

**Date :** 2026-04-16
**Décision :** Le projet est verrouillé sur Node 22 (déjà installé : v22.17.1) et pnpm 10 (déjà installé : 10.18.2) via `.nvmrc` et le champ `packageManager` du `package.json` racine.
**Justification :** PRD §2 exige Node ≥ 20 et pnpm ≥ 9 ; CLAUDE.md exige les dernières versions npm. pnpm 10 améliore les performances et la résolution de workspaces. Node 22 est la LTS active.
**Statut :** active

---

### Ambiguïtés constatées dans le PRD (notées pour référence)

**Date :** 2026-04-16
**Observation :** Lors de la lecture initiale du PRD :
1. **Section 2 stack** mentionne « Neo4j 5+ (Aura) » comme non négociable, alors que **Section 14.1** dit « Neo4j optional — use Zep cloud for dev » et la décision OpenRouter+Zep a remplacé Neo4j. → **Résolution :** suivre l'esprit du DECISIONS existant (Zep gère Neo4j en interne, pas de déploiement Neo4j séparé en Phase 1).
2. **Section 4.2** liste `BlowCortex_BASE_URL` (casse mixte, peu valide en bash strict) ; `.env.example` a corrigé en `BLOWCORTEX_*`. → Suivons `.env.example`.
3. **Section 4.2** définit `ANTHROPIC_*` et `CLERK_PUBLISHABLE_KEY` (côté serveur), alors que `external-services-setup.md` et la décision OpenRouter exigent `OPENROUTER_*` et `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`. → Suivons les sources les plus récentes (`.env.example` + DECISIONS).
4. **Section 5.1** définit la table `engagements` mais aucune table `messages` ; pourtant la Section 8.1 dit « Store metadata in Postgres (messages table — defined by impl AI) ». → À définir au Sprint 2.
5. Le PRD ne précise pas la **stratégie de chiffrement** des tokens (algorithme AES-256-GCM choisi, IV stocké dans le payload). → Décision technique au Sprint 2.
**Statut :** observations actives, à lever au fur et à mesure des sprints.

---

### Lecture initiale du PRD effectuée. Démarrage du Sprint 1.

**Date :** 2026-04-16
**Décision :** Le PRD a été lu intégralement (1117 lignes), ainsi que `external-services-setup.md`, `README.md` et `CLAUDE.md`. Le Sprint 1 démarre.
**Statut :** active

---

### Passage du fournisseur LLM Anthropic direct vers OpenRouter

**Date:** 2026-04-16
**Decision:** Le fournisseur LLM unique du projet devient **OpenRouter** (`https://openrouter.ai/api/v1`). L'API Anthropic n'est plus appelée directement ; on passe par les slugs OpenRouter (`anthropic/claude-sonnet-4.5`, `anthropic/claude-opus-4.5`, etc.). La liste des modèles disponibles est récupérée dynamiquement à l'exécution via `GET /api/v1/models` et exposée à l'utilisateur sous forme de menu déroulant ; aucun ID de modèle n'est codé en dur dans la logique métier. `max_tokens` est configurable par agent (plafonné par `OPENROUTER_MAX_TOKENS`).
**Rationale:**
- **Coût** : OpenRouter permet de router les tâches simples (classification, parsing, extraction d'engagements évidents) vers des modèles peu coûteux (`openai/gpt-4o-mini`, `google/gemini-2.5-flash`) et de réserver les modèles haut de gamme aux briefings stratégiques. Estimation : -50 à -70 % du budget LLM mensuel à charge utilisateur équivalente.
- **Souplesse** : changer de modèle (Claude → GPT → Gemini → Llama) devient un changement de slug, pas un changement de SDK ni de wrapper.
- **Multi-fournisseurs natif** : fallback automatique si un fournisseur tombe, choix possible des fournisseurs respectant la non-rétention/no-training pour la conformité RGPD.
- **API OpenAI-compatible** : on réutilise le SDK `openai` officiel en surchargeant `baseURL` — pas de dépendance supplémentaire.
- **Métadonnées riches** : `/api/v1/models` renvoie `context_length`, `pricing.prompt`, `pricing.completion`, `top_provider.max_completion_tokens`, `supported_parameters` — exactement ce qu'il faut pour valider la config et afficher les coûts dans l'UI.
**Alternatives considered:**
- *Anthropic SDK direct* (choix initial du PRD v1) : verrou fournisseur, coûts plus élevés, pas de dropdown de modèle.
- *LiteLLM en self-hosted* : équivalent fonctionnel, mais infra supplémentaire à maintenir et observabilité moins fine que OpenRouter.
- *Vercel AI Gateway* : intéressant mais moins de modèles + écosystème plus jeune que OpenRouter.
- *Appels directs multi-SDK (Anthropic + OpenAI + Google)* : explosion combinatoire des wrappers, abandon.
**Impact sur le PRD:**
- Section 2 (stack) : ligne « LLM provider » mise à jour.
- Section 4.2 (env vars) : `ANTHROPIC_*` → `OPENROUTER_*` (clé, base URL, modèle par défaut, max_tokens, headers d'attribution).
- Section 5.2 / 7.x : `model: "haiku" | "sonnet" | "opus"` → `model: string` (slug OpenRouter validé contre le registre).
- Section 10 : nouveau wrapper `callLlm` basé sur le SDK `openai`, nouveau registre dynamique `fetchModelRegistry` rafraîchi toutes les 6 h.
- Section 13 : ZDR Anthropic → filtre OpenRouter sur fournisseurs sans rétention.
- `external-services-setup.md` Section 1 entièrement réécrite pour OpenRouter.
**Status:** active

---

<!-- Example of what a good entry looks like:

### Use Drizzle over Prisma

**Date:** 2026-04-20
**Decision:** Use Drizzle ORM for all database access.
**Rationale:** Drizzle has a thinner abstraction, better TypeScript inference, and smaller bundle size. Prisma's query engine adds a binary dependency we don't need. Drizzle's SQL-first approach makes debugging easier.
**Alternatives considered:** Prisma (industry standard but heavier), Kysely (pure query builder, less schema management), raw SQL with pg (too much boilerplate).
**Status:** active

-->
