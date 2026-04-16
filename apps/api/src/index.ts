// Entry point du serveur API.
// Charge l'environnement, valide la config, démarre Hono sur Node.

import { serve } from '@hono/node-server';
import { createApp } from './app.js';
import { getEnv } from './env.js';
import { API_VERSION } from './version.js';

const env = getEnv();
const app = createApp();

const url = new URL(env.BLOWCORTEX_API_URL);
const port = Number(url.port) || 3100;

serve({ fetch: app.fetch, port }, (info) => {
  console.info(
    `▲ @blowcortex/api v${API_VERSION} prêt sur http://${info.address}:${info.port}`,
  );
});
