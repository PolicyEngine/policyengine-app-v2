import { readPublicApiSettings } from "@policyengine/public-api-forwarding";
import { NextRequest, NextResponse } from "next/server";
import {
  describeServedPublicApi,
  isDeploymentCountry,
  loadDeployments,
} from "@/lib/deployments";
import { withPublicApiCredential } from "@/lib/publicApi/serverFetch";

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
    // The Public API's reports go to this deployment's Public API with the
    // website's credential; the other sources are fetched as they are.
    const report = await loadDeployments(
      country,
      withPublicApiCredential(fetch),
      REVALIDATE_SECONDS,
    );
    // On a preview, the Public API rows name the staging service they read.
    const settings = readPublicApiSettings(process.env);
    const data = settings.ok
      ? describeServedPublicApi(report, settings.settings.baseUrl)
      : report;
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
