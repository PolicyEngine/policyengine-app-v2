import {
  flagshipApiDisabledResponse,
  isFlagshipApiEnabled,
} from "@/libs/flagship/apiGate";
import Anthropic from "@anthropic-ai/sdk";
import {
  buildValidationPrompt,
  ESTIMATE_VALIDATOR_SYSTEM_PROMPT,
  parseEstimateValidation,
  REPORT_FINDINGS_TOOL,
  type EstimateValidationRequest,
} from "@/libs/flagship/estimateValidator";

// On-demand external validation for user-drafted reforms: an agent with
// web search hunts for official and third-party scores of the same or
// similar proposals and returns structured findings. Web search runs
// server-side at Anthropic; the only client tool is report_findings,
// which carries the structured result out of the loop.
//
// Requires ANTHROPIC_API_KEY; without it the route returns 503 and the
// report page shows validation as unavailable.

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const MODEL = process.env.VALIDATE_ESTIMATE_MODEL ?? "claude-opus-5";
const MAX_ROUNDS = 3;

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(request: Request): Promise<Response> {
  if (!isFlagshipApiEnabled()) {
    return flagshipApiDisabledResponse();
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return json({ error: "Estimate validation is not configured" }, 503);
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }
  const provisions = Array.isArray(body?.provisions)
    ? body.provisions.filter((p: any) => typeof p?.path === "string")
    : [];
  if (provisions.length === 0) {
    return json({ error: "provisions are required" }, 400);
  }
  const validationRequest: EstimateValidationRequest = {
    countryId: typeof body?.countryId === "string" ? body.countryId : "us",
    label: typeof body?.label === "string" ? body.label : "Drafted reform",
    provisions,
    peEstimate:
      typeof body?.peEstimate === "number" ? body.peEstimate : undefined,
    year: body?.year,
  };

  const client = new Anthropic();
  const tools = [
    {
      type: "web_search_20250305" as const,
      name: "web_search" as const,
      max_uses: 8,
    },
    REPORT_FINDINGS_TOOL as unknown as Anthropic.Tool,
  ];
  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: buildValidationPrompt(validationRequest) },
  ];

  try {
    for (let round = 0; round < MAX_ROUNDS; round++) {
      // If prose rounds run out, force the structured hand-off.
      const finalRound = round === MAX_ROUNDS - 1;
      const message = await client.messages.create({
        model: MODEL,
        max_tokens: 8000,
        system: ESTIMATE_VALIDATOR_SYSTEM_PROMPT,
        tools,
        ...(finalRound
          ? {
              tool_choice: {
                type: "tool" as const,
                name: "report_findings",
              },
            }
          : {}),
        messages,
      });
      const report = message.content.find(
        (block): block is Anthropic.ToolUseBlock =>
          block.type === "tool_use" && block.name === "report_findings",
      );
      if (report) {
        return json(parseEstimateValidation(report.input), 200);
      }
      // The model answered in prose or stopped mid-search: push its turn
      // and ask it to finish through the tool.
      messages.push({ role: "assistant", content: message.content });
      messages.push({
        role: "user",
        content:
          "Finish now by calling report_findings with what you have found so far.",
      });
    }
    return json({ error: "Validation did not produce findings" }, 502);
  } catch {
    return json({ error: "Estimate validation failed — please retry" }, 502);
  }
}
