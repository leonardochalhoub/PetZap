/**
 * Postgres-backed rate limiter. Uses the rate_limit_hit() RPC
 * (migration 0011) which atomically increments a rolling-window counter.
 *
 * Not precise like a token-bucket, but: no extra service needed, zero cold-start,
 * works across instances, and the windows auto-reset. Good enough for MVP.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import type { NextRequest } from "next/server";
import { log } from "./log";

export type RateLimitResult = {
  allowed: boolean;
  current: number;
  resetInSeconds: number;
};

/** Extract a client IP-ish key from the incoming request. Falls back to 'unknown'. */
export function clientKey(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() || "unknown";
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

/**
 * Hit the counter. If `allowed=false`, caller should return HTTP 429.
 * Fail open: if the RPC errors, we allow the request but log.
 */
export async function rateLimit(opts: {
  bucket: string;
  key: string;
  windowSeconds: number;
  limit: number;
}): Promise<RateLimitResult> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("rate_limit_hit", {
      p_bucket: opts.bucket,
      p_key: opts.key,
      p_window_seconds: opts.windowSeconds,
      p_limit: opts.limit,
    });
    if (error) {
      log.warn("rate_limit.rpc_error", { bucket: opts.bucket, key: opts.key, error: error.message });
      return { allowed: true, current: 0, resetInSeconds: 0 };
    }
    const row = Array.isArray(data) ? data[0] : data;
    return {
      allowed: Boolean(row?.allowed),
      current: Number(row?.current_count ?? 0),
      resetInSeconds: Number(row?.reset_in_seconds ?? 0),
    };
  } catch (err) {
    log.error("rate_limit.exception", err, { bucket: opts.bucket, key: opts.key });
    return { allowed: true, current: 0, resetInSeconds: 0 };
  }
}

/** Build a 429 response with Retry-After + JSON body. */
export function rateLimitResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({
      error: "rate_limited",
      current: result.current,
      reset_in_seconds: result.resetInSeconds,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(Math.max(1, result.resetInSeconds)),
      },
    }
  );
}
