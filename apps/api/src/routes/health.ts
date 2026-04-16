// GET /health — endpoint de santé requis par Sprint 1 (PRD §6.2).
// Réponse au format { data: { status: "ok", version: string } }.

import { Hono } from 'hono';
import { API_VERSION } from '../version.js';

export const healthRouter = new Hono();

healthRouter.get('/', (c) =>
  c.json({
    data: {
      status: 'ok',
      version: API_VERSION,
      timestamp: new Date().toISOString(),
    },
  }),
);
