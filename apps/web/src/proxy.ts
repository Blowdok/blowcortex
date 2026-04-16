// Convention Next.js 16 : le fichier `proxy.ts` remplace `middleware.ts`.
// Clerk publie toujours son handler sous le nom `clerkMiddleware` — seul le
// fichier qui l'héberge change de nom côté Next.js.

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Matcher des routes nécessitant une authentification.
// Routes (auth) restent publiques (sign-in/sign-up).
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/briefings(.*)',
  '/engagements(.*)',
  '/actions(.*)',
  '/agents(.*)',
  '/connectors(.*)',
  '/graph(.*)',
  '/settings(.*)',
  '/onboarding(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals et fichiers statiques, sauf si présents en query.
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Toujours exécuter le proxy sur les routes API/tRPC.
    '/(api|trpc)(.*)',
  ],
};
