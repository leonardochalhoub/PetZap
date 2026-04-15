/**
 * Structured logger for the server side.
 *
 * Emits JSON lines so logs are parseable in Vercel/CloudWatch/etc.
 * Auto-forwards errors to Sentry when SENTRY_DSN is set (Sentry package is
 * dynamically imported — install `@sentry/nextjs` to enable).
 */
type Level = "debug" | "info" | "warn" | "error";

type LogFields = Record<string, unknown>;

function emit(level: Level, message: string, fields: LogFields = {}) {
  const line = {
    level,
    time: new Date().toISOString(),
    msg: message,
    ...fields,
  };
  // Use console — Vercel + most platforms surface these as logs.
  if (level === "error") {
    // eslint-disable-next-line no-console
    console.error(JSON.stringify(line));
  } else if (level === "warn") {
    // eslint-disable-next-line no-console
    console.warn(JSON.stringify(line));
  } else {
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(line));
  }
}

async function sentryCapture(err: unknown, fields?: LogFields) {
  if (!process.env.SENTRY_DSN) return;
  try {
    // Dynamic, runtime-only import so @sentry/nextjs stays OPTIONAL.
    // TS can't resolve the module at compile time unless it's installed, hence the
    // eval() wrapper — it genuinely is optional until the user sets SENTRY_DSN.
    const importer = new Function("m", "return import(m)") as (
      m: string
    ) => Promise<{ captureException?: (e: unknown, ctx?: unknown) => unknown } | null>;
    const mod = await importer("@sentry/nextjs").catch(() => null);
    mod?.captureException?.(err, { extra: fields ?? {} });
  } catch {
    // swallow — logger must never throw
  }
}

export const log = {
  debug(message: string, fields?: LogFields) {
    if (process.env.NODE_ENV !== "production") emit("debug", message, fields);
  },
  info(message: string, fields?: LogFields) {
    emit("info", message, fields);
  },
  warn(message: string, fields?: LogFields) {
    emit("warn", message, fields);
  },
  error(message: string, err?: unknown, fields?: LogFields) {
    const payload: LogFields = { ...(fields ?? {}) };
    if (err instanceof Error) {
      payload.error = { name: err.name, message: err.message, stack: err.stack };
    } else if (err !== undefined) {
      payload.error = String(err);
    }
    emit("error", message, payload);
    void sentryCapture(err, fields);
  },
};

/**
 * Wrap a server action / route handler in a try/catch that logs failures.
 * Re-throws so the caller still sees the error.
 */
export async function withLog<T>(name: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    log.error(`${name} failed`, err);
    throw err;
  }
}
