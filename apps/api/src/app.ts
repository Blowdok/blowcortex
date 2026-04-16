// Construction de l'instance Hono. Séparée de `index.ts` pour faciliter les
// tests d'intégration (qui montent l'app sans démarrer un serveur réseau).

import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { BlowCortexError } from '@blowcortex/core';
import { healthRouter } from './routes/health.js';

export function createApp() {
  const app = new Hono();

  app.use('*', logger());
  app.use('*', secureHeaders());
  app.use(
    '*',
    cors({
      origin: (origin) => origin ?? '*',
      allowMethods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization'],
      maxAge: 600,
    }),
  );

  // Routes
  app.route('/health', healthRouter);

  // 404
  app.notFound((c) =>
    c.json(
      { error: { code: 'not_found', message: `Route ${c.req.method} ${c.req.path} introuvable.` } },
      404,
    ),
  );

  // Gestion d'erreur uniforme
  app.onError((err, c) => {
    if (err instanceof BlowCortexError) {
      const status = err.code === 'budget_exceeded' ? 429 : 400;
      return c.json(
        { error: { code: err.code, message: err.message } },
        status,
      );
    }
    console.error('Unhandled error:', err);
    return c.json(
      { error: { code: 'internal_error', message: 'Erreur interne du serveur.' } },
      500,
    );
  });

  return app;
}
