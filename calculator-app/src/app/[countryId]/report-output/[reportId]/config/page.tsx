import { redirect } from "next/navigation";

export default async function ReportConfigRoute({
  params,
  searchParams,
}: {
  params: Promise<{ countryId: string; reportId: string }>;
  searchParams: Promise<{ share?: string | string[] }>;
}) {
  const { countryId, reportId } = await params;
  const { share } = await searchParams;

  const nextPath = `/${countryId}/reports/create/${reportId}`;
  if (typeof share !== "string" || share.length === 0) {
    redirect(nextPath);
  }

  const query = new URLSearchParams({ share });
  redirect(`${nextPath}?${query.toString()}`);
}
