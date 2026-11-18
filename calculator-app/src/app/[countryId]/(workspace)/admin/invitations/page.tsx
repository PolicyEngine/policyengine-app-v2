"use client";

import AdminSettingsLayout from "@/components/settings/AdminSettingsLayout";
import AdminInvitationsPage from "@/pages/flagship/AdminInvitations.page";
import FlagshipGate from "../../FlagshipGate";

/**
 * The admin invitations page (`/{countryId}/admin/invitations`), in the
 * workspace shell: the Invitations page of the admin settings, with the
 * settings sidebar. Only admins see its content; everyone else gets a
 * not-found page.
 */
export default function AdminInvitationsRoute() {
  return (
    <FlagshipGate>
      <AdminSettingsLayout>
        <AdminInvitationsPage />
      </AdminSettingsLayout>
    </FlagshipGate>
  );
}
