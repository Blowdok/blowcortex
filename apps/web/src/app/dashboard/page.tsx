import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }

  const user = await currentUser();

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">
        Bienvenue {user?.firstName ?? user?.emailAddresses[0]?.emailAddress ?? ''}
      </h1>
      <p className="text-slate-600 dark:text-slate-300">
        Votre tableau de bord apparaîtra ici à partir du Sprint 5 (file d&rsquo;actions
        et briefings). Sprint 1 : squelette technique uniquement.
      </p>
      <section className="rounded-default border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="font-mono text-sm text-slate-500">
          État de l&rsquo;intégration BlowCortex :
        </p>
        <ul className="mt-3 space-y-2 text-sm">
          <li>✅ Authentification Clerk active</li>
          <li>⏳ Connecteur Gmail (Sprint 2)</li>
          <li>⏳ Détecteur d&rsquo;engagements (Sprint 3)</li>
          <li>⏳ Briefings de réunion (Sprint 4)</li>
          <li>⏳ File d&rsquo;actions (Sprint 5)</li>
        </ul>
      </section>
    </main>
  );
}
