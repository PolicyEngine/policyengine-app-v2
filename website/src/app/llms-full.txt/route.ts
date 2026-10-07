import { generateArticleFile } from "@/lib/llmsTxt";

export function GET() {
  return new Response(generateArticleFile(), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
