// Configuration ESLint pour les services Node.js (apps/api, apps/workers, packages/*).

import base from './base.js';
import globals from 'globals';

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...base,
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
];
