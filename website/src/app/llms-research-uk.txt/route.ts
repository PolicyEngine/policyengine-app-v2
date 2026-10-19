import { llmsTextResponse } from "@/lib/llmsTxt";

// Built once, with the site; see src/lib/llmsTxt.ts.
export const dynamic = "force-static";

export function GET(): Response {
  return llmsTextResponse("llms-research-uk.txt");
}
