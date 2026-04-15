import { createAdminClient } from "@/lib/supabase/admin";
import { parseInput, type ParserInput } from "@/lib/whatsapp/parse";
import type { ParsedIntents, ParsedIntent } from "@/lib/whatsapp/schemas";
import { sendTelegramText } from "./send";
import { log } from "@/lib/log";

/**
 * End-to-end processing of an incoming Telegram message (text OR voice).
 * Idempotent on update_id. Sends the reply directly via sendTelegramText.
 *
 * - /start <token>  → finalize account linking
 * - /start          → onboarding prompt
 * - text / audio    → multi-intent parse, execute each, combined reply
 */

type ChatContext = {
  chatId: number;
  updateId: number;
  messageId: number;
  input: ParserInput;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
};

function formatAmountBRL(reais: number): string {
  return reais.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function normalizeName(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
}

function resolvePetId(
  pets: { id: string; name: string }[],
  petName: string,
): { id: string; name: string } | null {
  const target = normalizeName(petName);
  if (!target) return null;
  const exact = pets.find((p) => normalizeName(p.name) === target);
  if (exact) return exact;
  const partial = pets.find(
    (p) => normalizeName(p.name).includes(target) || target.includes(normalizeName(p.name)),
  );
  return partial ?? null;
}

export async function processIncomingTelegram(ctx: ChatContext): Promise<void> {
  const supabase = createAdminClient();

  // 1. Idempotency on update_id
  const { data: existing } = await supabase
    .from("telegram_messages")
    .select("id")
    .eq("update_id", ctx.updateId)
    .maybeSingle();
  if (existing) return;

  // Derive a text representation for storage/diagnostics.
  const storedText = "text" in ctx.input ? ctx.input.text : "[audio]";

  // 2. Insert received row
  const { data: inserted, error: insertErr } = await supabase
    .from("telegram_messages")
    .insert({
      update_id: ctx.updateId,
      message_id: ctx.messageId,
      chat_id: ctx.chatId,
      raw_text: storedText,
      status: "received",
    })
    .select("id")
    .single();
  if (insertErr || !inserted) {
    log.error("telegram.persist.insert_failed", insertErr);
    return;
  }
  const messageRowId = inserted.id;

  const updateRow = async (patch: Record<string, unknown>) => {
    await supabase.from("telegram_messages").update(patch).eq("id", messageRowId);
  };

  const replyAndFinalize = async (
    reply: string,
    opts: {
      status: "parsed" | "replied" | "failed";
      intent?: string | null;
      parsed?: unknown;
      userId?: string | null;
      error?: string;
    },
  ) => {
    await updateRow({
      status: opts.status,
      intent: opts.intent ?? null,
      parsed_json: { parsed: opts.parsed ?? null, reply },
      user_id: opts.userId ?? null,
      error: opts.error ?? null,
    });
    await sendTelegramText(ctx.chatId, reply);
  };

  // 3. Handle /start <token> — web-initiated linking (text only)
  const textBody = "text" in ctx.input ? ctx.input.text.trim() : "";
  if (textBody.toLowerCase().startsWith("/start")) {
    const parts = textBody.split(/\s+/, 2);
    const token = parts[1]?.trim();

    if (token) {
      const { data: link, error: linkErr } = await supabase
        .from("telegram_links")
        .select("id, user_id, verified")
        .eq("link_token", token)
        .maybeSingle();

      if (linkErr || !link) {
        await replyAndFinalize(
          "Token de vínculo inválido ou expirado. Gere um novo em /settings/telegram no app.",
          { status: "failed", intent: "link", error: "invalid_token" },
        );
        return;
      }

      const { error: upErr } = await supabase
        .from("telegram_links")
        .update({
          chat_id: ctx.chatId,
          username: ctx.username ?? null,
          first_name: ctx.firstName ?? null,
          last_name: ctx.lastName ?? null,
          verified: true,
          linked_at: new Date().toISOString(),
          link_token: null,
        })
        .eq("id", link.id);

      if (upErr) {
        await replyAndFinalize(
          "Erro ao finalizar o vínculo. Tente novamente.",
          { status: "failed", intent: "link", userId: link.user_id, error: upErr.message },
        );
        return;
      }

      await replyAndFinalize(
        "Vinculado com sucesso! Agora voce pode registrar vacinas e gastos por texto ou audio.\n\n" +
          "Exemplos:\n" +
          "• <i>Rex tomou vacina antirrabica hoje, proxima em 1 ano</i>\n" +
          "• <i>Dora tomou o remedio Cincadem hoje. proxima dose em um mes. Gastei 55 reais</i>\n" +
          "• Ou mande um audio descrevendo o mesmo.",
        { status: "replied", intent: "link", userId: link.user_id },
      );
      return;
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://pet-zap.vercel.app";
    await replyAndFinalize(
      `Ola! Para usar o PetZap, crie sua conta em ${appUrl}/signup e vincule este chat em /settings/telegram.`,
      { status: "replied", intent: "onboarding" },
    );
    return;
  }

  // 4. Resolve user by chat_id
  const { data: link } = await supabase
    .from("telegram_links")
    .select("user_id")
    .eq("chat_id", ctx.chatId)
    .eq("verified", true)
    .maybeSingle();

  if (!link) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://pet-zap.vercel.app";
    await replyAndFinalize(
      `Ola! Este chat ainda nao esta vinculado a uma conta. Acesse ${appUrl}/settings/telegram no app pra vincular.`,
      { status: "replied", intent: "onboarding" },
    );
    return;
  }
  const userId = link.user_id as string;

  // 5. Fetch pets
  const { data: pets, error: petsErr } = await supabase
    .from("pets")
    .select("id, name")
    .eq("user_id", userId);

  if (petsErr) {
    log.error("telegram.persist.pets_fetch_failed", petsErr);
    await replyAndFinalize("Erro ao consultar seus pets. Tente novamente.", {
      status: "failed",
      userId,
      error: petsErr.message,
    });
    return;
  }

  const petList = pets ?? [];
  const petNames = petList.map((p) => p.name as string);

  if (petList.length === 0) {
    await replyAndFinalize(
      "Voce ainda nao tem pets cadastrados. Adicione um pet no app antes de registrar vacinas ou gastos.",
      { status: "replied", userId },
    );
    return;
  }

  // 6. Parse (text or audio) into MULTIPLE intents
  const intents: ParsedIntents = await parseInput(ctx.input, petNames);

  // 7. Execute every intent; collect per-intent replies
  const replyLines: string[] = [];
  const executed: { intent: ParsedIntent; ok: boolean; line: string }[] = [];

  for (const parsed of intents) {
    if (parsed.intent === "unknown") {
      const line =
        parsed.reason ??
        "Nao entendi esta parte. Tente: <i>Rex tomou vacina antirrabica hoje</i>.";
      replyLines.push(`❓ ${line}`);
      executed.push({ intent: parsed, ok: false, line });
      continue;
    }

    const pet = resolvePetId(
      petList.map((p) => ({ id: p.id as string, name: p.name as string })),
      parsed.pet_name,
    );
    if (!pet) {
      const line = `Nao reconheci o pet "${parsed.pet_name}". Seus pets: ${petNames.join(", ")}.`;
      replyLines.push(`⚠️ ${line}`);
      executed.push({ intent: parsed, ok: false, line });
      continue;
    }

    if (parsed.intent === "vaccine") {
      const { error: vErr } = await supabase.from("vaccines").insert({
        pet_id: pet.id,
        name: parsed.vaccine_name,
        given_date: parsed.given_date,
        next_date: parsed.next_date,
        notes: parsed.notes ?? null,
      });
      if (vErr) {
        const line = `Falhou salvar vacina ${parsed.vaccine_name} para ${pet.name}.`;
        replyLines.push(`❌ ${line}`);
        executed.push({ intent: parsed, ok: false, line });
      } else {
        const nextPart = parsed.next_date ? ` (proxima: ${parsed.next_date})` : "";
        const line = `Vacina <b>${parsed.vaccine_name}</b> para <b>${pet.name}</b> em ${parsed.given_date}${nextPart}.`;
        replyLines.push(`✅ ${line}`);
        executed.push({ intent: parsed, ok: true, line });
      }
      continue;
    }

    if (parsed.intent === "weight") {
      const { error: wErr } = await supabase.from("pet_weights").insert({
        pet_id: pet.id,
        weight_kg: parsed.weight_kg,
        measured_at: parsed.measured_at,
        notes: parsed.notes ?? null,
      });
      if (wErr) {
        const line = `Falhou salvar peso de ${pet.name}.`;
        replyLines.push(`❌ ${line}`);
        executed.push({ intent: parsed, ok: false, line });
      } else {
        const line = `Peso <b>${parsed.weight_kg} kg</b> para <b>${pet.name}</b> em ${parsed.measured_at}.`;
        replyLines.push(`✅ ${line}`);
        executed.push({ intent: parsed, ok: true, line });
      }
      continue;
    }

    // spending
    const amountCents = Math.round(parsed.amount * 100);
    const { error: sErr } = await supabase.from("spendings").insert({
      pet_id: pet.id,
      amount_cents: amountCents,
      currency: "BRL",
      category: parsed.category,
      spent_at: parsed.spent_at,
      description: parsed.description ?? null,
      next_due: parsed.next_due ?? null,
    });
    if (sErr) {
      const line = `Falhou salvar gasto para ${pet.name}.`;
      replyLines.push(`❌ ${line}`);
      executed.push({ intent: parsed, ok: false, line });
    } else {
      const descPart = parsed.description ? ` — ${parsed.description}` : ` (${parsed.category})`;
      const nextPart = parsed.next_due ? ` • proxima: ${parsed.next_due}` : "";
      const line = `${formatAmountBRL(parsed.amount)}${descPart} para <b>${pet.name}</b> em ${parsed.spent_at}${nextPart}.`;
      replyLines.push(`✅ ${line}`);
      executed.push({ intent: parsed, ok: true, line });
    }
  }

  const allOk = executed.every((e) => e.ok);
  const replyBody = replyLines.join("\n");
  const finalStatus: "parsed" | "replied" | "failed" = allOk
    ? "parsed"
    : executed.some((e) => e.ok)
      ? "replied"
      : "failed";

  // telegram_messages.intent has a CHECK constraint: vaccine|spending|unknown|onboarding|link.
  // For multi-intent messages or intents outside that set (e.g. weight), store null
  // and rely on parsed_json for the full array.
  const ALLOWED_INTENT_VALUES = new Set(["vaccine", "spending", "unknown", "onboarding", "link"]);
  const intentForRow =
    intents.length === 1 && ALLOWED_INTENT_VALUES.has(intents[0].intent)
      ? intents[0].intent
      : null;

  await replyAndFinalize(replyBody, {
    status: finalStatus,
    intent: intentForRow,
    parsed: intents,
    userId,
  });
}
