"use client";

import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { uploadPetPhoto, removePetPhoto, updatePhotoZoom } from "@/lib/actions/pets";
import type { ActionResult } from "@/lib/actions/auth";
import { useT } from "@/i18n/client";
import type { Messages } from "@/i18n/messages/en";

const speciesEmoji: Record<string, string> = {
  dog: "🐶", cat: "🐱", bird: "🐦", rabbit: "🐰", other: "🐾",
};

const ZOOM_MIN = 1;
const ZOOM_MAX = 3;

function resolveError(t: Messages, key: string | undefined): string | null {
  if (!key) return null;
  if (key.startsWith("errors.")) {
    const k = key.slice("errors.".length) as keyof Messages["errors"];
    return t.errors[k] ?? key;
  }
  return key;
}

export function PhotoSection({
  petId,
  species,
  petName,
  initialPhotoUrl,
  initialZoom,
}: {
  petId: string;
  species: string;
  petName: string;
  initialPhotoUrl: string | null;
  initialZoom: number;
}) {
  const t = useT();
  const fileRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialPhotoUrl);
  const [zoom, setZoom] = useState<number>(initialZoom || 1);
  const [isRemoving, startRemoveTransition] = useTransition();
  const [isSavingZoom, startZoomTransition] = useTransition();
  const zoomDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const action = uploadPetPhoto.bind(null, petId);
  const [state, formAction, isUploading] = useActionState<ActionResult | undefined, FormData>(
    action,
    undefined
  );

  useEffect(() => {
    const url = (state?.data as { url?: string } | undefined)?.url;
    if (url && url !== previewUrl) {
      setPreviewUrl(url);
      if (fileRef.current) fileRef.current.value = "";
    }
  }, [state, previewUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreviewUrl(URL.createObjectURL(file));
    const fd = new FormData();
    fd.set("photo", file);
    startTransition(() => formAction(fd));
  };

  const handleRemove = () => {
    if (!confirm(t.pets.removePhotoConfirm)) return;
    startRemoveTransition(async () => {
      await removePetPhoto(petId);
      setPreviewUrl(null);
      setZoom(1);
      if (fileRef.current) fileRef.current.value = "";
    });
  };

  const handleZoomChange = (v: number) => {
    setZoom(v);
    if (zoomDebounceRef.current) clearTimeout(zoomDebounceRef.current);
    zoomDebounceRef.current = setTimeout(() => {
      startZoomTransition(async () => {
        await updatePhotoZoom(petId, v);
      });
    }, 400);
  };

  const handleZoomReset = () => handleZoomChange(1);

  const errorMsg = resolveError(t, state?.error);
  const hasPhoto = previewUrl !== null;

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-col items-start gap-4 sm:flex-row">
        <div className="h-32 w-32 shrink-0 overflow-hidden rounded-2xl border border-stone-200 bg-gradient-to-br from-indigo-100 to-pink-100 dark:border-zinc-800 dark:from-indigo-500/20 dark:to-pink-500/20">
          {hasPhoto ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={previewUrl!}
              alt={petName}
              className="h-full w-full object-cover transition-transform"
              style={{ transform: `scale(${zoom})` }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-5xl">
              {speciesEmoji[species] ?? "🐾"}
            </div>
          )}
        </div>
        <div className="flex-1 space-y-2">
          <p className="text-sm font-semibold text-stone-900 dark:text-zinc-50">{t.pets.photo}</p>
          <p className="text-xs text-stone-500 dark:text-zinc-400">{t.pets.photoHint}</p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <label
              className={`inline-flex cursor-pointer items-center rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-stone-900 transition-colors hover:bg-stone-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700 ${
                isUploading ? "pointer-events-none opacity-60" : ""
              }`}
            >
              {isUploading
                ? t.pets.uploadingPhoto
                : hasPhoto
                ? t.pets.changePhoto
                : t.pets.uploadPhoto}
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleFileChange}
                disabled={isUploading}
              />
            </label>
            {hasPhoto ? (
              <button
                type="button"
                onClick={handleRemove}
                disabled={isRemoving || isUploading}
                className="inline-flex items-center rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/50"
              >
                {isRemoving ? t.pets.removingPhoto : t.pets.removePhoto}
              </button>
            ) : null}
          </div>

          {hasPhoto ? (
            <div className="pt-3">
              <div className="flex items-center justify-between text-xs text-stone-600 dark:text-zinc-400">
                <span>{t.pets.photoZoom}</span>
                <span className="tabular-nums">{zoom.toFixed(2)}x</span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="range"
                  min={ZOOM_MIN}
                  max={ZOOM_MAX}
                  step="0.05"
                  value={zoom}
                  onChange={(e) => handleZoomChange(Number(e.target.value))}
                  disabled={isSavingZoom}
                  className="flex-1 accent-stone-900 dark:accent-white"
                />
                {zoom !== 1 ? (
                  <button
                    type="button"
                    onClick={handleZoomReset}
                    className="text-xs text-stone-600 underline hover:text-stone-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                  >
                    {t.pets.photoZoomReset}
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}

          {errorMsg ? (
            <p className="text-xs text-red-600 dark:text-red-400">{errorMsg}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
