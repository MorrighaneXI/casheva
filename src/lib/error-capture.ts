// Captures the original Error out-of-band so server.ts can recover the stack
// when h3 has already swallowed the throw into a generic 500 Response.

let lastCapturedError: { error: unknown; at: number } | undefined;
let lastCapturedAbort: { error: unknown; at: number } | undefined;
const TTL_MS = 5_000;

function record(error: unknown) {
  if (isRequestAbortedError(error)) {
    lastCapturedAbort = { error, at: Date.now() };
    return;
  }
  lastCapturedError = { error, at: Date.now() };
}

// h3's HTTPError serializes to {"status":500,"unhandled":true,"message":"HTTPError"} —
// no stack, no cause — so a plain console.error(error) reaches the log pipeline with
// the failure detail stripped. Expand Error-like args into a string that keeps the
// message, stack, and the full cause chain.
const CAUSE_DEPTH_LIMIT = 5;
const DESCRIPTION_LENGTH_LIMIT = 8_000;

export function describeError(error: unknown): string {
  const parts: string[] = [];
  let current: unknown = error;
  for (let depth = 0; depth < CAUSE_DEPTH_LIMIT && current != null; depth++) {
    if (!(current instanceof Error)) {
      parts.push(typeof current === "string" ? current : safeStringify(current));
      break;
    }
    const label = depth === 0 ? "" : "caused by: ";
    const status = describeStatus(current);
    parts.push(`${label}${current.stack ?? `${current.name}: ${current.message}`}${status}`);
    current = current.cause;
  }
  return parts.join("\n").slice(0, DESCRIPTION_LENGTH_LIMIT);
}

function describeStatus(error: Error): string {
  const { status, statusCode } = error as { status?: unknown; statusCode?: unknown };
  const value = status ?? statusCode;
  return typeof value === "number" ? ` (status ${value})` : "";
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}

function isErrorLike(value: unknown): value is Error {
  return value instanceof Error;
}

const ABORT_MESSAGES = new Set(["aborted", "request aborted", "the operation was aborted"]);

/** Client disconnected mid-request — noisy but not an app failure. */
export function isRequestAbortedError(error: unknown): boolean {
  let current: unknown = error;
  for (let depth = 0; depth < CAUSE_DEPTH_LIMIT && current != null; depth++) {
    if (current instanceof Error) {
      const code = (current as { code?: unknown }).code;
      if (current.name === "AbortError") return true;
      if (code === "ECONNRESET" || code === "ECONNABORTED") return true;
      if (ABORT_MESSAGES.has(current.message.toLowerCase())) return true;
      if (current.stack?.includes("abortIncoming")) return true;
      current = current.cause;
      continue;
    }
    break;
  }
  return false;
}

// Wrap console.error so errors logged by any layer — including h3's internal
// unhandled-error logging, which this file cannot hook directly — are both
// recorded for consumeLastCapturedError and expanded before serialization.
const originalConsoleError = console.error.bind(console);
console.error = (...args: unknown[]) => {
  let hasAbort = false;
  let hasRealError = false;

  for (const arg of args) {
    if (!isErrorLike(arg)) continue;
    record(arg);
    if (isRequestAbortedError(arg)) hasAbort = true;
    else hasRealError = true;
  }

  // Client disconnects are expected during refresh/navigation — don't spam the terminal.
  if (hasAbort && !hasRealError) return;

  const expanded = args.map((arg) => (isErrorLike(arg) ? describeError(arg) : arg));
  originalConsoleError(...expanded);
};

if (typeof globalThis.addEventListener === "function") {
  globalThis.addEventListener("error", (event) => record((event as ErrorEvent).error ?? event));
  globalThis.addEventListener("unhandledrejection", (event) =>
    record((event as PromiseRejectionEvent).reason),
  );
}

function consumeCaptured(
  slot: { error: unknown; at: number } | undefined,
  clear: () => void,
): unknown {
  if (!slot) return undefined;
  if (Date.now() - slot.at > TTL_MS) {
    clear();
    return undefined;
  }
  clear();
  return slot.error;
}

export function consumeLastCapturedError(): unknown {
  return consumeCaptured(lastCapturedError, () => {
    lastCapturedError = undefined;
  });
}

export function consumeLastCapturedAbort(): unknown {
  return consumeCaptured(lastCapturedAbort, () => {
    lastCapturedAbort = undefined;
  });
}
