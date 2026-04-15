"use client";

import { useTransition } from "react";
import { deletePet } from "@/lib/actions/pets";
import { useT } from "@/i18n/client";

export function DeletePetButton({ petId }: { petId: string }) {
  const t = useT();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        if (!confirm(t.pets.deleteConfirm)) return;
        startTransition(async () => {
          await deletePet(petId);
        });
      }}
      className="shrink-0 rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 disabled:text-red-300 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/50"
    >
      {isPending ? t.pets.deleting : t.pets.delete}
    </button>
  );
}
