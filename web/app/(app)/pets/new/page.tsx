import Link from "next/link";
import { NewPetForm } from "./new-pet-form";
import { getDictionary } from "@/i18n/server";

export default async function NewPetPage() {
  const t = await getDictionary();
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <Link
          href="/pets"
          className="text-sm text-stone-600 hover:text-stone-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          &larr; {t.pets.back}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900 dark:text-zinc-50">
          {t.pets.newTitle}
        </h1>
      </div>
      <NewPetForm />
    </div>
  );
}
