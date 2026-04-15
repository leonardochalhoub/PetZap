import { getDictionary } from "@/i18n/server";
import { estimateLifespan, type Species } from "@/lib/breeds";

type SexValue = "male" | "female" | null | undefined;

type Props = {
  pet: {
    species: string;
    sex: SexValue;
    neutered: boolean | null | undefined;
    breed: string | null;
    birthdate: string | null;
  };
  currentWeight: number | null;
};

function computeAge(birthIso: string): { years: number; months: number } | null {
  const birth = new Date(birthIso);
  if (isNaN(birth.getTime())) return null;
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  const days = now.getDate() - birth.getDate();
  if (days < 0) months -= 1;
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return { years: Math.max(0, years), months: Math.max(0, months) };
}

function speciesLabel(
  t: Awaited<ReturnType<typeof getDictionary>>,
  species: string,
  sex: SexValue
): string {
  const sp = species as Species;
  if (sex && (sp in t.speciesGendered)) {
    return t.speciesGendered[sp][sex];
  }
  return t.species[sp] ?? species;
}

export async function PetSummary({ pet, currentWeight }: Props) {
  const t = await getDictionary();
  const age = pet.birthdate ? computeAge(pet.birthdate) : null;
  const lifespan = estimateLifespan(
    (pet.species as Species) ?? "other",
    pet.breed ?? null,
    pet.sex ?? null,
    pet.neutered ?? false
  );

  const chips: string[] = [];
  chips.push(speciesLabel(t, pet.species, pet.sex));
  if (pet.breed) chips.push(pet.breed);
  if (pet.neutered) chips.push(t.pets.neuteredYes);
  if (age) {
    if (age.years >= 2) {
      chips.push(`${age.years} ${t.pets.yearsShort}`);
    } else {
      chips.push(`${age.years} ${t.pets.yearsShort} ${age.months} ${t.pets.monthsShort}`);
    }
  }
  if (currentWeight !== null) {
    chips.push(`${currentWeight} ${t.pets.weightUnitShort}`);
  }

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500 dark:text-zinc-400">
        {t.pets.summary}
      </h2>
      <div className="flex flex-wrap gap-2">
        {chips.map((c, i) => (
          <span
            key={i}
            className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700 dark:bg-zinc-800 dark:text-zinc-200"
          >
            {c}
          </span>
        ))}
        {!age && !pet.birthdate ? (
          <span className="rounded-full border border-dashed border-stone-300 px-3 py-1 text-xs text-stone-500 dark:border-zinc-700 dark:text-zinc-500">
            {t.pets.ageUnknown}
          </span>
        ) : null}
      </div>
      <div className="mt-4 border-t border-stone-100 pt-4 dark:border-zinc-800">
        <p className="text-sm text-stone-700 dark:text-zinc-300">
          <span className="font-medium">{t.pets.lifeExpectancy}:</span>{" "}
          <span className="text-stone-900 dark:text-zinc-50">
            {lifespan.min}–{lifespan.max} {t.pets.lifeExpectancyUnit}
          </span>
        </p>
        <p className="mt-1 text-xs italic text-stone-500 dark:text-zinc-400">
          {t.pets.lifeExpectancyHint}
        </p>
      </div>
    </section>
  );
}
