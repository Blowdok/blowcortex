// Validation des variables d'environnement au boot de l'API.
// Crash explicite si une variable critique manque (PRD règle 8 du startup prompt).

import { loadServerEnv, type ServerEnv } from '@blowcortex/core';

let cached: ServerEnv | null = null;

export function getEnv(): ServerEnv {
  if (cached) return cached;
  try {
    cached = loadServerEnv();
    return cached;
  } catch (err) {
    console.error('\n✖ Boot de @blowcortex/api annulé : configuration invalide.\n');
    if (err instanceof Error) console.error(err.message);
    process.exit(1);
  }
}
