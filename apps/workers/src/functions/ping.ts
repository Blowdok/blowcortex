// Fonction de test : journalise un ping reçu. Sert à valider que le pipeline
// Inngest local fonctionne (Sprint 1).

import { inngest } from '../client.js';

interface PingEventData {
  at: string;
}

export const pingFunction = inngest.createFunction(
  { id: 'system-ping', name: 'System ping' },
  { event: 'system/ping' },
  async ({ event, step }) => {
    const data = event.data as PingEventData;
    await step.run('log-ping', () => {
      console.info(`[inngest] ping reçu à ${data.at}`);
      return { ok: true };
    });
    return { received: data.at };
  },
);

export const allFunctions = [pingFunction];
