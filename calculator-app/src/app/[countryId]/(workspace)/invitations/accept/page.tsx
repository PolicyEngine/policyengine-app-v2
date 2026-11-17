"use client";

import InvitationAcceptPage from "@/pages/flagship/InvitationAccept.page";
import FlagshipGate from "../../FlagshipGate";

/**
 * The accept page (`/{countryId}/invitations/accept`), in the workspace
 * shell, whose AuthProvider signs the invitee in and back. An invitation
 * email's link reaches it through `/invitations/accept`.
 */
export default function InvitationAcceptRoute() {
  return (
    <FlagshipGate>
      <InvitationAcceptPage />
    </FlagshipGate>
  );
}
