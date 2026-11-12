"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import InvitationLinkPage from "@/pages/flagship/InvitationLink.page";

/**
 * What an invitation email's link opens (`/invitations/accept#token=…`).
 * It sits outside the country routes, so the link names no country; the
 * page keeps the token and continues to `/{country}/invitations/accept`.
 */
export default function InvitationLinkRoute() {
  const router = useRouter();
  const continueTo = useCallback(
    (path: string) => router.replace(path),
    [router],
  );
  return <InvitationLinkPage onContinue={continueTo} />;
}
