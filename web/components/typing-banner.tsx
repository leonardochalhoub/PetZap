"use client";

import { useEffect, useState } from "react";

const CHAR_MS = 50;
const POST_DOTS_PAUSE_MS = 800;
const HOLD_OK_MS = 4000;

export function TypingBanner({ prompt, ok }: { prompt: string; ok: string }) {
  const [shown, setShown] = useState(0);
  const [showOk, setShowOk] = useState(false);
  const [showCaret, setShowCaret] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let t: ReturnType<typeof setTimeout>;

    function loop() {
      if (cancelled) return;
      setShown(0);
      setShowOk(false);

      let i = 0;
      const tick = () => {
        if (cancelled) return;
        i += 1;
        setShown(i);
        if (i < prompt.length) {
          t = setTimeout(tick, CHAR_MS);
        } else {
          t = setTimeout(() => {
            if (cancelled) return;
            setShowOk(true);
            t = setTimeout(loop, HOLD_OK_MS);
          }, POST_DOTS_PAUSE_MS);
        }
      };
      t = setTimeout(tick, CHAR_MS);
    }

    loop();
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [prompt]);

  // Caret blink
  useEffect(() => {
    const id = setInterval(() => setShowCaret((v) => !v), 500);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className="inline-flex max-w-full items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 font-mono text-sm text-zinc-100 shadow-md"
    >
      <span className="select-none text-emerald-400">$</span>
      <span className="ml-1 whitespace-pre text-zinc-100">{prompt.slice(0, shown)}</span>
      {showOk ? (
        <span className="ml-2 font-semibold text-emerald-400">{ok}</span>
      ) : (
        <span
          aria-hidden
          className={`ml-0.5 inline-block h-4 w-2 align-text-bottom bg-zinc-100 ${
            showCaret ? "opacity-100" : "opacity-0"
          }`}
        />
      )}
    </div>
  );
}
