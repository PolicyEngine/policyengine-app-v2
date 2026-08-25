import {
  flagshipApiDisabledResponse,
  isFlagshipApiEnabled,
} from "@/libs/flagship/apiGate";

// Same-origin proxy to the PolicyEngine UK chat service, mirroring the
// thin passthrough the service's own frontend uses. Proxying server-side
// keeps the flagship Ask surface off the service's CORS allow list — the
// integration is purely additive on top of its public HTTP contract.
//
// Handlers use Web-standard Request/Response (not next/server): these
// files are also typechecked inside app/tsconfig.json's program, and
// importing next/server would pull Next's React typings into the Vite
// app's graph.

const DEFAULT_BACKEND_URL =
  "https://policyengine--policyengine-uk-chat-web.modal.run";

// Only the public chat endpoints — never an open proxy.
const ALLOWED_PATHS = new Set(["chat/message", "chat/title"]);

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  if (!isFlagshipApiEnabled()) {
    return flagshipApiDisabledResponse();
  }
  const { path } = await params;
  const endpoint = (path ?? []).join("/");
  if (!ALLOWED_PATHS.has(endpoint)) {
    return new Response(JSON.stringify({ error: "Unknown endpoint" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const backendUrl = (
    process.env.UK_CHAT_BACKEND_URL ?? DEFAULT_BACKEND_URL
  ).replace(/\/$/, "");

  let upstream: Response;
  try {
    upstream = await fetch(`${backendUrl}/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: await request.text(),
      signal: request.signal,
    });
  } catch {
    return new Response(
      JSON.stringify({ error: "UK chat service unreachable" }),
      {
        status: 502,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      "Content-Type":
        upstream.headers.get("content-type") ?? "application/json",
      "Cache-Control": "no-cache",
      // Disable proxy buffering so SSE chunks flush immediately.
      "X-Accel-Buffering": "no",
    },
  });
}
