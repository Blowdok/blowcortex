import Link from 'next/link';
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-8 px-6 py-16">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary-500" aria-hidden />
          <span className="font-mono text-sm uppercase tracking-widest text-slate-500">
            BlowCortex
          </span>
        </div>
        <SignedIn>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
      </header>

      <section className="flex flex-col gap-6">
        <h1 className="text-balance text-4xl font-semibold tracking-tight md:text-5xl">
          Le système d&rsquo;IA qui pense pour vous quand vous n&rsquo;y pensez pas.
        </h1>
        <p className="text-pretty text-lg text-slate-600 dark:text-slate-300">
          BlowCortex observe vos communications, comprend votre contexte de travail
          et agit, avec votre approbation, sur les actions répétitives qui ralentissent
          votre journée.
        </p>

        <div className="flex flex-wrap gap-3">
          <SignedOut>
            <Link
              href="/sign-in"
              className="rounded-default bg-primary-500 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-primary-600"
            >
              Se connecter
            </Link>
            <Link
              href="/sign-up"
              className="rounded-default border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              Créer un compte
            </Link>
          </SignedOut>
          <SignedIn>
            <Link
              href="/dashboard"
              className="rounded-default bg-primary-500 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-primary-600"
            >
              Ouvrir mon tableau de bord
            </Link>
          </SignedIn>
        </div>
      </section>

      <footer className="mt-auto pt-12 text-xs text-slate-500">
        <p>
          Sprint 1 — squelette technique. Les fonctionnalités d&rsquo;observation et
          d&rsquo;action seront livrées progressivement (PRD §11).
        </p>
      </footer>
    </main>
  );
}
