# @blowcortex/api

API HTTP de BlowCortex (Hono sur Node.js).

## Démarrage

```bash
# Depuis la racine du monorepo
pnpm install
pnpm dev:api
```

L'API démarre sur le port défini par `BLOWCORTEX_API_URL` (défaut : 3100).

## Endpoints

| Méthode | Chemin    | Description                          |
| ------- | --------- | ------------------------------------ |
| GET     | `/health` | Statut de l'API (PRD §6.2)           |

D'autres endpoints (`/v1/*`) seront ajoutés au fil des sprints.

## Architecture

- `src/index.ts` — boot du serveur Node.
- `src/app.ts` — construction de l'app Hono (logger, CORS, secure headers,
  gestion d'erreurs uniforme).
- `src/env.ts` — validation des variables d'environnement via `@blowcortex/core`.
- `src/routes/*.ts` — routeurs par domaine.

## Validation des variables d'environnement

Au boot, `getEnv()` appelle `loadServerEnv()` (Zod). Si une variable critique
manque, le processus quitte avec un message explicite (`exit(1)`).

## Tests

```bash
pnpm --filter @blowcortex/api test
```

Les tests d'intégration utilisent `app.request()` (Hono) pour appeler les routes
sans démarrer de serveur HTTP réel.
