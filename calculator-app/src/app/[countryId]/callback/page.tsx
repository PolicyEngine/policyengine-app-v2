"use client";

import AuthCallbackPage from "@/pages/AuthCallback.page";

/**
 * Auth0 redirect target (`/{countryId}/callback`). The AuthProvider in
 * providers.tsx completes the sign-in and returns to where it started.
 */
export default function AuthCallbackRoute() {
  return <AuthCallbackPage />;
}
