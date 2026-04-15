"use client";

import Link from "next/link";
import type { Pet } from "@/lib/db-schemas";

const speciesEmoji: Record<string, string> = {
  dog: "🐶",
  cat: "🐱",
  bird: "🐦",
  rabbit: "🐰",
  other: "🐾",
};

type ThumbPet = Pick<Pet, "id" | "name" | "species" | "photo_url"> & {
  photo_zoom?: number | null;
};

export function PetThumb({ pet }: { pet: ThumbPet }) {
  const zoom = pet.photo_zoom ?? 1;
  return (
    <Link
      href={`/pets/${pet.id}`}
      className="group flex flex-col items-center gap-2"
      title={pet.name}
    >
      <div className="aspect-square w-full overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition-all group-hover:-translate-y-0.5 group-hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
        {pet.photo_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={pet.photo_url}
            alt={pet.name}
            className="h-full w-full object-cover"
            style={zoom !== 1 ? { transform: `scale(${zoom})` } : undefined}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-100 to-pink-100 text-4xl dark:from-indigo-500/20 dark:to-pink-500/20">
            {speciesEmoji[pet.species] ?? "🐾"}
          </div>
        )}
      </div>
      <p className="w-full truncate text-center text-sm font-medium text-stone-900 dark:text-zinc-50">
        {pet.name}
      </p>
    </Link>
  );
}

export function AddPetTile({ label }: { label: string }) {
  return (
    <Link
      href="/pets/new"
      className="group flex flex-col items-center gap-2"
      aria-label={label}
    >
      <div className="flex aspect-square w-full items-center justify-center rounded-2xl border-2 border-dashed border-stone-300 bg-white/40 text-4xl font-light text-stone-400 transition-all group-hover:-translate-y-0.5 group-hover:border-stone-500 group-hover:bg-white group-hover:text-stone-700 group-hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-600 dark:group-hover:border-stone-500 dark:group-hover:bg-stone-900 dark:group-hover:text-stone-300">
        +
      </div>
      <p className="w-full truncate text-center text-sm font-medium text-stone-700 dark:text-zinc-300">
        {label}
      </p>
    </Link>
  );
}
