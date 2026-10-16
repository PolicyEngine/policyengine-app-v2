"use client";

import AuthCallbackPage from "@/pages/flagship/AuthCallback.page";
import FlagshipGate from "../FlagshipGate";

/**
 * Auth0 redirect target (`/{countryId}/callback`). It sits in the
 * workspace group so the workspace's AuthProvider completes the sign-in
 * and stays mounted on the way back to where it started.
 */
export default function AuthCallbackRoute() {
  return (
    <FlagshipGate>
      <AuthCallbackPage />
    </FlagshipGate>
  );
}
