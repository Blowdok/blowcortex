// Configuration Vitest racine — agrège tous les workspaces.
// Permet de lancer `pnpm vitest` à la racine pour exécuter tous les tests.

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      'packages/core',
      'packages/db',
      'apps/api',
    ],
  },
});
