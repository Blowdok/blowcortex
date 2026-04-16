# @blowcortex/workers

Fonctions Inngest de BlowCortex (agents, ingestion, exécution d'actions).

## Démarrage local

Trois processus à lancer en parallèle :

```bash
# 1) Workers
pnpm dev:workers     # http://localhost:3200/api/inngest

# 2) Serveur de dev Inngest
pnpm inngest:dev     # http://localhost:8288  (UI + dispatcher)

# 3) Optionnel : déclencher un ping
curl -X POST http://localhost:8288/e/test-key \
  -H "Content-Type: application/json" \
  -d '{"name":"system/ping","data":{"at":"2026-04-16T12:00:00Z"}}'
```

## Structure

- `src/client.ts` — instance Inngest partagée + catalogue d'événements typés (Zod).
- `src/functions/*.ts` — chaque fonction = une étape du pipeline.
- `src/server.ts` — point d'entrée HTTP (Hono) qui expose `/api/inngest`.

## Statut Sprint 1

Une seule fonction (`system-ping`) sert de test de bout en bout. Les vraies
fonctions (`ingest-gmail-message`, `detect-engagements`, etc.) seront
ajoutées à partir du Sprint 2.
