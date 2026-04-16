// Middleware Next.js pour la protection des routes via Clerk.
// Toutes les routes sont publiques par défaut au Sprint 1 ; les routes
// protégées seront ajoutées au matcher au fur et à mesure des sprints.

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
    // Skip Next.js internals and static files unless they appear in queries.
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jsons?|png|jpg|jpeg|gif|svg|ico|webp|avif|woff2?|ttf|eot|map)).*)',
    // Always run middleware for API routes.
    '/(api|trpc)(.*)',
  ],
};
