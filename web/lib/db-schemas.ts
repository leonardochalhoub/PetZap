import { z } from "zod";

export const Species = z.enum(["dog", "cat", "bird", "rabbit", "other"]);
export type Species = z.infer<typeof Species>;

export const Sex = z.enum(["male", "female"]);
export type Sex = z.infer<typeof Sex>;

export const SpendingCategory = z.enum([
  "food", "vet", "toys", "grooming", "medicine", "accessories", "hygiene", "other",
]);
export type SpendingCategory = z.infer<typeof SpendingCategory>;

export const PetSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  name: z.string().min(1).max(80),
  species: Species,
  sex: Sex.nullable().optional(),
  neutered: z.boolean().default(false),
  breed: z.string().max(80).nullable().optional(),
  birthdate: z.string().date().nullable().optional(),
  photo_url: z.string().url().nullable().optional(),
  photo_zoom: z.number().min(0.5).max(5).default(1),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Pet = z.infer<typeof PetSchema>;

export const PetInputSchema = PetSchema.pick({
  name: true, species: true, sex: true, neutered: true, breed: true, birthdate: true,
});
export type PetInput = z.infer<typeof PetInputSchema>;

export const VaccineSchema = z.object({
  id: z.string().uuid(),
  pet_id: z.string().uuid(),
  name: z.string().min(1).max(120),
  given_date: z.string().date(),
  next_date: z.string().date().nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
  created_at: z.string(),
});
export type Vaccine = z.infer<typeof VaccineSchema>;

export const VaccineInputSchema = VaccineSchema.pick({
  pet_id: true, name: true, given_date: true, next_date: true, notes: true,
});
export type VaccineInput = z.infer<typeof VaccineInputSchema>;

export const SpendingSchema = z.object({
  id: z.string().uuid(),
  pet_id: z.string().uuid(),
  amount_cents: z.number().int().nonnegative(),
  currency: z.string().length(3),
  category: SpendingCategory,
  spent_at: z.string().date(),
  description: z.string().max(500).nullable().optional(),
  next_due: z.string().date().nullable().optional(),
  created_at: z.string(),
});
export type Spending = z.infer<typeof SpendingSchema>;

export const SpendingInputSchema = SpendingSchema.pick({
  pet_id: true, amount_cents: true, currency: true, category: true, spent_at: true, description: true, next_due: true,
});
export type SpendingInput = z.infer<typeof SpendingInputSchema>;

export const PetWeightSchema = z.object({
  id: z.string().uuid(),
  pet_id: z.string().uuid(),
  weight_kg: z.number().positive().max(199.99),
  measured_at: z.string().date(),
  notes: z.string().max(500).nullable().optional(),
  created_at: z.string(),
});
export type PetWeight = z.infer<typeof PetWeightSchema>;

export const PetWeightInputSchema = PetWeightSchema.pick({
  pet_id: true, weight_kg: true, measured_at: true, notes: true,
});
export type PetWeightInput = z.infer<typeof PetWeightInputSchema>;

export const WhatsappLinkSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  phone: z.string().regex(/^\+\d{8,15}$/, "E.164 phone required"),
  verified: z.boolean(),
  created_at: z.string(),
});
export type WhatsappLink = z.infer<typeof WhatsappLinkSchema>;
