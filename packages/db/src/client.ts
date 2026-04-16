// Client Drizzle partagé (pool d'exécution).
// Pour les migrations, utiliser un client séparé sur DATABASE_DIRECT_URL via
// `drizzle-kit` ou le script migrate.ts.

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

export type DatabaseClient = ReturnType<typeof createDatabaseClient>;

interface CreateDatabaseClientOptions {
  /** URL pooled (recommandé pour l'exécution). */
  databaseUrl: string;
  /** Nombre de connexions max dans le pool. Default 10. */
  maxConnections?: number;
}

/**
 * Construit un client Drizzle avec un pool postgres-js.
 * Préférer une instance singleton par processus.
 */
export function createDatabaseClient(opts: CreateDatabaseClientOptions) {
  const sql = postgres(opts.databaseUrl, {
    max: opts.maxConnections ?? 10,
    idle_timeout: 20,
    prepare: false,
  });
  return drizzle(sql, { schema });
}

export { schema };
