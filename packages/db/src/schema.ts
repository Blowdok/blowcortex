// Schéma Drizzle de BlowCortex (PRD §5.1).
// Toute évolution passe par `pnpm db:generate` puis `pnpm db:migrate`.
//
// Note : la table `audit_log` est append-only — les contraintes anti-UPDATE/DELETE
// sont posées via un trigger SQL dans la migration `0001_audit_log_append_only.sql`.

import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import type {
  ActionPayload,
  AgentConfig,
  BriefingContent,
} from '@blowcortex/core/types';

// ----------------------------------------------------------------------------
// Énumérations
// ----------------------------------------------------------------------------

export const trustLevelEnum = pgEnum('trust_level', ['0', '1', '2', '3']);
export const agentStatusEnum = pgEnum('agent_status', ['active', 'paused', 'disabled']);
export const connectorStatusEnum = pgEnum('connector_status', [
  'connected',
  'expired',
  'revoked',
  'error',
]);
export const actionStatusEnum = pgEnum('action_status', [
  'pending',
  'approved',
  'rejected',
  'executed',
  'failed',
]);

// ----------------------------------------------------------------------------
// Utilisateurs (synchronisés depuis Clerk via webhook)
// ----------------------------------------------------------------------------

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkId: text('clerk_id').notNull().unique(),
  email: text('email').notNull().unique(),
  name: text('name'),
  timezone: text('timezone').notNull().default('UTC'),
  trustLevel: trustLevelEnum('trust_level').notNull().default('0'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ----------------------------------------------------------------------------
// Connecteurs OAuth (Gmail, Calendar, Slack, Notion…)
// ----------------------------------------------------------------------------

export const connectors = pgTable('connectors', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  /** 'gmail' | 'gcal' | 'slack' | 'notion' — string libre pour extensibilité. */
  provider: text('provider').notNull(),
  status: connectorStatusEnum('status').notNull().default('connected'),
  /** Token chiffré AES-256-GCM via la clé ENCRYPTION_KEY. */
  accessTokenEnc: text('access_token_enc').notNull(),
  refreshTokenEnc: text('refresh_token_enc'),
  tokenExpiresAt: timestamp('token_expires_at', { withTimezone: true }),
  scopes: jsonb('scopes').$type<string[]>().notNull(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  lastSyncAt: timestamp('last_sync_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ----------------------------------------------------------------------------
// Agents (instanciés par utilisateur)
// ----------------------------------------------------------------------------

export const agents = pgTable('agents', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  /** 'engagement_tracker' | 'meeting_briefer' | etc. */
  type: text('type').notNull(),
  name: text('name').notNull(),
  status: agentStatusEnum('status').notNull().default('active'),
  config: jsonb('config').$type<AgentConfig>().notNull(),
  budgetTokensMonthly: integer('budget_tokens_monthly').notNull().default(5_000_000),
  budgetTokensUsedThisMonth: integer('budget_tokens_used_this_month').notNull().default(0),
  lastHeartbeatAt: timestamp('last_heartbeat_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ----------------------------------------------------------------------------
// Actions proposées par les agents (en attente d'approbation utilisateur)
// ----------------------------------------------------------------------------

export const actions = pgTable('actions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  agentId: uuid('agent_id').references(() => agents.id),
  /** 'send_email' | 'create_ticket' | 'update_doc' — clé du type discriminant. */
  type: text('type').notNull(),
  status: actionStatusEnum('status').notNull().default('pending'),
  payload: jsonb('payload').$type<ActionPayload>().notNull(),
  /** Résumé lisible humain. */
  preview: text('preview').notNull(),
  /** Justification renvoyée par l'agent. */
  rationale: text('rationale').notNull(),
  /** Identifiants des nœuds Zep cités comme contexte. */
  contextRefs: jsonb('context_refs').$type<string[]>(),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  executedAt: timestamp('executed_at', { withTimezone: true }),
  failureReason: text('failure_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ----------------------------------------------------------------------------
// Engagements détectés (commitments)
// ----------------------------------------------------------------------------

export const engagements = pgTable('engagements', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  description: text('description').notNull(),
  dueAt: timestamp('due_at', { withTimezone: true }),
  /** 'email' | 'slack' | 'meeting'. */
  sourceType: text('source_type').notNull(),
  /** ID de message ou identifiant équivalent dans la source. */
  sourceRef: text('source_ref').notNull(),
  /** Email ou identifiant de l'autre partie. */
  withUser: text('with_user'),
  /** 'open' | 'fulfilled' | 'overdue' | 'dismissed'. */
  status: text('status').notNull().default('open'),
  confidence: integer('confidence').notNull(),
  detectedAt: timestamp('detected_at', { withTimezone: true }).notNull().defaultNow(),
  fulfilledAt: timestamp('fulfilled_at', { withTimezone: true }),
});

// ----------------------------------------------------------------------------
// Briefings de réunion
// ----------------------------------------------------------------------------

export const briefings = pgTable('briefings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  /** ID Google Calendar de l'événement. */
  eventId: text('event_id').notNull(),
  eventStartsAt: timestamp('event_starts_at', { withTimezone: true }).notNull(),
  content: jsonb('content').$type<BriefingContent>().notNull(),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
  openedAt: timestamp('opened_at', { withTimezone: true }),
  /** Feedback utilisateur (true/false/null si pas encore évalué). */
  helpful: boolean('helpful'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ----------------------------------------------------------------------------
// Journal d'audit (append-only — voir trigger SQL associé)
// ----------------------------------------------------------------------------

export const auditLog = pgTable('audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  agentId: uuid('agent_id').references(() => agents.id),
  eventType: text('event_type').notNull(),
  details: jsonb('details').$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ----------------------------------------------------------------------------
// Suivi de la consommation LLM (par appel)
// ----------------------------------------------------------------------------

export const llmUsage = pgTable('llm_usage', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  agentId: uuid('agent_id').references(() => agents.id),
  /** Slug OpenRouter (ex. 'anthropic/claude-sonnet-4.5'). */
  model: text('model').notNull(),
  inputTokens: integer('input_tokens').notNull(),
  outputTokens: integer('output_tokens').notNull(),
  cachedTokens: integer('cached_tokens').notNull().default(0),
  /** Coût stocké en centimes USD pour éviter les flottants. */
  costUsdCents: integer('cost_usd_cents').notNull(),
  /** 'briefing' | 'engagement_detection' | etc. */
  purpose: text('purpose').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ----------------------------------------------------------------------------
// Types inférés (utilisables par les autres packages)
// ----------------------------------------------------------------------------

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Connector = typeof connectors.$inferSelect;
export type NewConnector = typeof connectors.$inferInsert;
export type Agent = typeof agents.$inferSelect;
export type NewAgent = typeof agents.$inferInsert;
export type Action = typeof actions.$inferSelect;
export type NewAction = typeof actions.$inferInsert;
export type Engagement = typeof engagements.$inferSelect;
export type NewEngagement = typeof engagements.$inferInsert;
export type Briefing = typeof briefings.$inferSelect;
export type NewBriefing = typeof briefings.$inferInsert;
export type AuditLogEntry = typeof auditLog.$inferSelect;
export type NewAuditLogEntry = typeof auditLog.$inferInsert;
export type LlmUsageEntry = typeof llmUsage.$inferSelect;
export type NewLlmUsageEntry = typeof llmUsage.$inferInsert;
