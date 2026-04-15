"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { addVaccine } from "@/lib/actions/vaccines";
import type { ActionResult } from "@/lib/actions/auth";
import { SubmitButton } from "./submit-button";
import { useT } from "@/i18n/client";

const inputCls =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder-stone-400 focus:border-stone-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400";

const labelCls =
  "mb-1 block text-xs font-medium text-stone-700 dark:text-zinc-300";

function plusOneYear(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return iso;
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

export function AddVaccineForm({ petId }: { petId: string }) {
  const t = useT();
  const action = addVaccine.bind(null, petId);
  const [state, formAction] = useActionState<ActionResult | undefined, FormData>(
    action,
    undefined
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [given, setGiven] = useState("");
  const [next, setNext] = useState("");
  const [nextTouched, setNextTouched] = useState(false);

  useEffect(() => {
    if (state?.data) {
      formRef.current?.reset();
      setGiven("");
      setNext("");
      setNextTouched(false);
    }
  }, [state]);

  const onGivenChange = (v: string) => {
    setGiven(v);
    if (v && !nextTouched) {
      setNext(plusOneYear(v));
    }
  };

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <h3 className="text-sm font-semibold text-stone-900 dark:text-zinc-50">
        {t.vaccines.addHeading}
      </h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="vac-name" className={labelCls}>{t.vaccines.name}</label>
          <input
            id="vac-name"
            name="name"
            required
            maxLength={120}
            placeholder={t.placeholders.vaccineName}
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="vac-given" className={labelCls}>{t.vaccines.givenDate}</label>
          <input
            id="vac-given"
            name="given_date"
            type="date"
            required
            value={given}
            onChange={(e) => onGivenChange(e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="vac-next" className={labelCls}>{t.vaccines.nextDate}</label>
          <input
            id="vac-next"
            name="next_date"
            type="date"
            value={next}
            onChange={(e) => {
              setNext(e.target.value);
              setNextTouched(true);
            }}
            className={inputCls}
          />
          <p className="mt-1 text-xs text-stone-500 dark:text-zinc-400">
            {t.vaccines.nextDateAutoFillHint}
          </p>
        </div>
        <div>
          <label htmlFor="vac-notes" className={labelCls}>{t.vaccines.notes}</label>
          <input
            id="vac-notes"
            name="notes"
            maxLength={500}
            placeholder={t.placeholders.vaccineNotes}
            className={inputCls}
          />
        </div>
      </div>
      {state?.error ? (
        <p className="text-xs text-red-600 dark:text-red-400">{state.error}</p>
      ) : null}
      <div className="flex justify-end">
        <SubmitButton pendingLabel={t.vaccines.adding}>{t.vaccines.add}</SubmitButton>
      </div>
    </form>
  );
}
