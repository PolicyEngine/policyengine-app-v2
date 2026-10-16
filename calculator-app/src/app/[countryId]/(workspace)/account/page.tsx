"use client";

import AccountPage from "@/pages/flagship/Account.page";
import FlagshipGate from "../FlagshipGate";

/** The v3 account page (`/{countryId}/account`), in the workspace shell. */
export default function AccountRoute() {
  return (
    <FlagshipGate>
      <AccountPage />
    </FlagshipGate>
  );
}
