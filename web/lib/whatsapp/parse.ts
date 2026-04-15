import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { ParsedIntentSchema, type ParsedIntent } from "./schemas";

/**
 * Parse a free-form WhatsApp message (pt-BR or en) into a structured intent
 * using Gemini 1.5 Flash with OpenAPI responseSchema for guaranteed JSON.
 */

// Gemini supports an OpenAPI subset; hand-write the response schema for the
// discriminated union. Gemini doesn't support true "oneOf" at the top level
// well, so we use a flat schema with optional fields and discriminate on `intent`.
// All potentially-union-specific fields are optional; we enforce shape via Zod
// after the call.
const responseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    intent: {
      type: SchemaType.STRING,
      enum: ["vaccine", "spending", "unknown"],
      description: "Which kind of record this message represents",
    },
    pet_name: {
      type: SchemaType.STRING,
      description: "Pet name, matching one of the user's pets when possible",
      nullable: true,
    },
    // vaccine
    vaccine_name: { type: SchemaType.STRING, nullable: true },
    given_date: {
      type: SchemaType.STRING,
      description: "ISO date YYYY-MM-DD when vaccine was given",
      nullable: true,
    },
    next_date: {
      type: SchemaType.STRING,
      description: "ISO date YYYY-MM-DD of next due dose, or null",
      nullable: true,
    },
    notes: { type: SchemaType.STRING, nullable: true },
    // spending
    amount: {
      type: SchemaType.NUMBER,
      description: "Spending amount in BRL (reais, not cents)",
      nullable: true,
    },
    category: {
      type: SchemaType.STRING,
      enum: ["food", "vet", "toys", "grooming", "medicine", "accessories", "other"],
      nullable: true,
    },
    spent_at: {
      type: SchemaType.STRING,
      description: "ISO date YYYY-MM-DD when the spending happened",
      nullable: true,
    },
    description: { type: SchemaType.STRING, nullable: true },
    // unknown
    reason: { type: SchemaType.STRING, nullable: true },
  },
  required: ["intent"],
} as const;

export async function parseMessage(text: string, petNames: string[]): Promise<ParsedIntent> {
  const apiKey = process.env.GEMINI_API_KEY!;
  const today = new Date().toISOString().slice(0, 10);

  const systemInstruction =
    "You parse Brazilian Portuguese (or English) messages from a pet owner into structured records about their pet's vaccines or spendings. " +
    `Today is ${today}. ` +
    "If a relative date like 'hoje', 'ontem', 'anteontem', 'amanhã' is used, resolve it to YYYY-MM-DD. " +
    "For relative future offsets (e.g. 'próxima dose em 1 ano'), compute the ISO date. " +
    "Amounts are in BRL reais (not cents). " +
    "Categories must be one of: food, vet, toys, grooming, medicine, accessories, other. " +
    "If the message is not about vaccines or spendings, or you cannot parse confidently, " +
    "return intent='unknown' with a short `reason` in pt-BR.";

  const petsLine = petNames.length
    ? `User's pets: ${petNames.join(", ")}.`
    : "User has no pets registered yet.";

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction,
    generationConfig: {
      responseMimeType: "application/json",
      // Cast because the SDK types are narrower than the accepted OpenAPI subset.
      responseSchema: responseSchema as unknown as Parameters<
        typeof genAI.getGenerativeModel
      >[0]["generationConfig"] extends infer G
        ? G extends { responseSchema?: infer R }
          ? R
          : never
        : never,
      temperature: 0,
    },
  });

  try {
    const result = await model.generateContent([petsLine, `Message: ${text}`].join("\n"));
    const raw = result.response.text();

    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch {
      return { intent: "unknown", reason: "Resposta do parser não é JSON válido." };
    }

    const parsed = ParsedIntentSchema.safeParse(json);
    if (!parsed.success) {
      // Gemini may return a valid-shape-but-missing-required-field response
      // (e.g. spending with no spent_at). Fall back to unknown.
      return {
        intent: "unknown",
        reason: "Campos obrigatórios ausentes ou inválidos na resposta do parser.",
      };
    }
    return parsed.data;
  } catch (err) {
    console.error("[whatsapp.parse] Gemini call failed", err);
    return { intent: "unknown", reason: "Falha ao chamar o parser." };
  }
}
