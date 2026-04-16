// Tests Vitest pour la validation des variables d'environnement.

import { describe, expect, it } from 'vitest';
import { EnvValidationError, loadServerEnv } from './env.js';

const baseValidEnv = {
  NODE_ENV: 'test',
  BLOWCORTEX_BASE_URL: 'http://localhost:3000',
  BLOWCORTEX_API_URL: 'http://localhost:3100',
  ENCRYPTION_KEY: 'rvByOX9ouYTpcD1cKePetKX/4Uj3GND9xF0tqhiT/j4=',
  DATABASE_URL: 'postgresql://blowcortex:blowcortex@localhost:5432/blowcortex',
  DATABASE_DIRECT_URL: 'postgresql://blowcortex:blowcortex@localhost:5432/blowcortex',
  REDIS_URL: 'redis://localhost:6379',
} as NodeJS.ProcessEnv;

describe('loadServerEnv', () => {
  it('charge un environnement minimal valide', () => {
    const env = loadServerEnv(baseValidEnv);
    expect(env.NODE_ENV).toBe('test');
    expect(env.BLOWCORTEX_BASE_URL).toBe('http://localhost:3000');
    expect(env.OPENROUTER_BASE_URL).toBe('https://openrouter.ai/api/v1');
    expect(env.OPENROUTER_DEFAULT_MODEL).toBe('anthropic/claude-sonnet-4.5');
    expect(env.OPENROUTER_MAX_TOKENS).toBe(4096);
  });

  it('lève une EnvValidationError quand ENCRYPTION_KEY est trop courte', () => {
    expect(() =>
      loadServerEnv({
        ...baseValidEnv,
        ENCRYPTION_KEY: 'court',
      }),
    ).toThrow(EnvValidationError);
  });

  it("lève une erreur quand DATABASE_URL n'est pas une URL valide", () => {
    expect(() =>
      loadServerEnv({
        ...baseValidEnv,
        DATABASE_URL: 'pas-une-url',
      }),
    ).toThrow(EnvValidationError);
  });

  it("contient les détails Zod dans l'erreur", () => {
    try {
      loadServerEnv({ ...baseValidEnv, REDIS_URL: 'cassé' });
      throw new Error('attendu une exception');
    } catch (err) {
      expect(err).toBeInstanceOf(EnvValidationError);
      const issues = (err as EnvValidationError).issues;
      expect(issues.some((i) => i.path.includes('REDIS_URL'))).toBe(true);
    }
  });

  it('coerce OPENROUTER_MAX_TOKENS depuis une chaîne', () => {
    const env = loadServerEnv({ ...baseValidEnv, OPENROUTER_MAX_TOKENS: '2048' });
    expect(env.OPENROUTER_MAX_TOKENS).toBe(2048);
  });
});
