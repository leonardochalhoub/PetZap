import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import {
  ParsedIntentSchema,
  ParsedIntentsSchema,
  type ParsedIntent,
  type ParsedIntents,
} from "./schemas";
import { log } from "@/lib/log";

/**
 * Multi-intent parser. A single user message (text or voice) can yield
 * 0+ intents. We ask Gemini 2.5 Flash for structured output — an object
 * with an `intents: [...]` array. Each intent is vaccine | spending | unknown.
 *
 * Audio is supported natively: pass `audio` in the input and Gemini will
 * transcribe + extract intents in a single call (multimodal).
 */

const intentSchemaForGemini = {
  type: SchemaType.OBJECT,
  properties: {
    intent: {
      type: SchemaType.STRING,
      enum: ["vaccine", "spending", "unknown"],
    },
    pet_name: { type: SchemaType.STRING, nullable: true },
    // vaccine
    vaccine_name: { type: SchemaType.STRING, nullable: true },
    given_date: { type: SchemaType.STRING, nullable: true },
    next_date: { type: SchemaType.STRING, nullable: true },
    notes: { type: SchemaType.STRING, nullable: true },
    // spending
    amount: { type: SchemaType.NUMBER, nullable: true },
    category: {
      type: SchemaType.STRING,
      enum: ["food", "vet", "toys", "grooming", "medicine", "accessories", "hygiene", "other"],
      nullable: true,
    },
    spent_at: { type: SchemaType.STRING, nullable: true },
    description: { type: SchemaType.STRING, nullable: true },
    next_due: { type: SchemaType.STRING, nullable: true },
    // unknown
    reason: { type: SchemaType.STRING, nullable: true },
  },
  required: ["intent"],
} as const;

const rootSchemaForGemini = {
  type: SchemaType.OBJECT,
  properties: {
    intents: {
      type: SchemaType.ARRAY,
      items: intentSchemaForGemini,
    },
  },
  required: ["intents"],
} as const;

export type ParserInput =
  | { text: string }
  | { audio: { bytes: Buffer; mime: string } };

function buildSystemInstruction(petNames: string[]): string {
  const today = new Date().toISOString().slice(0, 10);
  const petsLine = petNames.length
    ? `User's pets: ${petNames.join(", ")}. Always map pet_name to one of these (case/accent insensitive).`
    : "User has no pets registered yet.";

  return [
    "You parse Brazilian Portuguese (or English) messages from a pet owner into structured records.",
    "A single message can contain MULTIPLE intents — return every intent you find as separate items in the `intents` array.",
    `Today is ${today}. Resolve relative dates to YYYY-MM-DD.`,
    petsLine,
    "",
    "Rules:",
    "- Amounts are in BRL reais (not cents).",
    "- Categories: food, vet, toys, grooming, medicine, accessories, hygiene, other.",
    "- Medications ('remédio', 'medicamento') → intent=spending, category=medicine. Use `description` for the medication name and `next_due` for the next dose date if mentioned.",
    "- Vaccines ('vacina') → intent=vaccine. Use `next_date` for the next dose if mentioned.",
    "- Hygiene items ('tapete higiênico', 'areia', 'shampoo') → intent=spending, category=hygiene.",
    "- 'hoje'/'today'=today, 'ontem'=yesterday, 'anteontem'=2 days ago, 'amanhã'=tomorrow.",
    "- 'em 1 ano'/'em 1 mês'/'em X dias' → compute absolute ISO date from today.",
    "- If the message doesn't describe any vaccine or spending, return a single intent with intent=unknown and a short `reason` in pt-BR.",
    "",
    "Examples:",
    '- "Rex tomou vacina antirrábica hoje, próxima em 1 ano"',
    `  → [{"intent":"vaccine","pet_name":"Rex","vaccine_name":"antirrábica","given_date":"${today}","next_date":"..."}]`,
    '- "Gastei 50 reais com ração pro Rex"',
    `  → [{"intent":"spending","pet_name":"Rex","amount":50,"category":"food","spent_at":"${today}","description":"ração"}]`,
    '- "Dora tomou o remédio Cincadem hoje. próxima dose em um mês. Gastei 55 reais"',
    `  → [{"intent":"spending","pet_name":"Dora","amount":55,"category":"medicine","spent_at":"${today}","description":"Cincadem","next_due":"...(+1 month)"}]`,
    '- "Rex tomou V10 hoje e comprei ração 80 reais"',
    `  → [{"intent":"vaccine","pet_name":"Rex","vaccine_name":"V10","given_date":"${today}","next_date":null},{"intent":"spending","pet_name":"Rex","amount":80,"category":"food","spent_at":"${today}","description":"ração"}]`,
  ].join("\n");
}

async function callGemini(input: ParserInput, petNames: string[]): Promise<unknown> {
  const apiKey = process.env.GEMINI_API_KEY!;
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: buildSystemInstruction(petNames),
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: rootSchemaForGemini as unknown as Parameters<
        typeof genAI.getGenerativeModel
      >[0]["generationConfig"] extends infer G
        ? G extends { responseSchema?: infer R }
          ? R
          : never
        : never,
      temperature: 0,
    },
  });

  if ("audio" in input) {
    const audioPart = {
      inlineData: {
        mimeType: input.audio.mime,
        data: input.audio.bytes.toString("base64"),
      },
    };
    const textPart = { text: "Transcreva e extraia os registros deste áudio." };
    const result = await model.generateContent([textPart, audioPart]);
    return JSON.parse(result.response.text());
  }

  const result = await model.generateContent(`Message: ${input.text}`);
  return JSON.parse(result.response.text());
}

export async function parseInput(
  input: ParserInput,
  petNames: string[],
): Promise<ParsedIntents> {
  try {
    const json = await callGemini(input, petNames);
    const root = (json as { intents?: unknown[] } | null) ?? null;
    const rawIntents = root?.intents ?? [];

    // Validate each intent; drop malformed ones so one bad intent doesn't nuke the whole message.
    const good: ParsedIntents = [];
    for (const raw of rawIntents) {
      const r = ParsedIntentSchema.safeParse(raw);
      if (r.success) good.push(r.data);
    }

    // If nothing parsed, return a single unknown intent so the caller can reply sensibly.
    if (good.length === 0) {
      return [{ intent: "unknown", reason: "Não entendi a mensagem." }];
    }
    return good;
  } catch (err) {
    log.error("parse.gemini_failed", err);
    return [{ intent: "unknown", reason: "Falha ao chamar o parser." }];
  }
}

/**
 * Back-compat wrapper used by the (currently-dormant) WhatsApp pipeline.
 * Returns the first intent so single-intent callers keep working.
 */
export async function parseMessage(text: string, petNames: string[]): Promise<ParsedIntent> {
  const list = await parseInput({ text }, petNames);
  return list[0] ?? { intent: "unknown", reason: "Resposta vazia do parser." };
}

// Re-export for convenience when callers need the array shape directly.
export { ParsedIntentsSchema };
