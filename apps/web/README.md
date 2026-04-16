# @blowcortex/web

Application web BlowCortex — Next.js 15 (App Router) + Clerk + Tailwind v4 + shadcn/ui.

## Démarrage

```bash
# Depuis la racine du monorepo
pnpm install
pnpm dev:web
```

Ouvrez http://localhost:3000.

## Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── sign-in/[[...sign-in]]/page.tsx
│   │   └── sign-up/[[...sign-up]]/page.tsx
│   ├── dashboard/page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   └── utils.ts
└── middleware.ts
```

## Authentification

`@clerk/nextjs` v6 fournit le middleware `clerkMiddleware` et les composants
`SignIn`, `SignUp`, `UserButton`, `SignedIn`, `SignedOut`.

Routes publiques : `/`, `/sign-in/*`, `/sign-up/*`.
Routes protégées : `/dashboard`, `/briefings`, `/engagements`, `/actions`, `/agents`, `/connectors`, `/graph`, `/settings`, `/onboarding`.

Configurer les clés `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` et `CLERK_SECRET_KEY`
dans `.env.local`. Sans ces clés, `pnpm dev:web` plantera au boot (comportement
attendu : « crash loudly » selon les principes du PRD).

## Theming

Tailwind v4 (CSS-first via `@theme` dans `globals.css`).
Couleurs primaires : `bg-primary-500`, etc. (PRD §9.3).
Dark mode : classe `dark` sur `<html>` (à brancher au Sprint 4 via le toggle
des paramètres).

## shadcn/ui

```bash
# Ajouter un composant
npx shadcn@latest add button
```

La config est dans `components.json`. Les composants partagés entre apps
remontent dans `packages/ui` à mesure qu'ils sont réutilisés.
