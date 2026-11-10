"use client";

import AdminUsersPage from "@/pages/flagship/AdminUsers.page";
import FlagshipGate from "../../FlagshipGate";

/**
 * The admin users page (`/{countryId}/admin/users`), in the workspace
 * shell. Only admins see its content; everyone else gets a not-found page.
 */
export default function AdminUsersRoute() {
  return (
    <FlagshipGate>
      <AdminUsersPage />
    </FlagshipGate>
  );
}
