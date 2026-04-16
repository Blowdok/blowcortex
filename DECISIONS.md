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
- **Commencé le :** _à remplir par l'agent implémentateur au premier lancement_
- **Implémentateur principal :** Claude Code (agent autonome avec supervision humaine)
- **Superviseur humain :** _à remplir par le propriétaire du projet_

---

## Entrées

<!-- New entries go below this line. Newest at the top. -->

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
