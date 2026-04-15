import { createAdminClient } from "@/lib/supabase/admin";
import { parseMessage } from "./parse";
import type { ParsedIntent } from "./schemas";

/**
 * End-to-end processing of an incoming WhatsApp message.
 * Idempotent on messageId. Returns the confirmation reply to send back.
 */

type ProcessResult = { reply: string };

function formatDateBR(iso: string): string {
  // Keep ISO YYYY-MM-DD for auditability; reply string uses the ISO as spec'd.
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
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function resolvePetId(
  pets: { id: string; name: string }[],
  petName: string,
): { id: string; name: string } | null {
  const target = normalizeName(petName);
  if (!target) return null;
  // exact (normalized) match first
  const exact = pets.find((p) => normalizeName(p.name) === target);
  if (exact) return exact;
  // substring match as fallback
  const partial = pets.find(
    (p) => normalizeName(p.name).includes(target) || target.includes(normalizeName(p.name)),
  );
  return partial ?? null;
}

export async function processIncomingMessage(
  phone: string,
  text: string,
  messageId: string,
): Promise<ProcessResult> {
  const supabase = createAdminClient();

  // 1. Idempotency
  const { data: existing } = await supabase
    .from("whatsapp_messages")
    .select("id, parsed_json, intent, status")
    .eq("message_id", messageId)
    .maybeSingle();

  if (existing) {
    const cachedReply =
      (existing.parsed_json as { reply?: string } | null)?.reply ??
      "Mensagem já processada.";
    return { reply: cachedReply };
  }

  // 2. Insert received row
  const { data: inserted, error: insertErr } = await supabase
    .from("whatsapp_messages")
    .insert({
      message_id: messageId,
      phone,
      raw_text: text,
      status: "received",
    })
    .select("id")
    .single();

  if (insertErr || !inserted) {
    console.error("[whatsapp.persist] failed to insert message row", insertErr);
    return { reply: "Erro interno ao registrar a mensagem. Tente novamente em instantes." };
  }

  const messageRowId = inserted.id;

  const finalize = async (
    reply: string,
    opts: {
      status: "parsed" | "replied" | "failed";
      intent?: "vaccine" | "spending" | "unknown" | "onboarding";
      parsed?: ParsedIntent | null;
      userId?: string | null;
      error?: string;
    },
  ) => {
    await supabase
      .from("whatsapp_messages")
      .update({
        status: opts.status,
        intent: opts.intent ?? null,
        parsed_json: { parsed: opts.parsed ?? null, reply },
        user_id: opts.userId ?? null,
        error: opts.error ?? null,
      })
      .eq("id", messageRowId);
  };

  // 3. Resolve user
  const { data: link } = await supabase
    .from("whatsapp_links")
    .select("user_id")
    .eq("phone", phone)
    .eq("verified", true)
    .maybeSingle();

  if (!link) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    const reply = `Olá! Para começar, crie sua conta em ${appUrl}/signup e vincule este número em /settings/whatsapp`;
    await finalize(reply, { status: "replied", intent: "onboarding" });
    return { reply };
  }

  const userId = link.user_id as string;

  // 4. Fetch user's pets
  const { data: pets, error: petsErr } = await supabase
    .from("pets")
    .select("id, name")
    .eq("user_id", userId);

  if (petsErr) {
    console.error("[whatsapp.persist] pets fetch failed", petsErr);
    const reply = "Erro ao consultar seus pets. Tente novamente.";
    await finalize(reply, { status: "failed", userId, error: petsErr.message });
    return { reply };
  }

  const petList = pets ?? [];
  const petNames = petList.map((p) => p.name as string);

  // 5. Parse
  const parsed = await parseMessage(text, petNames);

  // 6. Unknown intent
  if (parsed.intent === "unknown") {
    const reply =
      "Desculpe, não entendi. Tente: 'Rex tomou vacina antirrábica hoje, próxima em 1 ano' ou 'Gastei 50 reais com ração para o Rex'.";
    await finalize(reply, { status: "replied", intent: "unknown", parsed, userId });
    return { reply };
  }

  // 7. Resolve pet
  if (petList.length === 0) {
    const reply =
      "Você ainda não tem pets cadastrados. Adicione um pet no app antes de registrar vacinas ou gastos.";
    await finalize(reply, { status: "replied", intent: parsed.intent, parsed, userId });
    return { reply };
  }

  const pet = resolvePetId(
    petList.map((p) => ({ id: p.id as string, name: p.name as string })),
    parsed.pet_name,
  );

  if (!pet) {
    const nameList = petNames.join(", ");
    const reply = `Não reconheci o pet "${parsed.pet_name}". Seus pets são: ${nameList}. Pode repetir mencionando o nome exato?`;
    await finalize(reply, { status: "replied", intent: parsed.intent, parsed, userId });
    return { reply };
  }

  // 8. Insert intent-specific row
  if (parsed.intent === "vaccine") {
    const { error: vErr } = await supabase.from("vaccines").insert({
      pet_id: pet.id,
      name: parsed.vaccine_name,
      given_date: parsed.given_date,
      next_date: parsed.next_date,
      notes: parsed.notes ?? null,
    });

    if (vErr) {
      console.error("[whatsapp.persist] vaccine insert failed", vErr);
      const reply = "Não consegui salvar a vacina. Tente novamente.";
      await finalize(reply, { status: "failed", intent: "vaccine", parsed, userId, error: vErr.message });
      return { reply };
    }

    const nextPart = parsed.next_date
      ? ` Próxima dose: ${formatDateBR(parsed.next_date)}.`
      : "";
    const reply = `Anotado: vacina ${parsed.vaccine_name} para ${pet.name} em ${formatDateBR(parsed.given_date)}.${nextPart}`;
    await finalize(reply, { status: "parsed", intent: "vaccine", parsed, userId });
    return { reply };
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
    console.error("[whatsapp.persist] spending insert failed", sErr);
    const reply = "Não consegui salvar o gasto. Tente novamente.";
    await finalize(reply, { status: "failed", intent: "spending", parsed, userId, error: sErr.message });
    return { reply };
  }

  const descPart = parsed.description ? ` com ${parsed.description}` : ` (${parsed.category})`;
  const reply = `Anotado: ${formatAmountBRL(parsed.amount)}${descPart} para ${pet.name} em ${formatDateBR(parsed.spent_at)}.`;
  await finalize(reply, { status: "parsed", intent: "spending", parsed, userId });
  return { reply };
}
