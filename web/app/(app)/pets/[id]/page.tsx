import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VaccineList } from "@/components/vaccine-list";
import { AddVaccineForm } from "@/components/add-vaccine-form";
import { SpendingList } from "@/components/spending-list";
import { AddSpendingForm } from "@/components/add-spending-form";
import { PhotoSection } from "@/components/photo-section";
import { PetSummary } from "@/components/pet-summary";
import { WeightSection } from "@/components/weight-section";
import { DeletePetButton } from "./delete-pet-button";
import { getDictionary } from "@/i18n/server";

export const dynamic = "force-dynamic";

type PetRow = {
  id: string;
  name: string;
  species: string;
  sex: "male" | "female" | null;
  neutered: boolean;
  breed: string | null;
  birthdate: string | null;
  photo_url: string | null;
  photo_zoom: number | null;
};

type WeightRow = {
  id: string;
  weight_kg: number;
  measured_at: string;
  notes: string | null;
};

export default async function PetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const t = await getDictionary();

  const { data: pet } = await supabase
    .from("pets")
    .select("id, name, species, sex, neutered, breed, birthdate, photo_url, photo_zoom")
    .eq("id", id)
    .maybeSingle<PetRow>();
  if (!pet) notFound();

  const [{ data: vaccines }, { data: spendings }, { data: weights }] = await Promise.all([
    supabase
      .from("vaccines")
      .select("id, name, given_date, next_date, notes")
      .eq("pet_id", id)
      .order("given_date", { ascending: false }),
    supabase
      .from("spendings")
      .select("id, amount_cents, currency, category, spent_at, description, next_due")
      .eq("pet_id", id)
      .order("spent_at", { ascending: false }),
    supabase
      .from("pet_weights")
      .select("id, weight_kg, measured_at, notes")
      .eq("pet_id", id)
      .order("measured_at", { ascending: false })
      .returns<WeightRow[]>(),
  ]);

  const weightList = weights ?? [];
  const currentWeight = weightList[0]?.weight_kg ?? null;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard"
          className="text-sm text-stone-600 hover:text-stone-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          &larr; {t.pets.back}
        </Link>
        <div className="mt-2 flex items-start justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-zinc-50">
            {pet.name}
          </h1>
          <DeletePetButton petId={pet.id} />
        </div>
      </div>

      <PhotoSection
        petId={pet.id}
        species={pet.species}
        petName={pet.name}
        initialPhotoUrl={pet.photo_url ?? null}
        initialZoom={pet.photo_zoom ?? 1}
      />

      <PetSummary
        pet={{
          species: pet.species,
          sex: pet.sex,
          neutered: pet.neutered,
          breed: pet.breed,
          birthdate: pet.birthdate,
        }}
        currentWeight={currentWeight}
      />

      <WeightSection petId={pet.id} initialWeights={weightList} />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-stone-900 dark:text-zinc-50">
          {t.spendings.heading}
        </h2>
        <AddSpendingForm petId={pet.id} />
        <SpendingList petId={pet.id} spendings={spendings ?? []} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-stone-900 dark:text-zinc-50">
          {t.vaccines.heading}
        </h2>
        <AddVaccineForm petId={pet.id} />
        <VaccineList petId={pet.id} vaccines={vaccines ?? []} />
      </section>
    </div>
  );
}
