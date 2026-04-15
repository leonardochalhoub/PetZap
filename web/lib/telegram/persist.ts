import { createAdminClient } from "@/lib/supabase/admin";
import { parseMessage } from "@/lib/whatsapp/parse";
import type { ParsedIntent } from "@/lib/whatsapp/schemas";
import { sendTelegramText } from "./send";
import { log } from "@/lib/log";

/**
 * End-to-end processing of an incoming Telegram message.
 * Idempotent on update_id. Returns nothing — reply is sent directly.
 *
 * Special commands:
 *   /start <token>  — finalizes web-initiated account linking
 *   /start          — onboarding reply
 *   plain text      — parsed via Gemini, dispatched to vaccine/spending
 */

type ChatContext = {
  chatId: number;
  updateId: number;
  messageId: number;
  text: string;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
};

function formatDateBR(iso: string): string {
  return iso;
}

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

  // 2. Insert received row
  const { data: inserted, error: insertErr } = await supabase
    .from("telegram_messages")
    .insert({
      update_id: ctx.updateId,
      message_id: ctx.messageId,
      chat_id: ctx.chatId,
      raw_text: ctx.text,
      status: "received",
    })
    .select("id")
    .single();
  if (insertErr || !inserted) {
    log.error("telegram.persist.insert_failed", insertErr);
    return;
  }
  const messageRowId = inserted.id;

  const finalize = async (
    reply: string,
    opts: {
      status: "parsed" | "replied" | "failed";
      intent?: "vaccine" | "spending" | "unknown" | "onboarding" | "link";
      parsed?: ParsedIntent | null;
      userId?: string | null;
      error?: string;
    },
  ) => {
    await supabase
      .from("telegram_messages")
      .update({
        status: opts.status,
        intent: opts.intent ?? null,
        parsed_json: { parsed: opts.parsed ?? null, reply },
        user_id: opts.userId ?? null,
        error: opts.error ?? null,
      })
      .eq("id", messageRowId);
    await sendTelegramText(ctx.chatId, reply);
  };

  const trimmed = ctx.text.trim();

  // 3. Handle /start <token> — web-initiated linking
  if (trimmed.toLowerCase().startsWith("/start")) {
    const parts = trimmed.split(/\s+/, 2);
    const token = parts[1]?.trim();

    if (token) {
      const { data: link, error: linkErr } = await supabase
        .from("telegram_links")
        .select("id, user_id, verified")
        .eq("link_token", token)
        .maybeSingle();

      if (linkErr || !link) {
        const reply = "Token de vínculo inválido ou expirado. Gere um novo em /settings/telegram no app.";
        await finalize(reply, { status: "failed", intent: "link", error: "invalid_token" });
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
        const reply = "Erro ao finalizar o vínculo. Tente novamente.";
        await finalize(reply, { status: "failed", intent: "link", userId: link.user_id, error: upErr.message });
        return;
      }

      const reply =
        "Vinculado com sucesso! Agora voce pode registrar vacinas e gastos direto por aqui.\n\n" +
        "Exemplos:\n" +
        "• <i>Rex tomou vacina antirrabica hoje, proxima em 1 ano</i>\n" +
        "• <i>Gastei 50 reais com racao pro Rex</i>";
      await finalize(reply, { status: "replied", intent: "link", userId: link.user_id });
      return;
    }

    // /start without token — show onboarding
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://pet-zap.vercel.app";
    const reply =
      `Ola! Para usar o PetZap, crie sua conta em ${appUrl}/signup e vincule este chat em /settings/telegram.`;
    await finalize(reply, { status: "replied", intent: "onboarding" });
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
    const reply =
      `Ola! Este chat ainda nao esta vinculado a uma conta. Acesse ${appUrl}/settings/telegram no app pra vincular.`;
    await finalize(reply, { status: "replied", intent: "onboarding" });
    return;
  }
  const userId = link.user_id as string;

  // 5. Fetch user's pets
  const { data: pets, error: petsErr } = await supabase
    .from("pets")
    .select("id, name")
    .eq("user_id", userId);

  if (petsErr) {
    log.error("telegram.persist.pets_fetch_failed", petsErr);
    await finalize("Erro ao consultar seus pets. Tente novamente.", {
      status: "failed",
      userId,
      error: petsErr.message,
    });
    return;
  }

  const petList = pets ?? [];
  const petNames = petList.map((p) => p.name as string);

  // 6. Parse via Gemini
  const parsed = await parseMessage(ctx.text, petNames);

  // 7. Unknown intent
  if (parsed.intent === "unknown") {
    const reply =
      "Desculpe, nao entendi. Tente: <i>Rex tomou vacina antirrabica hoje, proxima em 1 ano</i> ou <i>Gastei 50 reais com racao pro Rex</i>.";
    await finalize(reply, { status: "replied", intent: "unknown", parsed, userId });
    return;
  }

  // 8. Resolve pet
  if (petList.length === 0) {
    await finalize(
      "Voce ainda nao tem pets cadastrados. Adicione um pet no app antes de registrar vacinas ou gastos.",
      { status: "replied", intent: parsed.intent, parsed, userId },
    );
    return;
  }

  const pet = resolvePetId(
    petList.map((p) => ({ id: p.id as string, name: p.name as string })),
    parsed.pet_name,
  );

  if (!pet) {
    const nameList = petNames.join(", ");
    await finalize(
      `Nao reconheci o pet "${parsed.pet_name}". Seus pets sao: ${nameList}. Pode repetir mencionando o nome exato?`,
      { status: "replied", intent: parsed.intent, parsed, userId },
    );
    return;
  }

  // 9. Insert intent-specific row
  if (parsed.intent === "vaccine") {
    const { error: vErr } = await supabase.from("vaccines").insert({
      pet_id: pet.id,
      name: parsed.vaccine_name,
      given_date: parsed.given_date,
      next_date: parsed.next_date,
      notes: parsed.notes ?? null,
    });
    if (vErr) {
      await finalize("Nao consegui salvar a vacina. Tente novamente.", {
        status: "failed",
        intent: "vaccine",
        parsed,
        userId,
        error: vErr.message,
      });
      return;
    }
    const nextPart = parsed.next_date
      ? ` Proxima dose: ${formatDateBR(parsed.next_date)}.`
      : "";
    await finalize(
      `Anotado: vacina ${parsed.vaccine_name} para ${pet.name} em ${formatDateBR(parsed.given_date)}.${nextPart}`,
      { status: "parsed", intent: "vaccine", parsed, userId },
    );
    return;
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
  });
  if (sErr) {
    await finalize("Nao consegui salvar o gasto. Tente novamente.", {
      status: "failed",
      intent: "spending",
      parsed,
      userId,
      error: sErr.message,
    });
    return;
  }
  const descPart = parsed.description ? ` com ${parsed.description}` : ` (${parsed.category})`;
  await finalize(
    `Anotado: ${formatAmountBRL(parsed.amount)}${descPart} para ${pet.name} em ${formatDateBR(parsed.spent_at)}.`,
    { status: "parsed", intent: "spending", parsed, userId },
  );
}
