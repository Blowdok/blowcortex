// Configuration ESLint partagée — base TypeScript (ESLint flat config v9).
// Étend cette base dans les configs spécifiques (node, next, react).

import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

/** @type {import("eslint").Linter.Config[]} */
export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/build/**',
      '**/.turbo/**',
      '**/coverage/**',
      '**/.expo/**',
      '**/drizzle/**',
      '**/playwright-report/**',
      '**/test-results/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      parserOptions: {
        projectService: {
          // Autorise les fichiers hors-projet (configs racine) à être lintés
          // sans planter sur le typage. Les tests doivent être inclus dans
          // tsconfig.json — pas dans cette liste (les globs `**` sont interdits).
          allowDefaultProject: [
            '*.config.ts',
            '*.config.js',
            '*.config.mjs',
            'eslint.config.js',
            'eslint.config.mjs',
            'vitest.config.ts',
            'drizzle.config.ts',
          ],
        },
        tsconfigRootDir: process.cwd(),
      },
      globals: {
        ...globals.es2023,
      },
    },
    rules: {
      // Préférences du projet
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      // Autorise process.env['X'] (utile pour conserver le typage strict
      // avec noUncheckedIndexedAccess sur NodeJS.ProcessEnv).
      '@typescript-eslint/dot-notation': 'off',
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      'no-debugger': 'error',
    },
  },
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
  // Fichiers de configuration : pas de type-check, juste des règles JS de base.
  {
    files: [
      '**/*.config.{js,mjs,cjs,ts}',
      '**/eslint.config.{js,mjs,cjs}',
      '**/vitest.config.{ts,mts}',
      '**/drizzle.config.ts',
    ],
    ...tseslint.configs.disableTypeChecked,
  },
  prettier,
];
