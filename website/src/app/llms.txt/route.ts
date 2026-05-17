import { generateIndex } from "@/lib/llmsTxt";

export function GET() {
  return new Response(generateIndex(), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
