import type { Metadata } from "next";
import { Suspense } from "react";
import CitationsClient from "./CitationsClient";

export const metadata: Metadata = {
  title: "Citations",
};

export default async function CitationsPage({
  params,
}: {
  params: Promise<{ countryId: string }>;
}) {
  const { countryId } = await params;
  return (
    <Suspense>
      <CitationsClient countryId={countryId} />
    </Suspense>
  );
}
