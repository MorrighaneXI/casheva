import "./lib/error-capture";

import { consumeLastCapturedAbort, consumeLastCapturedError, isRequestAbortedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

/** Client closed the connection; avoid treating it as a 500 SSR failure. */
function abortedResponse(): Response {
  return new Response(null, { status: 499 });
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(
  response: Response,
  request: Request,
): Promise<Response> {
  if (request.signal.aborted) return abortedResponse();
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  let body: string;
  try {
    body = await response.clone().text();
  } catch (error) {
    if (isRequestAbortedError(error) || request.signal.aborted) return abortedResponse();
    throw error;
  }

  if (!isH3SwallowedErrorBody(body)) return response;

  const capturedAbort = consumeLastCapturedAbort();
  if (capturedAbort || request.signal.aborted) return abortedResponse();

  const captured = consumeLastCapturedError();
  if (isRequestAbortedError(captured)) return abortedResponse();

  console.error(captured ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      if (request.signal.aborted) return abortedResponse();

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      if (request.signal.aborted) return abortedResponse();
      return await normalizeCatastrophicSsrResponse(response, request);
    } catch (error) {
      if (isRequestAbortedError(error) || request.signal.aborted) {
        return abortedResponse();
      }
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
