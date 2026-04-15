import { log } from "@/lib/log";

/**
 * Download a file (voice note, audio, document) from Telegram by its file_id.
 * Two-step flow: getFile → { file_path } → GET file from the file-serving endpoint.
 * Returns the raw bytes plus the MIME type Telegram reports.
 */
export async function downloadTelegramFile(
  fileId: string,
  fallbackMime: string,
): Promise<{ bytes: Buffer; mime: string } | null> {
  const token = process.env.TELEGRAM_BOT_TOKEN!;
  if (!token) {
    log.error("telegram.fetch.no_token", {});
    return null;
  }

  try {
    const metaRes = await fetch(
      `https://api.telegram.org/bot${token}/getFile?file_id=${encodeURIComponent(fileId)}`,
    );
    if (!metaRes.ok) {
      log.error("telegram.fetch.get_file_failed", { status: metaRes.status });
      return null;
    }
    const meta = (await metaRes.json()) as {
      ok: boolean;
      result?: { file_path?: string };
    };
    if (!meta.ok || !meta.result?.file_path) {
      log.error("telegram.fetch.no_path", meta);
      return null;
    }

    const fileRes = await fetch(
      `https://api.telegram.org/file/bot${token}/${meta.result.file_path}`,
    );
    if (!fileRes.ok) {
      log.error("telegram.fetch.download_failed", { status: fileRes.status });
      return null;
    }
    const arr = await fileRes.arrayBuffer();
    const bytes = Buffer.from(arr);
    // Telegram's file-serving endpoint often returns "application/octet-stream"
    // in the HTTP content-type regardless of the actual media kind. Trust the
    // caller-provided fallback (from the Telegram message metadata) first — it
    // reflects what Telegram itself declared the file to be.
    const headerMime = fileRes.headers.get("content-type") ?? "";
    const mime =
      fallbackMime && fallbackMime !== "application/octet-stream"
        ? fallbackMime
        : headerMime && headerMime !== "application/octet-stream"
          ? headerMime
          : "audio/ogg";
    return { bytes, mime };
  } catch (err) {
    log.error("telegram.fetch.exception", err);
    return null;
  }
}
