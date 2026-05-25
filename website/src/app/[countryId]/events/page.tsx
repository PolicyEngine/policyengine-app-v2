import type { Metadata } from "next";
import { Suspense } from "react";
import EventsClient from "./EventsClient";

export const metadata: Metadata = {
  title: "Events",
};

export default async function EventsPage({
  params,
}: {
  params: Promise<{ countryId: string }>;
}) {
  const { countryId } = await params;
  return (
    <Suspense>
      <EventsClient countryId={countryId} />
    </Suspense>
  );
}
