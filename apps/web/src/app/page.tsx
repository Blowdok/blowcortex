import Link from 'next/link';
import { Show } from '@clerk/nextjs';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-64px)] max-w-3xl flex-col justify-center gap-8 px-6 py-16">
      <section className="flex flex-col gap-6">
        <h1 className="text-balance text-4xl font-semibold tracking-tight md:text-5xl">
          Le système d&rsquo;IA qui pense pour vous quand vous n&rsquo;y pensez pas.
        </h1>
        <p className="text-pretty text-lg text-slate-600 dark:text-slate-300">
          BlowCortex observe vos communications, comprend votre contexte de travail
          et agit, avec votre approbation, sur les actions répétitives qui ralentissent
          votre journée.
        </p>

        <Show when="signed-in">
          <div>
            <Link
              href="/dashboard"
              className="rounded-default bg-primary-500 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-primary-600"
            >
              Ouvrir mon tableau de bord →
            </Link>
          </div>
        </Show>
        <Show when="signed-out">
          <p className="text-sm text-slate-500">
            Créez un compte depuis la barre supérieure pour activer les agents.
          </p>
        </Show>
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
