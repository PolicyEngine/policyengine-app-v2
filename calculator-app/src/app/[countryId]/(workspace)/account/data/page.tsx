"use client";

import AccountSettingsLayout from "@/components/settings/AccountSettingsLayout";
import AccountDataPage from "@/pages/flagship/AccountData.page";
import FlagshipGate from "../../FlagshipGate";

/**
 * The v3 account settings' My data page (`/{countryId}/account/data`), in
 * the workspace shell, with the settings sidebar.
 */
export default function AccountDataRoute() {
  return (
    <FlagshipGate>
      <AccountSettingsLayout>
        <AccountDataPage />
      </AccountSettingsLayout>
    </FlagshipGate>
  );
}
