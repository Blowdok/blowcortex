# Déploiement

## Vue d'ensemble

| Service           | Plateforme        | Région       | Fichier de config              |
| ----------------- | ----------------- | ------------ | ------------------------------ |
| `apps/web`        | Vercel            | `fra1`       | `apps/web/vercel.json`         |
| `apps/api`        | Railway           | `eu-west`    | `apps/api/railway.json`        |
| `apps/workers`    | Railway           | `eu-west`    | `apps/workers/railway.json`    |
| `apps/mobile`     | Expo EAS          | —            | (configurer via `eas init`)    |

**Aucun déploiement n'est effectué au Sprint 1.** Les fichiers de configuration
sont prêts mais aucune CI/CD n'est branchée. Le déploiement réel intervient au
Sprint 6 (PRD §11).

## Variables d'environnement à fournir aux providers

Reporter au document `external-services-setup.md` pour la liste complète. À minima :

### Vercel (`apps/web`)
- `NEXT_PUBLIC_*` (Clerk publishable key, BLOWCORTEX_BASE_URL/API_URL)
- `CLERK_SECRET_KEY`
- `CLERK_JWT_PUBLIC_KEY`

### Railway (`apps/api` + `apps/workers`)
Toutes les variables côté serveur : `ENCRYPTION_KEY`, `DATABASE_URL`,
`DATABASE_DIRECT_URL`, `REDIS_URL`, `OPENROUTER_*`, `CLERK_*`, `ZEP_*`,
`INNGEST_*`, `LANGFUSE_*`, `SENTRY_*`, `GOOGLE_*`, `R2_*`.

## Régions

Région par défaut : Europe de l'Ouest (`fra1` Vercel, `eu-west` Railway).
Décision documentée dans `DECISIONS.md` (RGPD strict, cohérence Zep).
