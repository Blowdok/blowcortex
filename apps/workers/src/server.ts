// Serveur HTTP exposant l'endpoint Inngest /api/inngest.
// Le serveur de dev Inngest (http://localhost:8288) découvre les fonctions
// déclarées ici et les invoque sur réception d'événements.

import { serve as inngestServe } from 'inngest/hono';
import { serve as nodeServe } from '@hono/node-server';
import { Hono } from 'hono';
import { inngest } from './client.js';
import { allFunctions } from './functions/ping.js';

const app = new Hono();

app.get('/health', (c) => c.json({ data: { status: 'ok', service: 'workers' } }));

app.on(
  ['GET', 'POST', 'PUT'],
  '/api/inngest',
  inngestServe({ client: inngest, functions: allFunctions }),
);

const port = Number(process.env['WORKERS_PORT'] ?? 3200);

nodeServe({ fetch: app.fetch, port }, (info) => {
  console.info(
    `▲ @blowcortex/workers prêt sur http://${info.address}:${info.port}/api/inngest`,
  );
});
