import Anthropic from "@anthropic-ai/sdk";
import {
  buildUsAskContext,
  executeUsAskTool,
  US_ASK_SYSTEM_PROMPT,
  US_ASK_TOOLS,
  type UsAskContext,
} from "@/libs/flagship/usAskAgent";
import {
  buildConceptClusters,
  buildParameterSearchEntries,
} from "@/libs/parameterSearch";

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
const MODEL = process.env.US_ASK_MODEL ?? "claude-opus-5";
const MAX_TOOL_TURNS = 10;
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
      const parameters = payload?.result?.parameters ?? {};
      return buildUsAskContext(
        buildParameterSearchEntries(parameters),
        buildConceptClusters(parameters),
        parameters,
      );
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
  if (!process.env.ANTHROPIC_API_KEY) {
    return json({ error: "US ask service is not configured" }, 503);
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }
  const messages: Anthropic.MessageParam[] = (
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
        const turnMessages = [...messages];
        let finalText = "";
        for (let turn = 0; ; turn++) {
          // Past the tool budget, force a prose wrap-up so the turn never
          // ends tool-hungry with an empty answer.
          const forceAnswer = turn >= MAX_TOOL_TURNS;
          const modelStream = client.messages.stream({
            model: MODEL,
            max_tokens: 16000,
            system: US_ASK_SYSTEM_PROMPT,
            tools: US_ASK_TOOLS as unknown as Anthropic.ToolUnion[],
            ...(forceAnswer ? { tool_choice: { type: "none" as const } } : {}),
            messages: turnMessages,
          });
          modelStream.on("text", (delta) =>
            emit({ type: "chunk", content: delta }),
          );
          const message = await modelStream.finalMessage();

          if (message.stop_reason === "refusal") {
            emit({
              type: "error",
              content: "The model declined this request.",
            });
            return;
          }

          finalText = message.content
            .filter(
              (block): block is Anthropic.TextBlock => block.type === "text",
            )
            .map((block) => block.text)
            .join("");
          const toolUses = message.content.filter(
            (block): block is Anthropic.ToolUseBlock =>
              block.type === "tool_use",
          );
          if (toolUses.length === 0 || forceAnswer) {
            break;
          }

          // Thinking blocks must be echoed back unchanged, so push the
          // full content, not just the text.
          turnMessages.push({ role: "assistant", content: message.content });
          const results: Anthropic.ToolResultBlockParam[] = [];
          for (const toolUse of toolUses) {
            emit({
              type: "tool_start",
              tool_name: toolUse.name,
              tool_id: toolUse.id,
            });
            emit({
              type: "tool_use",
              tool_name: toolUse.name,
              tool_id: toolUse.id,
              tool_input: toolUse.input,
              status: "pending",
            });
            const { output, isError } = executeUsAskTool(
              context,
              toolUse.name,
              toolUse.input,
            );
            emit({
              type: "tool_result",
              tool_name: toolUse.name,
              tool_id: toolUse.id,
              status: isError ? "error" : "success",
              result_summary:
                output.length > 400 ? `${output.slice(0, 400)}...` : output,
            });
            results.push({
              type: "tool_result",
              tool_use_id: toolUse.id,
              content: output,
              is_error: isError,
            });
          }
          turnMessages.push({ role: "user", content: results });
        }
        emit({
          type: "done",
          content: finalText,
          session_id: sessionId,
          model: MODEL,
          route: "us-ask",
          outcome: null,
          stop_reason: null,
          usage: {},
        });
      } catch {
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
