"use client";

import OrganizationSettingsLayout from "@/components/admin/OrganizationSettingsLayout";
import AdminUsersPage from "@/pages/flagship/AdminUsers.page";
import FlagshipGate from "../../FlagshipGate";

/**
 * The admin users page (`/{countryId}/admin/users`), in the workspace
 * shell: the Users page of the organization settings, which the account
 * menu's "My organization" opens, with the settings sidebar. Only admins
 * see its content; everyone else gets a not-found page.
 */
export default function AdminUsersRoute() {
  return (
    <FlagshipGate>
      <OrganizationSettingsLayout>
        <AdminUsersPage />
      </OrganizationSettingsLayout>
    </FlagshipGate>
  );
}
