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

/**
 * Turn a partially-filled intent (e.g. spending without amount) into an
 * `unknown` intent with a human-friendly reason that tells the user exactly
 * which field is missing. Returns null if the intent looks totally malformed.
 */
function rescuePartialIntent(raw: unknown): ParsedIntent | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const intent = typeof obj.intent === "string" ? obj.intent : null;
  const petName = typeof obj.pet_name === "string" ? obj.pet_name : null;
  const petLabel = petName ? ` (${petName})` : "";

  if (intent === "spending") {
    const missing: string[] = [];
    if (typeof obj.amount !== "number") missing.push("valor em reais");
    if (typeof obj.category !== "string") missing.push("categoria");
    if (typeof obj.spent_at !== "string") missing.push("data");
    if (!petName) missing.push("pet");
    if (missing.length) {
      return {
        intent: "unknown",
        reason: `Identifiquei um gasto${petLabel}, mas faltou: ${missing.join(", ")}. Pode repetir mencionando o valor?`,
      };
    }
  }

  if (intent === "vaccine") {
    const missing: string[] = [];
    if (typeof obj.vaccine_name !== "string") missing.push("nome da vacina");
    if (typeof obj.given_date !== "string") missing.push("data");
    if (!petName) missing.push("pet");
    if (missing.length) {
      return {
        intent: "unknown",
        reason: `Identifiquei uma vacina${petLabel}, mas faltou: ${missing.join(", ")}. Pode repetir com todos os detalhes?`,
      };
    }
  }

  return null;
}

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
    "- For a spending intent, you MUST provide amount (number), category (one of the list), spent_at (YYYY-MM-DD), and pet_name. If ANY of those is missing from the message, return intent=unknown with a `reason` naming the missing field.",
    "- For a vaccine intent, you MUST provide pet_name, vaccine_name, and given_date. If missing, return intent=unknown.",
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
    // 2.5-flash-lite has a much higher free-tier daily cap than 2.5-flash
    // (1000/day vs 20/day as of Apr 2026) and is sufficient for our parsing.
    model: "gemini-2.5-flash-lite",
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
    // Gemini rejects MIME types with parameters (e.g. "audio/ogg; codecs=opus").
    // Keep only the base type; also normalise a couple of aliases Telegram hands us.
    const baseMime = (input.audio.mime.split(";")[0] ?? "").trim().toLowerCase();
    const normalisedMime =
      baseMime === "audio/oga" || baseMime === "audio/opus"
        ? "audio/ogg"
        : baseMime || "audio/ogg";

    log.info("parse.audio_in", {
      originalMime: input.audio.mime,
      normalisedMime,
      bytes: input.audio.bytes.byteLength,
    });

    const audioPart = {
      inlineData: {
        mimeType: normalisedMime,
        data: input.audio.bytes.toString("base64"),
      },
    };
    const textPart = { text: "Transcreva e extraia os registros deste áudio." };
    const result = await model.generateContent([textPart, audioPart]);
    const raw = result.response.text();
    log.info("parse.gemini_raw_audio", { raw: raw.slice(0, 2000) });
    return JSON.parse(raw);
  }

  const result = await model.generateContent(`Message: ${input.text}`);
  const raw = result.response.text();
  log.info("parse.gemini_raw", { raw: raw.slice(0, 2000) });
  return JSON.parse(raw);
}

export async function parseInput(
  input: ParserInput,
  petNames: string[],
): Promise<ParsedIntents> {
  try {
    const json = await callGemini(input, petNames);

    // Accept both the expected { intents: [...] } and a bare array Gemini sometimes emits
    // despite the responseSchema, plus a bare object (single intent).
    let rawIntents: unknown[] = [];
    if (Array.isArray(json)) {
      rawIntents = json;
    } else if (json && typeof json === "object") {
      const obj = json as Record<string, unknown>;
      if (Array.isArray(obj.intents)) {
        rawIntents = obj.intents;
      } else if (typeof obj.intent === "string") {
        // Gemini returned a single flat intent — wrap it
        rawIntents = [obj];
      }
    }

    log.info("parse.intents_pre_validation", {
      count: rawIntents.length,
      preview: JSON.stringify(rawIntents).slice(0, 500),
    });

    const good: ParsedIntents = [];
    const rejected: { raw: unknown; issue: string }[] = [];

    for (const raw of rawIntents) {
      const r = ParsedIntentSchema.safeParse(raw);
      if (r.success) {
        good.push(r.data);
        continue;
      }

      // Gemini frequently emits partial intents (e.g. spending without amount)
      // even when the prompt says to downgrade to unknown. Rescue by converting
      // known-but-incomplete intents into unknown with a user-friendly reason.
      const rescued = rescuePartialIntent(raw);
      if (rescued) {
        good.push(rescued);
      } else {
        rejected.push({ raw, issue: r.error.issues[0]?.message ?? "invalid" });
      }
    }

    if (rejected.length > 0) {
      log.warn("parse.intents_rejected", { rejected });
    }

    if (good.length === 0) {
      return [{ intent: "unknown", reason: "Não entendi a mensagem." }];
    }
    return good;
  } catch (err) {
    const e = err as { message?: string; name?: string; stack?: string; status?: number };
    const details = {
      name: e?.name ?? "Unknown",
      message: e?.message ?? String(err),
      status: e?.status ?? null,
      stack: e?.stack?.split("\n").slice(0, 5).join(" | ") ?? null,
    };
    log.error("parse.gemini_failed", details);
    console.error("[parse.gemini_failed]", JSON.stringify(details));

    // Distinguish rate-limit/quota failures so the user sees a useful message.
    const msg = details.message.toLowerCase();
    if (details.status === 429 || msg.includes("quota") || msg.includes("too many")) {
      return [{
        intent: "unknown",
        reason: "Limite de uso atingido. Tente de novo em 1 minuto.",
      }];
    }
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
