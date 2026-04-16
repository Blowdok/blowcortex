// Test d'intégration : GET /health doit renvoyer 200 et le bon payload.
// Monte l'app sans serveur HTTP grâce à app.request() (helper Hono).

import { describe, expect, it } from 'vitest';
import { createApp } from '../app.js';

describe('GET /health', () => {
  const app = createApp();

  it('renvoie 200 avec { data: { status: "ok", version, timestamp } }', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);

    const body = (await res.json()) as {
      data: { status: string; version: string; timestamp: string };
    };
    expect(body.data.status).toBe('ok');
    expect(body.data.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(() => new Date(body.data.timestamp)).not.toThrow();
  });

  it('renvoie 404 typé pour une route inconnue', async () => {
    const res = await app.request('/nope');
    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: { code: string; message: string } };
    expect(body.error.code).toBe('not_found');
  });
});
