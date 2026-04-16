// Configuration ESLint pour Next.js 16+ (apps/web).

import react from './react.js';
import nextPlugin from '@next/eslint-plugin-next';

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...react,
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    plugins: {
      '@next/next': nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
    },
  },
];
