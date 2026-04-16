# Infrastructure de développement local

Stack Docker Compose minimal pour faire tourner BlowCortex en local.

## Services

| Service  | Image                          | Ports        | Rôle                             |
| -------- | ------------------------------ | ------------ | -------------------------------- |
| postgres | `postgres:16-alpine`           | 5432         | Base relationnelle principale    |
| redis    | `redis/redis-stack:7.4.0-v1`   | 6379, 8001   | Cache + queues + vector search   |

Redis Insight (UI Redis Stack) est disponible sur http://localhost:8001 dès le
démarrage.

## Commandes

```bash
pnpm docker:up      # démarrer
pnpm docker:down    # arrêter
pnpm docker:logs    # suivre les logs
```

## Persistance

Les données sont conservées dans deux volumes Docker nommés :
- `blowcortex-pgdata`
- `blowcortex-redisdata`

Pour repartir d'un état vierge :

```bash
docker compose -f infra/docker/docker-compose.yml down -v
pnpm docker:up
pnpm db:migrate
```

## Healthchecks

Les deux services exposent un healthcheck. Vérifier l'état :

```bash
docker compose -f infra/docker/docker-compose.yml ps
```

Le statut doit être `Up (healthy)` après ~5 secondes.
