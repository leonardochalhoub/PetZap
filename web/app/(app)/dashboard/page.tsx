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

  const today = todayISO();
  const in30d = inDaysISO(30);
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

  return (
    <DashboardClient
      pets={pets ?? []}
      vaccinesUpcoming={vaccinesUpcoming ?? []}
      spendingsRecent={spendingsRecent ?? []}
      spendingsForChart={spendingsForChart ?? []}
      weightsForChart={weightsForChart}
    />
  );
}
