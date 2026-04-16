// Validation des variables d'environnement via Zod.
// Chaque service consommateur appelle `loadEnv()` au boot et plante de façon
// explicite si une variable obligatoire manque.
//
// Convention : les variables exposées au navigateur sont préfixées NEXT_PUBLIC_*.
// Pour les apps Next.js, ne pas appeler loadEnv() côté client : utiliser
// directement process.env.NEXT_PUBLIC_*.

import { z } from 'zod';

/** Schéma global réservé aux processus Node (API, workers, scripts). */
export const serverEnvSchema = z.object({
  // Cœur
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  BLOWCORTEX_BASE_URL: z.string().url(),
  BLOWCORTEX_API_URL: z.string().url(),
  ENCRYPTION_KEY: z
    .string()
    .min(32, 'ENCRYPTION_KEY doit faire au moins 32 caractères (clé AES-256 base64).'),

  // Postgres
  DATABASE_URL: z.string().url(),
  DATABASE_DIRECT_URL: z.string().url(),

  // Redis
  REDIS_URL: z.string().url(),

  // Clerk (côté serveur)
  CLERK_SECRET_KEY: z.string().min(1).optional(),
  CLERK_JWT_PUBLIC_KEY: z.string().min(1).optional(),
  CLERK_WEBHOOK_SECRET: z.string().min(1).optional(),

  // Zep
  ZEP_API_KEY: z.string().min(1).optional(),
  ZEP_API_URL: z.string().url().default('https://api.getzep.com'),

  // OpenRouter
  OPENROUTER_API_KEY: z.string().min(1).optional(),
  OPENROUTER_BASE_URL: z.string().url().default('https://openrouter.ai/api/v1'),
  OPENROUTER_DEFAULT_MODEL: z.string().min(1).default('anthropic/claude-sonnet-4.5'),
  OPENROUTER_MAX_TOKENS: z.coerce.number().int().positive().default(4096),
  OPENROUTER_HTTP_REFERER: z.string().url().optional(),
  OPENROUTER_X_TITLE: z.string().optional(),

  // Inngest
  INNGEST_EVENT_KEY: z.string().optional(),
  INNGEST_SIGNING_KEY: z.string().optional(),

  // Observabilité
  LANGFUSE_PUBLIC_KEY: z.string().optional(),
  LANGFUSE_SECRET_KEY: z.string().optional(),
  LANGFUSE_HOST: z.string().url().default('https://cloud.langfuse.com'),
  SENTRY_DSN_API: z.string().optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export class EnvValidationError extends Error {
  constructor(
    message: string,
    public readonly issues: z.ZodIssue[],
  ) {
    super(message);
    this.name = 'EnvValidationError';
  }
}

/**
 * Charge et valide les variables d'environnement serveur.
 * @throws EnvValidationError si la validation échoue.
 */
export function loadServerEnv(source: NodeJS.ProcessEnv = process.env): ServerEnv {
  const result = serverEnvSchema.safeParse(source);
  if (!result.success) {
    const issues = result.error.issues;
    const summary = issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new EnvValidationError(
      `Variables d'environnement invalides ou manquantes :\n${summary}`,
      issues,
    );
  }
  return result.data;
}
