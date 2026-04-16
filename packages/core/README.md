# @blowcortex/core

Logique métier transverse : types de domaine, schémas Zod, validation des variables d'environnement, hiérarchie d'erreurs typées.

## Exports

- `loadServerEnv()` — valide `process.env` au boot des services Node.
- `BlowCortexError`, `BudgetExceededError`, `UnknownModelError`, `ConnectorAuthError`, `LlmCallError`, `ActionExecutionError`.
- Types et schémas : `AgentConfig`, `ActionPayload`, `BriefingContent`, `DetectedEngagement`, `TrustLevel`.

## Tests

```bash
pnpm --filter @blowcortex/core test
```
