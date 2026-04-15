"use client";

import { useFormStatus } from "react-dom";

type Props = {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
  variant?: "primary" | "secondary" | "danger";
};

const variantClasses: Record<NonNullable<Props["variant"]>, string> = {
  primary:
    "bg-stone-900 text-white hover:bg-stone-800 disabled:bg-stone-400 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 dark:disabled:bg-zinc-600",
  secondary:
    "border border-stone-300 text-stone-900 hover:bg-stone-50 disabled:text-stone-400 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900 dark:disabled:text-stone-500",
  danger:
    "border border-red-300 text-red-700 hover:bg-red-50 disabled:text-red-300 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950",
};

export function SubmitButton({
  children,
  pendingLabel,
  className = "",
  variant = "primary",
}: Props) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors ${variantClasses[variant]} ${className}`}
    >
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  );
}
