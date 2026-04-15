import Link from "next/link";
import { PugLogo } from "./pug-logo";

export function Brand({ href = "/", className = "" }: { href?: string; className?: string }) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 font-semibold text-stone-900 dark:text-zinc-50 ${className}`}
    >
      <PugLogo className="h-11 w-11" />
      <span className="bg-gradient-to-r from-stone-900 to-stone-600 bg-clip-text text-2xl font-bold tracking-tight text-transparent dark:from-zinc-50 dark:to-zinc-300">
        PetZap
      </span>
    </Link>
  );
}
