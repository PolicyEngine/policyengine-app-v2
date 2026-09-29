import {
  flagshipApiDisabledResponse,
  isFlagshipApiEnabled,
} from "@/libs/flagship/apiGate";
import Anthropic from "@anthropic-ai/sdk";
import {
  buildUsAskContextFromMetadata,
  createReferenceFetcher,
  executeUsAskTool,
  US_ASK_DEFAULTS,
  US_ASK_SYSTEM_PROMPT,
  US_ASK_TOOLS,
  type UsAskContext,
} from "@/libs/flagship/usAskAgent";
import { runAskAgentLoop } from "@/libs/flagship/usAskLoop";

// The US ask agent: Claude with deterministic parameter-search tools over
// live policyengine-us metadata, streaming the same SSE event shapes as
// the UK chat service (chunk / tool_start / tool_use / tool_result /
// done / error) so the Ask page client and the chat→draft bridge work
// unchanged for both countries. Unlike the UK service it computes no
// impacts — reforms flow to the draft rail and the report pipeline.
//
// Requires ANTHROPIC_API_KEY; without it the route returns 503 and the
// Ask page falls back to keyword matching.

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const METADATA_URL =
  process.env.US_METADATA_URL ?? "https://api.policyengine.org/us/metadata";
const MODEL = process.env.US_ASK_MODEL ?? US_ASK_DEFAULTS.model;
const CONTEXT_TTL_MS = 6 * 60 * 60 * 1000;

let cachedContext: {
  promise: Promise<UsAskContext>;
  fetchedAt: number;
} | null = null;

function getUsAskContext(): Promise<UsAskContext> {
  if (!cachedContext || Date.now() - cachedContext.fetchedAt > CONTEXT_TTL_MS) {
    const promise = (async () => {
      const response = await fetch(METADATA_URL);
      if (!response.ok) {
        throw new Error(`US metadata fetch failed: ${response.status}`);
      }
      const payload = await response.json();
      return buildUsAskContextFromMetadata(payload?.result?.parameters ?? {}, {
        fetchReferences: createReferenceFetcher(),
      });
    })();
    promise.catch(() => {
      // Don't poison the cache with a failed fetch.
      cachedContext = null;
    });
    cachedContext = { promise, fetchedAt: Date.now() };
  }
  return cachedContext.promise;
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function sse(payload: unknown): string {
  return `data: ${JSON.stringify(payload)}\n\n`;
}

export async function POST(request: Request): Promise<Response> {
  if (!isFlagshipApiEnabled()) {
    return flagshipApiDisabledResponse();
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return json({ error: "US ask service is not configured" }, 503);
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }
  const messages: Anthropic.Beta.BetaMessageParam[] = (
    Array.isArray(body?.messages) ? body.messages : []
  )
    .filter(
      (m: any) =>
        (m?.role === "user" || m?.role === "assistant") &&
        typeof m?.content === "string" &&
        m.content.trim(),
    )
    .map((m: any) => ({ role: m.role, content: m.content }));
  if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
    return json({ error: "messages must end with a user message" }, 400);
  }

  let context: UsAskContext;
  try {
    context = await getUsAskContext();
  } catch {
    return json({ error: "US parameter metadata unavailable" }, 502);
  }

  const client = new Anthropic();
  const sessionId =
    typeof body?.session_id === "string" && body.session_id
      ? body.session_id
      : crypto.randomUUID();
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (payload: unknown) =>
        controller.enqueue(encoder.encode(sse(payload)));
      try {
        const result = await runAskAgentLoop({
          client,
          model: MODEL,
          system: US_ASK_SYSTEM_PROMPT,
          tools: US_ASK_TOOLS as unknown as Anthropic.Beta.BetaToolUnion[],
          messages,
          maxToolTurns: US_ASK_DEFAULTS.maxToolTurns,
          effort: US_ASK_DEFAULTS.effort,
          cachePrompt: US_ASK_DEFAULTS.cachePrompt,
          fallbacks: US_ASK_DEFAULTS.fallbacks,
          signal: request.signal,
          executeTool: (name, input) => executeUsAskTool(context, name, input),
          onEvent: (event) => {
            if (event.type === "text") {
              emit({ type: "chunk", content: event.delta });
            } else if (event.type === "tool_start") {
              emit({
                type: "tool_start",
                tool_name: event.name,
                tool_id: event.id,
              });
              emit({
                type: "tool_use",
                tool_name: event.name,
                tool_id: event.id,
                tool_input: event.input,
                status: "pending",
              });
            } else {
              emit({
                type: "tool_result",
                tool_name: event.name,
                tool_id: event.id,
                status: event.isError ? "error" : "success",
                result_summary:
                  event.output.length > 400
                    ? `${event.output.slice(0, 400)}...`
                    : event.output,
              });
            }
          },
        });
        if (result.stopReason === "aborted") {
          return;
        }
        if (result.stopReason === "refusal") {
          emit({ type: "error", content: "The model declined this request." });
          return;
        }
        emit({
          type: "done",
          content: result.finalText,
          session_id: sessionId,
          model: MODEL,
          route: "us-ask",
          outcome: null,
          stop_reason: result.stopReason,
          usage: {
            model_calls: result.usage.modelCalls,
            input_tokens: result.usage.inputTokens,
            output_tokens: result.usage.outputTokens,
            cache_read_input_tokens: result.usage.cacheReadTokens,
            cache_creation_input_tokens: result.usage.cacheWriteTokens,
          },
        });
      } catch (error) {
        console.error("[us-ask] turn failed", error);
        emit({
          type: "error",
          content: "The US ask service hit an error — please try again.",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}
