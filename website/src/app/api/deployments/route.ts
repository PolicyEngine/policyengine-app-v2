import { NextRequest, NextResponse } from "next/server";
import { isDeploymentCountry, loadDeployments } from "@/lib/deployments";

export const runtime = "nodejs";

// Lock files and .py tags change at most a few times a day; the service
// reports are cheap but need not be live to the second.
const REVALIDATE_SECONDS = 900;

export async function GET(request: NextRequest) {
  const country = request.nextUrl.searchParams.get("country") ?? "";
  if (!isDeploymentCountry(country)) {
    return NextResponse.json(
      { error: `No .py bundle certifies data for country "${country}"` },
      { status: 404 },
    );
  }

  try {
    const data = await loadDeployments(country, fetch, REVALIDATE_SECONDS);
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": `s-maxage=${REVALIDATE_SECONDS}, stale-while-revalidate=60`,
      },
    });
  } catch (error) {
    console.error("Deployments error:", error);
    return NextResponse.json(
      { error: "Failed to read deployment versions" },
      { status: 502 },
    );
  }
}
