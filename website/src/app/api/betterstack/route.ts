import { NextRequest, NextResponse } from "next/server";
import { fetchStatusPageData } from "@/lib/betterstack";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const monitorsParam = request.nextUrl.searchParams.get("monitors");
  if (!monitorsParam) {
    return NextResponse.json(
      { error: "Missing monitors query parameter" },
      { status: 400 },
    );
  }

  const monitorIds = monitorsParam
    .split(",")
    .map((monitorId: string) => monitorId.trim())
    .filter(Boolean);

  if (monitorIds.length === 0) {
    return NextResponse.json({ error: "No monitor IDs provided" }, { status: 400 });
  }

  try {
    const data = await fetchStatusPageData(monitorIds);
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "s-maxage=300, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    console.error("BetterStack API error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to fetch status data";
    const status =
      message === "BetterStack API token not configured" ? 500 : 502;

    return NextResponse.json(
      {
        error:
          status === 500 ? message : "Failed to fetch status data",
      },
      { status },
    );
  }
}
