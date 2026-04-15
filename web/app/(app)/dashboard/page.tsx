import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "@/components/dashboard-client";

export const dynamic = "force-dynamic";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function inDaysISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const CHART_MONTHS = 24;

type WeightRow = {
  measured_at: string;
  weight_kg: number;
  pet_id: string;
  pets: { id: string; name: string } | null;
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const meta = (user.user_metadata ?? {}) as { full_name?: string; treatment?: string };
  const firstName = (meta.full_name ?? user.email?.split("@")[0] ?? "").split(" ")[0];
  const treatment: "male" | "female" | "neutral" =
    meta.treatment === "male" || meta.treatment === "female" ? meta.treatment : "neutral";

  const today = todayISO();
  const in30d = inDaysISO(30);
  const in14d = inDaysISO(14);
  const last30dStart = inDaysISO(-30);

  const chartStart = new Date();
  chartStart.setMonth(chartStart.getMonth() - (CHART_MONTHS - 1), 1);
  const chartStartISO = chartStart.toISOString().slice(0, 10);

  const [
    { data: pets },
    { data: vaccinesUpcoming },
    { data: spendingsRecent },
    { data: spendingsForChart },
    { data: weightsRaw },
    { data: vaccineAlertsRaw },
    { data: medicationAlertsRaw },
  ] = await Promise.all([
    supabase
      .from("pets")
      .select("id, name, species, photo_url, photo_zoom, sort_order")
      .order("sort_order", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("vaccines")
      .select("id, pet_id")
      .not("next_date", "is", null)
      .gte("next_date", today)
      .lte("next_date", in30d)
      .returns<{ id: string; pet_id: string }[]>(),
    supabase
      .from("spendings")
      .select("id, pet_id")
      .gte("spent_at", last30dStart)
      .returns<{ id: string; pet_id: string }[]>(),
    supabase
      .from("spendings")
      .select("amount_cents, category, spent_at, pet_id")
      .gte("spent_at", chartStartISO)
      .returns<{ amount_cents: number; category: string; spent_at: string; pet_id: string }[]>(),
    supabase
      .from("pet_weights")
      .select("measured_at, weight_kg, pet_id, pets!inner(id, name)")
      .order("measured_at", { ascending: true })
      .returns<WeightRow[]>(),
    // Upcoming vaccines (next 14 days) for in-app alerts
    supabase
      .from("vaccines")
      .select("id, name, next_date, pet_id, pets!inner(id, name)")
      .not("next_date", "is", null)
      .gte("next_date", today)
      .lte("next_date", in14d)
      .order("next_date", { ascending: true })
      .returns<{ id: string; name: string; next_date: string; pet_id: string; pets: { id: string; name: string } | null }[]>(),
    // Upcoming meds (next 14 days)
    supabase
      .from("spendings")
      .select("id, description, next_due, pet_id, pets!inner(id, name)")
      .eq("category", "medicine")
      .not("next_due", "is", null)
      .gte("next_due", today)
      .lte("next_due", in14d)
      .order("next_due", { ascending: true })
      .returns<{ id: string; description: string | null; next_due: string; pet_id: string; pets: { id: string; name: string } | null }[]>(),
  ]);

  const weightsForChart =
    (weightsRaw ?? [])
      .filter((w) => w.pets)
      .map((w) => ({
        measured_at: w.measured_at,
        weight_kg: w.weight_kg,
        pet_id: w.pet_id,
        pet_name: w.pets!.name,
      }));

  // Build the in-app alert list (vaccines + meds in next 14 days)
  const todayDate = new Date(today + "T00:00:00");
  const dayMs = 86400000;
  const alerts = [
    ...(vaccineAlertsRaw ?? []).filter((v) => v.pets).map((v) => ({
      kind: "vaccine" as const,
      petId: v.pets!.id,
      petName: v.pets!.name,
      itemName: v.name,
      dueDate: v.next_date,
      daysUntil: Math.round((new Date(v.next_date + "T00:00:00").getTime() - todayDate.getTime()) / dayMs),
    })),
    ...(medicationAlertsRaw ?? []).filter((m) => m.pets).map((m) => ({
      kind: "medication" as const,
      petId: m.pets!.id,
      petName: m.pets!.name,
      itemName: m.description ?? "Medicamento",
      dueDate: m.next_due,
      daysUntil: Math.round((new Date(m.next_due + "T00:00:00").getTime() - todayDate.getTime()) / dayMs),
    })),
  ].sort((a, b) => a.daysUntil - b.daysUntil);

  return (
    <DashboardClient
      firstName={firstName}
      treatment={treatment}
      pets={pets ?? []}
      vaccinesUpcoming={vaccinesUpcoming ?? []}
      spendingsRecent={spendingsRecent ?? []}
      spendingsForChart={spendingsForChart ?? []}
      weightsForChart={weightsForChart}
      alerts={alerts}
    />
  );
}
