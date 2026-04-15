"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import { createPet } from "@/lib/actions/pets";
import type { ActionResult } from "@/lib/actions/auth";
import { SubmitButton } from "@/components/submit-button";
import { useT, useLocale } from "@/i18n/client";
import { getBreedsForSpecies, type Species } from "@/lib/breeds";

const SPECIES: Species[] = ["dog", "cat", "bird", "rabbit", "other"];
type SexValue = "male" | "female" | "";

const inputCls =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder-stone-400 focus:border-stone-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400";

const labelCls =
  "mb-1 block text-sm font-medium text-stone-700 dark:text-zinc-300";

const speciesEmoji: Record<Species, string> = {
  dog: "🐶", cat: "🐱", bird: "🐦", rabbit: "🐰", other: "🐾",
};

export function NewPetForm() {
  const t = useT();
  const locale = useLocale();
  const [state, formAction] = useActionState<ActionResult | undefined, FormData>(
    createPet,
    undefined
  );

  const [species, setSpecies] = useState<Species>("dog");
  const [sex, setSex] = useState<SexValue>("");
  const [neutered, setNeutered] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const breedOptions = useMemo(() => {
    const localeKey = locale === "pt-BR" ? "pt" : "en";
    return [...getBreedsForSpecies(species)].sort((a, b) =>
      a.names[localeKey].localeCompare(b.names[localeKey], locale)
    );
  }, [species, locale]);

  const datalistId = `breeds-${species}`;
  const localeKey = locale === "pt-BR" ? "pt" : "en";

  const speciesLabel = (s: Species): string => {
    if (sex && t.speciesGendered[s]) {
      return t.speciesGendered[s][sex];
    }
    return t.species[s];
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setPhotoPreview(null);
      return;
    }
    setPhotoPreview(URL.createObjectURL(file));
  };

  const clearPhoto = () => {
    if (fileRef.current) fileRef.current.value = "";
    setPhotoPreview(null);
  };

  return (
    <form
      action={formAction}
      className="space-y-5 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div>
        <span className={labelCls}>{t.pets.photoOptional}</span>
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-stone-200 bg-gradient-to-br from-indigo-100 to-pink-100 dark:border-zinc-800 dark:from-indigo-500/20 dark:to-pink-500/20">
            {photoPreview ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={photoPreview} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-3xl">
                {speciesEmoji[species]}
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex cursor-pointer items-center rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-stone-900 transition-colors hover:bg-stone-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700">
              {photoPreview ? t.pets.changePhoto : t.pets.uploadPhoto}
              <input
                ref={fileRef}
                type="file"
                name="photo"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </label>
            {photoPreview ? (
              <button
                type="button"
                onClick={clearPhoto}
                className="text-xs text-stone-600 underline hover:text-stone-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                {t.pets.removePhoto}
              </button>
            ) : null}
            <p className="basis-full text-xs text-stone-500 dark:text-zinc-400">{t.pets.photoHint}</p>
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="name" className={labelCls}>{t.pets.name}</label>
        <input
          id="name"
          name="name"
          required
          maxLength={80}
          placeholder={t.placeholders.petName}
          className={inputCls}
        />
      </div>

      <div>
        <span className={labelCls}>{t.pets.sex}</span>
        <div role="radiogroup" aria-label={t.pets.sex} className="flex flex-wrap gap-2">
          {([
            { v: "", label: t.pets.sexUnknown },
            { v: "male", label: t.pets.sexMale },
            { v: "female", label: t.pets.sexFemale },
          ] as const).map((opt) => {
            const active = sex === opt.v;
            return (
              <button
                key={opt.v || "unknown"}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setSex(opt.v)}
                className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                  active
                    ? "border-stone-900 bg-stone-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
                    : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-800"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        <input type="hidden" name="sex" value={sex} />
      </div>

      <div>
        <label htmlFor="species" className={labelCls}>{t.pets.species}</label>
        <select
          id="species"
          name="species"
          required
          value={species}
          onChange={(e) => setSpecies(e.target.value as Species)}
          className={inputCls}
        >
          {SPECIES.map((s) => (
            <option key={s} value={s}>{speciesLabel(s)}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="inline-flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            name="neutered"
            checked={neutered}
            onChange={(e) => setNeutered(e.target.checked)}
            className="h-4 w-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900 dark:border-zinc-700"
          />
          <span className="text-sm text-stone-700 dark:text-zinc-300">{t.pets.neutered}</span>
        </label>
      </div>

      <div>
        <label htmlFor="breed" className={labelCls}>{t.pets.breed}</label>
        <input
          id="breed"
          name="breed"
          maxLength={80}
          placeholder={t.placeholders.breed}
          list={datalistId}
          className={inputCls}
          autoComplete="off"
        />
        <datalist id={datalistId}>
          {breedOptions.map((b) => (
            <option key={b.id} value={b.names[localeKey]} />
          ))}
        </datalist>
        <p className="mt-1 text-xs text-stone-500 dark:text-zinc-400">{t.pets.breedPickFromList}</p>
      </div>

      <div>
        <label htmlFor="birthdate" className={labelCls}>{t.pets.birthdate}</label>
        <input id="birthdate" name="birthdate" type="date" className={inputCls} />
      </div>

      <div>
        <label htmlFor="weight_kg" className={labelCls}>{t.pets.weightInitial}</label>
        <input
          id="weight_kg"
          name="weight_kg"
          type="number"
          step="0.1"
          min="0.1"
          max="199"
          inputMode="decimal"
          placeholder={t.placeholders.weightKg}
          className={inputCls}
        />
        <p className="mt-1 text-xs text-stone-500 dark:text-zinc-400">{t.pets.weightInitialHint}</p>
      </div>

      {state?.error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      ) : null}
      <div className="flex justify-end">
        <SubmitButton pendingLabel={t.pets.creating}>{t.pets.create}</SubmitButton>
      </div>
    </form>
  );
}
