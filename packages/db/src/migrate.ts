// Script de migration manuel : applique toutes les migrations Drizzle pendantes
// sur DATABASE_DIRECT_URL. Lancé via `pnpm db:migrate`.
//
// Usage local : assurez-vous que docker-compose est up et que .env.local contient
// DATABASE_DIRECT_URL.

import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const databaseUrl = process.env['DATABASE_DIRECT_URL'] ?? process.env['DATABASE_URL'];
if (!databaseUrl) {
  console.error(
    '✖ DATABASE_DIRECT_URL (ou DATABASE_URL) doit être défini dans .env.local',
  );
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Les migrations vivent dans `infra/migrations` à la racine du dépôt.
const migrationsFolder = resolve(__dirname, '../../../infra/migrations');

const sql = postgres(databaseUrl, { max: 1 });
const db = drizzle(sql);

try {
  console.info(`→ Application des migrations depuis ${migrationsFolder}`);
  await migrate(db, { migrationsFolder });
  console.info('✓ Migrations appliquées');
} catch (err) {
  console.error('✖ Échec de la migration :', err);
  process.exit(1);
} finally {
  await sql.end();
}
