import { z } from "zod";

/**
 * Structured intents extracted from a user message (text or audio).
 * The parser returns an ARRAY — a single message can carry multiple intents
 * (e.g. "Rex tomou vacina antirrábica + gastei 50 com ração").
 */

export const SpendingCategory = z.enum([
  "food",
  "vet",
  "toys",
  "grooming",
  "medicine",
  "accessories",
  "hygiene",
  "other",
]);
export type SpendingCategory = z.infer<typeof SpendingCategory>;

export const VaccineIntentSchema = z.object({
  intent: z.literal("vaccine"),
  pet_name: z.string().min(1),
  vaccine_name: z.string().min(1),
  given_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "ISO date (YYYY-MM-DD)"),
  next_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  notes: z.string().optional(),
});
export type VaccineIntent = z.infer<typeof VaccineIntentSchema>;

export const SpendingIntentSchema = z.object({
  intent: z.literal("spending"),
  pet_name: z.string().min(1),
  amount: z.number().nonnegative(),
  category: SpendingCategory,
  spent_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "ISO date (YYYY-MM-DD)"),
  description: z.string().optional(),
  /** For recurring spendings like medications — ISO date of the next expected purchase/dose. */
  next_due: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
});
export type SpendingIntent = z.infer<typeof SpendingIntentSchema>;

export const WeightIntentSchema = z.object({
  intent: z.literal("weight"),
  pet_name: z.string().min(1),
  weight_kg: z.number().positive().max(200),
  measured_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "ISO date (YYYY-MM-DD)"),
  notes: z.string().optional(),
});
export type WeightIntent = z.infer<typeof WeightIntentSchema>;

export const UnknownIntentSchema = z.object({
  intent: z.literal("unknown"),
  reason: z.string().min(1),
});
export type UnknownIntent = z.infer<typeof UnknownIntentSchema>;

export const ParsedIntentSchema = z.discriminatedUnion("intent", [
  VaccineIntentSchema,
  SpendingIntentSchema,
  WeightIntentSchema,
  UnknownIntentSchema,
]);
export type ParsedIntent = z.infer<typeof ParsedIntentSchema>;

export const ParsedIntentsSchema = z.array(ParsedIntentSchema);
export type ParsedIntents = z.infer<typeof ParsedIntentsSchema>;
