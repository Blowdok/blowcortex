# @blowcortex/db

Schéma Drizzle, migrations et client Postgres de BlowCortex (PRD §5.1).

## Tables

`users`, `connectors`, `agents`, `actions`, `engagements`, `briefings`, `audit_log`, `llm_usage`.

## Commandes

```bash
# Démarrer Postgres local
pnpm docker:up

# Générer une migration depuis le schéma
pnpm db:generate

# Appliquer les migrations (utilise DATABASE_DIRECT_URL)
pnpm db:migrate

# Ouvrir Drizzle Studio
pnpm db:studio
```

## Notes importantes

- `audit_log` est append-only : un trigger SQL (migration `0001_audit_log_append_only.sql`)
  bloque les `UPDATE` et `DELETE`. Ne jamais le contourner.
- Les tokens OAuth (`access_token_enc`, `refresh_token_enc`) sont chiffrés en
  AES-256-GCM avant stockage. Voir `@blowcortex/connectors` (Sprint 2) pour le
  module de chiffrement.
- La table `messages` (mentionnée PRD §8.1) n'est pas encore définie — elle sera
  ajoutée au Sprint 2 lors de l'ingestion Gmail.
