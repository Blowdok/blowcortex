// Hiérarchie d'erreurs typées du domaine BlowCortex.
// Chaque appel externe (LLM, DB, API tierce) doit lever l'une de ces classes
// pour permettre une gestion uniforme côté API et workers.

export class BlowCortexError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public override readonly cause?: unknown,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

/** Levée quand un agent dépasse son budget LLM mensuel. */
export class BudgetExceededError extends BlowCortexError {
  constructor(
    public readonly userId: string,
    public readonly agentId: string | null,
    public readonly tokensUsed: number,
    public readonly tokensLimit: number,
  ) {
    super(
      `Budget LLM dépassé pour l'agent ${agentId ?? '<global>'} (utilisateur ${userId}) : ${tokensUsed}/${tokensLimit} tokens.`,
      'budget_exceeded',
    );
  }
}

/** Levée quand un slug de modèle OpenRouter est inconnu du registre. */
export class UnknownModelError extends BlowCortexError {
  constructor(public readonly slug: string) {
    super(`Slug de modèle OpenRouter inconnu : « ${slug} ».`, 'unknown_model');
  }
}

/** Levée quand un connecteur OAuth n'est plus utilisable. */
export class ConnectorAuthError extends BlowCortexError {
  constructor(
    public readonly connectorId: string,
    public readonly provider: string,
    cause?: unknown,
  ) {
    super(
      `Connecteur ${provider} (${connectorId}) ne peut plus être utilisé : token expiré ou révoqué.`,
      'connector_auth_failed',
      cause,
    );
  }
}

/** Levée quand un appel LLM échoue après l'épuisement des retries. */
export class LlmCallError extends BlowCortexError {
  constructor(message: string, cause?: unknown) {
    super(message, 'llm_call_failed', cause);
  }
}

/** Levée quand une action ne peut pas être exécutée (préconditions invalides). */
export class ActionExecutionError extends BlowCortexError {
  constructor(
    public readonly actionId: string,
    message: string,
    cause?: unknown,
  ) {
    super(message, 'action_execution_failed', cause);
  }
}
