import { NextResponse } from "next/server";

import { buildResearchSearchIndex } from "@/lib/researchSearchCorpus";

export const dynamic = "force-static";

export function GET(): NextResponse {
  return NextResponse.json(buildResearchSearchIndex(), {
    headers: {
      "Cache-Control":
        "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
    },
  });
}
