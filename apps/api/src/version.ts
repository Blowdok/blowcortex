// Source unique de vérité pour la version de l'API exposée par /health.
// Lue depuis package.json au runtime pour éviter la désynchronisation.

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageJsonPath = resolve(__dirname, '../package.json');
const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as { version: string };

export const API_VERSION = pkg.version;
