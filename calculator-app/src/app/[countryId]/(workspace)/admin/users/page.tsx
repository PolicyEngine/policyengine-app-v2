"use client";

import AdminSettingsLayout from "@/components/settings/AdminSettingsLayout";
import AdminUsersPage from "@/pages/flagship/AdminUsers.page";
import FlagshipGate from "../../FlagshipGate";

/**
 * The admin users page (`/{countryId}/admin/users`), in the workspace
 * shell: the Users page of the admin settings, which the account menu's
 * "Admin" opens, with the settings sidebar. Only admins see its content;
 * everyone else gets a not-found page.
 */
export default function AdminUsersRoute() {
  return (
    <FlagshipGate>
      <AdminSettingsLayout>
        <AdminUsersPage />
      </AdminSettingsLayout>
    </FlagshipGate>
  );
}
