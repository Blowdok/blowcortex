// Configuration Prettier partagée.
// Importable via `import config from '@blowcortex/config/prettier'`.

/** @type {import("prettier").Config} */
export default {
  semi: true,
  singleQuote: true,
  trailingComma: 'all',
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  arrowParens: 'always',
  endOfLine: 'lf',
  bracketSpacing: true,
  bracketSameLine: false,
  jsxSingleQuote: false,
  plugins: ['prettier-plugin-tailwindcss'],
};
