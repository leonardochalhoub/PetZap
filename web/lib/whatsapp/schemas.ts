import { z } from "zod";

/**
 * Zod schemas for parsed WhatsApp message intents.
 * Gemini Flash returns structured output matching one of these variants.
 */

export const SpendingCategory = z.enum([
  "food",
  "vet",
  "toys",
  "grooming",
  "medicine",
  "accessories",
  "other",
]);
export type SpendingCategory = z.infer<typeof SpendingCategory>;

export const VaccineIntentSchema = z.object({
  intent: z.literal("vaccine"),
  pet_name: z.string().min(1),
  vaccine_name: z.string().min(1),
  given_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "ISO date (YYYY-MM-DD)"),
  next_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
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
});
export type SpendingIntent = z.infer<typeof SpendingIntentSchema>;

export const UnknownIntentSchema = z.object({
  intent: z.literal("unknown"),
  reason: z.string().min(1),
});
export type UnknownIntent = z.infer<typeof UnknownIntentSchema>;

export const ParsedIntentSchema = z.discriminatedUnion("intent", [
  VaccineIntentSchema,
  SpendingIntentSchema,
  UnknownIntentSchema,
]);
export type ParsedIntent = z.infer<typeof ParsedIntentSchema>;
