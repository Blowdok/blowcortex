# BlowCortex

> Un système d'IA qui observe votre vie professionnelle, comprend votre contexte et agit en votre nom.

**Statut :** 🚧 Avant Sprint 1 — dépôt initialisé, pas encore implémenté.
**Phase actuelle :** Phase 1 (MVP) — objectif bêta en 12 semaines.
**Implémentateur principal :** agent de code autonome avec supervision humaine.

---

## Qu'est-ce que BlowCortex ?

BlowCortex est un système d'IA proactif pour les professionnels qui jonglent avec de nombreux projets, conversations et engagements. Contrairement aux chatbots (qui attendent vos demandes) ou aux frameworks d'agents (que vous devez configurer), BlowCortex **observe en arrière-plan et agit quand c'est utile**.

Il excelle dans trois choses :

1. **Il se souvient.** BlowCortex ingère en continu vos emails, votre calendrier, Slack et vos documents, afin de construire un graphe de connaissances temporel de votre contexte de travail. Il ne se contente pas de stocker ce que vous écrivez : il comprend qui, quoi, quand et pourquoi.

2. **Il anticipe.** Quinze minutes avant chaque réunion, vous recevez un briefing : qui participe, ce qui a été décidé la dernière fois, ce qui reste ouvert. Quand vous promettez à quelqu'un de revenir vers lui vendredi, BlowCortex s'en souvient et vous relance jeudi soir si rien n'a avancé.

3. **Il agit.** Avec votre approbation (ou, à terme, de façon autonome selon votre choix), BlowCortex rédige l'email de suivi, crée le ticket, met à jour le document. Le niveau de confiance progresse à mesure que vous gagnez en confiance dans son jugement.

La spécification produit complète, y compris l'architecture technique, les modèles de données et le plan d'implémentation, se trouve dans [`PRD.md`](./PRD.md). Lisez-la.

---

## Carte de la documentation

Ce dépôt contient plusieurs documents de référence. Ils sont organisés par public :

| Document                                                     | Public                        | Objectif                                                            |
| ------------------------------------------------------------ | ----------------------------- | ------------------------------------------------------------------- |
| [`PRD.md`](./PRD.md)                                         | Implémentateur IA, ingénieurs | Spécification produit et technique complète. Source de vérité.      |
| [`external-services-setup.md`](./external-services-setup.md) | Humains                       | Comment configurer Clerk, Zep, OpenRouter, etc.                     |
| [`DECISIONS.md`](./DECISIONS.md)                             | Tout le monde                 | Journal courant des décisions d'architecture, ambiguïtés et écarts. |
| [`README.md`](./README.md)                                   | Tout le monde                 | Vous êtes ici. Document d'orientation.                              |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md)                       | Ingénieurs                    | Diagrammes système et vue technique détaillée. Créé au Sprint 6.    |
| [`CONTRIBUTING.md`](./CONTRIBUTING.md)                       | Contributeurs                 | Comment travailler sur ce codebase. Créé au Sprint 6.               |

---

## Démarrage rapide

### Prérequis

- Node.js 20+
- pnpm 9+
- Docker (pour Postgres + Redis en local)
- Comptes + clés API pour les services dans [`external-services-setup.md`](./external-services-setup.md)

### Première configuration

```bash
# Cloner et entrer dans le dossier
git clone <https://github.com/Blowdok/blowcortex.git && cd blowcortex

# Installer les dépendances
pnpm install

# Copier le modèle d'environnement et renseigner vos clés
cp .env.example .env.local
# Éditer .env.local avec vos identifiants (voir external-services-setup.md)

# Démarrer les services locaux (Postgres + Redis)
docker-compose -f infra/docker/docker-compose.yml up -d

# Appliquer les migrations de base de données
pnpm db:migrate

# Démarrer le serveur de développement Inngest (dans un terminal séparé)
pnpm inngest:dev

# Démarrer toutes les applications
pnpm dev
```

Une fois lancé :

- Application web : http://localhost:3000
- API : http://localhost:3100
- Tableau de bord Inngest : http://localhost:8288

### Vérifier l'état

```bash
curl http://localhost:3100/health
# Attendu : {"data":{"status":"ok","version":"0.0.1"}}
```

---

## Structure du dépôt

Il s'agit d'un monorepo `pnpm` + `Turborepo`.

```
blowcortex/
├── apps/
│   ├── web/           # Next.js 15 — application web destinée aux utilisateurs
│   ├── mobile/        # Expo — application iOS + Android
│   ├── api/           # Hono sur Node.js — couche API HTTP
│   └── workers/       # Fonctions Inngest — gestionnaires d'événements et exécutions d'agents
├── packages/
│   ├── core/          # Logique métier, types, schémas Zod
│   ├── db/            # Drizzle ORM, schéma Postgres, migrations
│   ├── graph/         # Client Zep, requêtes sur graphe temporel
│   ├── agents/        # Définitions d'agents, prompts, specs d'outils
│   ├── connectors/    # Clients MCP, flux OAuth pour Gmail/Slack/etc.
│   ├── llm/           # Wrapper OpenRouter, registre des modèles, garde-fous budgétaires
│   ├── ui/            # Composants shadcn/ui partagés
│   └── config/        # Configs ESLint, TypeScript, Tailwind partagées
├── infra/
│   ├── docker/        # docker-compose pour le développement local
│   └── migrations/    # Migrations SQL générées
└── tests/
    ├── e2e/           # Playwright
    └── integration/   # Tests d'intégration Vitest
```

Chaque dossier aura son propre README expliquant son rôle une fois implémenté.

---

## Stack technique

| Couche             | Choix                             | Pourquoi                                                                                       |
| ------------------ | --------------------------------- | ---------------------------------------------------------------------------------------------- |
| Langage            | TypeScript 5.5+ (strict)          | Sécurité de types de bout en bout                                                              |
| Web                | Next.js 15 + shadcn/ui + Tailwind | Itération rapide, design system solide                                                         |
| Mobile             | Expo + React Native               | Logique partagée avec le web, notifications natives                                            |
| API                | Hono on Node.js                   | Léger, prêt pour l'edge                                                                        |
| Framework agent    | Vercel AI SDK + OpenRouter        | API unique, multi-fournisseurs, MCP-friendly                                                   |
| Événements         | Inngest                           | Durable, serverless, event-driven                                                              |
| Base relationnelle | PostgreSQL via Supabase           | Éprouvé, écosystème riche                                                                      |
| Graphe mémoire     | Zep (Graphiti)                    | Graphe de connaissances temporel avec fenêtres de validité                                     |
| Cache/Queue        | Redis (Upstash)                   | Recherche vectorielle + pub/sub dans un même système                                           |
| LLM                | OpenRouter (300+ modèles)         | Liste récupérée dynamiquement via `GET /api/v1/models`, choix du modèle + `max_tokens` côté UI |
| Auth               | Clerk                             | Gère OAuth, MFA et sessions nativement                                                         |
| Observabilité      | Langfuse + Sentry                 | Tracing LLM + suivi des erreurs                                                                |

Pour la stack complète avec versions et justifications, voir [`PRD.md` Section 2](./PRD.md).

---

## Workflow de développement

### Commandes

```bash
# Développement
pnpm dev              # Démarrer toutes les apps en parallèle
pnpm dev:web          # Web uniquement
pnpm dev:api          # API uniquement
pnpm inngest:dev      # Serveur de développement local Inngest

# Base de données
pnpm db:generate      # Générer une migration à partir d'un changement de schéma
pnpm db:migrate       # Appliquer les migrations sur DATABASE_URL
pnpm db:studio        # Ouvrir Drizzle Studio (navigateur de BD)

# Tests
pnpm test             # Tous les tests Vitest
pnpm test:watch       # Mode surveillance
pnpm test:e2e         # Tests bout-en-bout Playwright
pnpm test:eval:engagements  # Évaluer l'agent sur le jeu de données de test

# Qualité
pnpm lint             # ESLint sur tous les packages
pnpm typecheck        # tsc --noEmit sur tous les packages
pnpm format           # Prettier

# Build
pnpm build            # Builder toutes les apps et packages
```

### Branches et commits

Ce projet est construit par un agent autonome, donc les commits suivent un format strict :

```
[P1-S2] Flux OAuth Gmail avec chiffrement des tokens
[P1-S3] Agent Engagement Detector avec 87% de précision sur le jeu de test
```

Format : `[Phase-Sprint] <ce qui a été fait>`. Un changement logique par commit. Les commits doivent correspondre aux critères d'acceptation de [`PRD.md` Section 11](./PRD.md).

Contributeurs humains : utilisez des feature branches et des PRs pour la revue. Les pushes directs sur `main` par l'agent ne sont autorisés que dans le périmètre de son sprint en cours.

### Philosophie de test

- **Tests unitaires** (Vitest) : chaque fonction pure dans `packages/core` et `packages/agents`.
- **Tests d'intégration** (Vitest) : fonctions Inngest avec LLM et DB mockés.
- **Tests E2E** (Playwright) : trois parcours critiques utilisateur — inscription, connexion Gmail, réception et approbation d'une action de briefing.
- **Évaluation d'agent** : tests basés sur fixtures dans `tests/fixtures/` mesurant précision/rappel de chaque agent. Doit respecter les seuils définis dans le PRD (par exemple, précision de l'Engagement Detector >=85%).

Objectif de couverture : **>=70%** sur `packages/core` et `packages/agents`. Les composants frontend sont testés uniquement via E2E.

---

## État actuel

**Sprint :** Non commencé.
**Dernière mise à jour :** Dépôt initialisé.
**Prochaine action :** Parcourir [`external-services-setup.md`](./external-services-setup.md), remplir `.env.local`, puis lancer l'agent de code autonome avec le prompt de démarrage.

### Avancement des sprints

| Sprint | Focus                                               | Statut          |
| ------ | --------------------------------------------------- | --------------- |
| P1-S1  | Foundation (monorepo, DB, auth, deployment configs) | ⏳ Non commencé |
| P1-S2  | Gmail connector + ingestion                         | ⏳ Non commencé |
| P1-S3  | Engagement Detector agent                           | ⏳ Non commencé |
| P1-S4  | Calendar + Meeting Briefer agent                    | ⏳ Non commencé |
| P1-S5  | Actions + approval flow                             | ⏳ Non commencé |
| P1-S6  | Observability + polish + beta launch                | ⏳ Non commencé |

Cette section est mise à jour par l'agent implémentateur à la fin de chaque sprint.

---

## Principes

Ces principes gouvernent chaque décision dans ce codebase. Ils proviennent du PRD et sont non négociables.

1. **Observer avant d'agir.** BlowCortex lit et comprend avant d'agir. La confiance se mérite.
2. **Type de bout en bout.** Zod aux frontières, TypeScript strict partout.
3. **Chaque action est récupérable.** Journal d'audit pour tout. Annulation quand c'est possible.
4. **Le budget est un sujet de premier ordre.** Chaque appel LLM est comptabilisé, plafonné et attribué.
5. **Le PRD est la source de vérité.** Un code qui contredit le PRD est un bug.
6. **Le simple vaut mieux que l'ingénieux.** YAGNI s'applique à chaque couche.
7. **Livrer des fonctionnalités qui marchent, pas des frameworks.** Un agent fiable vaut mieux que dix à moitié terminés.

---

## Confidentialité et sécurité

BlowCortex lit des données professionnelles très personnelles : emails, calendrier, messages de chat, documents. Cela implique une responsabilité forte.

**Engagements de base :**

- Les tokens OAuth sont chiffrés au repos (AES-256-GCM) avec des clés par environnement.
- Les données utilisateur ne sont jamais partagées avec des tiers au-delà du fournisseur LLM nécessaire à la tâche courante.
- Les appels LLM utilisent le mode zero data retention (ZDR) quand il est disponible.
- Les utilisateurs peuvent supprimer leur compte et toutes les données associées sous 30 jours (conformité RGPD).
- Le journal d'audit est append-only au niveau base de données : les actions historiques ne peuvent pas être altérées.

Les exigences de sécurité complètes se trouvent dans [`PRD.md` Section 13](./PRD.md).

---

## Dépannage

### `pnpm install` échoue

Assurez-vous d'avoir Node 20+ et pnpm 9+ :

```bash
node --version    # >= 20
pnpm --version    # >= 9
```

Si vous utilisez corepack : `corepack enable && corepack prepare pnpm@latest --activate`.

### Connexion base de données refusée

```bash
docker-compose -f infra/docker/docker-compose.yml ps
# Doit afficher BlowCortex-postgres en statut "Up"

docker-compose -f infra/docker/docker-compose.yml logs postgres
# Rechercher d'éventuelles erreurs
```

Réinitialiser si besoin :

```bash
docker-compose -f infra/docker/docker-compose.yml down -v
docker-compose -f infra/docker/docker-compose.yml up -d
pnpm db:migrate
```

### Les fonctions Inngest ne se déclenchent pas

Le serveur de dev local Inngest doit tourner à part :

```bash
pnpm inngest:dev
```

Vérifiez le dashboard sur http://localhost:8288. Les événements apparaissent en temps réel.

### Les appels LLM échouent avec 401

Vérifiez `OPENROUTER_API_KEY` dans `.env.local` (format : `sk-or-v1-...`). Si la clé vient d'être créée, vérifiez aussi qu'au moins **5 $ de crédit** sont chargés sur le compte OpenRouter — sans crédit, l'API renvoie 401/402 même avec une clé valide.

### Le webhook Clerk ne se déclenche pas en local

Clerk ne peut pas atteindre `localhost`. Utilisez un tunnel :

```bash
cloudflared tunnel --url http://localhost:3100
# ou : ngrok http 3100
```

Définissez l'URL générée dans Clerk Dashboard → Webhooks.

Pour plus d'informations : [`external-services-setup.md` — Troubleshooting](./external-services-setup.md).

---

## Contribution

À ce stade, BlowCortex est implémenté par un agent de code autonome avec supervision humaine. Les contributeurs humains seront les bienvenus une fois la Phase 1 terminée (objectif : lancement bêta).

Pour l'instant, le workflow est le suivant :

1. Les humains supervisent les sprints et relisent les PRs de l'agent.
2. Les ambiguïtés vont dans [`DECISIONS.md`](./DECISIONS.md).
3. Les changements de spécification vont d'abord dans [`PRD.md`](./PRD.md), puis l'implémentation suit.

Un fichier `CONTRIBUTING.md` complet sera rédigé au Sprint 6.

---

## Licence

À définir — sera ajoutée avant le premier commit public. Probablement Business Source License (BSL) pour le codebase principal, MIT pour les packages pensés pour être réutilisés.

---

## Remerciements

BlowCortex s'inspire de plusieurs projets récents et s'appuie sur leurs idées :

- **OpenClaw** — pour avoir démontré que des agents IA autonomes peuvent agir au nom des utilisateurs.
- **Paperclip** — pour la métaphore d'organisation en organigramme et l'ordonnancement par heartbeat.
- **Les agents de code autonomes** — pour l'expérience développeur qui consiste à déléguer un travail complexe à une IA.
- **MindLoop** (concept précurseur interne) — pour le modèle de vigilance proactive.

La contribution de BlowCortex est leur fusion : une organisation IA qui **se construit elle-même** autour d'un utilisateur, en combinant mémoire, action, orchestration et auto-extension dans un système cohérent.

---

## Contact

Ce dépôt est actuellement en développement privé. Pour toute question, ouvrez une issue (une fois les issues activées).

---

_« Le meilleur outil est celui qui pense pour vous quand vous n'y pensez pas. »_
