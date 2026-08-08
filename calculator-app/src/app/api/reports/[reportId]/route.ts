import { eq } from "drizzle-orm";
import { getDb, isDbConfigured } from "../../../../db";
import { reports } from "../../../../db/schema";
import { reportRowToMetadata } from "../../../../db/serialize";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ reportId: string }> },
): Promise<Response> {
  if (!isDbConfigured()) {
    return json({ error: "Report store is not configured" }, 503);
  }

  const { reportId } = await params;
  const [row] = await getDb()
    .select()
    .from(reports)
    .where(eq(reports.id, reportId));

  if (!row) {
    return json({ error: "Report not found" }, 404);
  }
  return json(reportRowToMetadata(row));
}
