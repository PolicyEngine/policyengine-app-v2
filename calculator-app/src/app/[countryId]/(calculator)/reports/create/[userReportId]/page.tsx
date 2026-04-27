import { redirect } from "next/navigation";

export default async function ModifyReportRoute({
  params,
  searchParams,
}: {
  params: Promise<{ countryId: string; userReportId: string }>;
  searchParams: Promise<{ share?: string | string[] }>;
}) {
  const { countryId, userReportId } = await params;
  const { share } = await searchParams;

  const nextPath = `/${countryId}/report-output/${userReportId}/config`;
  if (typeof share !== "string" || share.length === 0) {
    redirect(nextPath);
  }

  const query = new URLSearchParams({ share });
  redirect(`${nextPath}?${query.toString()}`);
}
