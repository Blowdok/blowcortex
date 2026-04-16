// Configuration Drizzle Kit pour la génération et l'application des migrations.
// Les migrations générées sont stockées dans `infra/migrations/` à la racine.

import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

const databaseUrl = process.env['DATABASE_DIRECT_URL'] ?? process.env['DATABASE_URL'];
if (!databaseUrl) {
  throw new Error('DATABASE_DIRECT_URL (ou DATABASE_URL) doit être défini.');
}

export default defineConfig({
  schema: './src/schema.ts',
  out: '../../infra/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: databaseUrl,
  },
  strict: true,
  verbose: true,
});
