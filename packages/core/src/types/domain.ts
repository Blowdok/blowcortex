// Types de domaine partagés entre les packages et les apps (PRD §5.2).

import { z } from 'zod';

// ----------------------------------------------------------------------------
// Niveaux de confiance utilisateur (PRD §8.4).
// ----------------------------------------------------------------------------

export const trustLevelSchema = z.enum(['0', '1', '2', '3']);
export type TrustLevel = z.infer<typeof trustLevelSchema>;

// ----------------------------------------------------------------------------
// Configuration d'agent (PRD §5.2 / §7.3).
// ----------------------------------------------------------------------------

export const agentConfigSchema = z.object({
  instructions: z.string().min(1),
  tools: z.array(z.string()),
  /** Cron au format Unix, null pour les agents purement event-driven. */
  heartbeatCron: z.string().nullable(),
  /** Slug OpenRouter validé contre le registre dynamique. */
  model: z.string().min(1),
  /** Borne dure par exécution. Plafonné par OPENROUTER_MAX_TOKENS au boot. */
  maxTokensPerRun: z.number().int().positive(),
});
export type AgentConfig = z.infer<typeof agentConfigSchema>;

// ----------------------------------------------------------------------------
// Charges utiles d'actions exécutables (PRD §5.2).
// L'union grandit au fur et à mesure de l'ajout de nouveaux exécuteurs.
// ----------------------------------------------------------------------------

export const sendEmailPayloadSchema = z.object({
  type: z.literal('send_email'),
  to: z.array(z.string().email()).min(1),
  cc: z.array(z.string().email()).optional(),
  bcc: z.array(z.string().email()).optional(),
  subject: z.string().min(1),
  body: z.string().min(1),
  replyToMessageId: z.string().optional(),
});
export type SendEmailPayload = z.infer<typeof sendEmailPayloadSchema>;

/** Discriminated union ouverte. Ajouter de nouveaux types par fusion. */
export const actionPayloadSchema = z.discriminatedUnion('type', [
  sendEmailPayloadSchema,
]);
export type ActionPayload = z.infer<typeof actionPayloadSchema>;

// ----------------------------------------------------------------------------
// Contenu d'un briefing de réunion (PRD §5.2 / §7.2).
// ----------------------------------------------------------------------------

export const briefingParticipantSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  role: z.string().optional(),
});

export const briefingInteractionSchema = z.object({
  date: z.string(),
  snippet: z.string(),
  sourceRef: z.string(),
});

export const briefingEngagementSchema = z.object({
  description: z.string(),
  dueAt: z.string().optional(),
});

export const briefingDocSchema = z.object({
  title: z.string(),
  url: z.string().url(),
});

export const briefingContentSchema = z.object({
  meetingTitle: z.string(),
  participants: z.array(briefingParticipantSchema),
  summary: z.string(),
  lastInteractions: z.array(briefingInteractionSchema),
  openEngagements: z.array(briefingEngagementSchema),
  relevantDocs: z.array(briefingDocSchema),
  suggestedQuestions: z.array(z.string()).optional(),
});
export type BriefingContent = z.infer<typeof briefingContentSchema>;

// ----------------------------------------------------------------------------
// Engagement détecté (PRD §7.1).
// ----------------------------------------------------------------------------

export const detectedEngagementSchema = z.object({
  description: z.string().min(1),
  madeBy: z.enum(['user', 'other']),
  toWhom: z.string().min(1),
  dueAt: z.string().nullable(),
  confidence: z.number().int().min(0).max(100),
  evidence: z.string().min(1),
});
export type DetectedEngagement = z.infer<typeof detectedEngagementSchema>;
