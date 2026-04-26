import { generateArticleFile } from "@/lib/llmsTxt";

export function GET() {
  return new Response(generateArticleFile(undefined, 50), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
