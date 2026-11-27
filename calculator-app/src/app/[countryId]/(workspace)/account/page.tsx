"use client";

import AccountSettingsLayout from "@/components/settings/AccountSettingsLayout";
import AccountPage from "@/pages/flagship/Account.page";
import FlagshipGate from "../FlagshipGate";

/**
 * The v3 account page (`/{countryId}/account`), in the workspace shell:
 * the General page of the account settings, with the settings sidebar.
 */
export default function AccountRoute() {
  return (
    <FlagshipGate>
      <AccountSettingsLayout>
        <AccountPage />
      </AccountSettingsLayout>
    </FlagshipGate>
  );
}
