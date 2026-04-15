"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const HOLD_MS = 5000;

export function LandingCarousel({
  images,
  alt,
}: {
  images: string[];
  alt: string;
}) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const id = setInterval(() => {
      setActive((i) => (i + 1) % images.length);
    }, HOLD_MS);
    return () => clearInterval(id);
  }, [images.length]);

  return (
    <div className="relative mx-auto aspect-[3/2] w-full max-w-3xl overflow-hidden rounded-3xl border border-stone-200 bg-stone-100 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
      {images.map((src, i) => (
        <div
          key={src}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            i === active ? "opacity-100" : "opacity-0"
          }`}
          aria-hidden={i !== active}
        >
          <Image
            src={src}
            alt={alt}
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            priority={i === 0}
            className="object-cover"
          />
        </div>
      ))}
      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
        {images.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i === active ? "w-6 bg-white" : "w-1.5 bg-white/50"
            }`}
            aria-hidden
          />
        ))}
      </div>
    </div>
  );
}
