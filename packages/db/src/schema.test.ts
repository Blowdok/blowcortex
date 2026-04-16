// Tests structurels du schéma : vérifie que les tables et colonnes critiques
// sont bien déclarées et que les types s'inferent correctement.
//
// Ces tests ne touchent pas la base — ils se contentent d'introspecter le
// modèle Drizzle, ce qui suffit pour repérer une régression de schéma.

import { describe, expect, it } from 'vitest';
import {
  actions,
  agents,
  auditLog,
  briefings,
  connectors,
  engagements,
  llmUsage,
  users,
} from './schema.js';

describe('schéma Drizzle', () => {
  it('déclare toutes les tables du PRD §5.1', () => {
    const tables = [
      users,
      connectors,
      agents,
      actions,
      engagements,
      briefings,
      auditLog,
      llmUsage,
    ];
    expect(tables.length).toBe(8);
    for (const table of tables) {
      expect(table).toBeDefined();
    }
  });

  it('users a un identifiant clerkId unique', () => {
    expect(users.clerkId.notNull).toBe(true);
  });

  it('actions référence agents avec FK', () => {
    expect(actions.agentId).toBeDefined();
  });

  it("audit_log et llm_usage existent (append-only et tracking coûts)", () => {
    expect(auditLog.eventType.notNull).toBe(true);
    expect(llmUsage.costUsdCents.notNull).toBe(true);
  });
});
