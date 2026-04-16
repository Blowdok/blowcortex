# @blowcortex/config

Configurations partagées du monorepo BlowCortex.

## Contenu

- `tsconfig/base.json` — preset TypeScript de base (strict)
- `tsconfig/node.json` — preset pour les services Node.js
- `tsconfig/react.json` — preset pour les libs React
- `tsconfig/next.json` — preset pour les apps Next.js
- `eslint/base.js` — config ESLint flat de base (TypeScript + Prettier)
- `eslint/node.js` — config ESLint pour services Node.js
- `eslint/react.js` — config ESLint pour libs React
- `eslint/next.js` — config ESLint pour Next.js 15
- `prettier.config.js` — règles de formatage Prettier
- `tailwind.preset.js` — preset Tailwind v4 (couleurs primaires, fonts, radius)

## Utilisation

```ts
// tsconfig.json d'un package Node
{
  "extends": "@blowcortex/config/tsconfig/node",
  "include": ["src/**/*.ts"]
}
```

```js
// eslint.config.js
import config from '@blowcortex/config/eslint/node';
export default config;
```
