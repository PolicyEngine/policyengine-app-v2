"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  isFlagshipShellEnabled,
  isFlagshipShellEnvEnabled,
} from "@/libs/featureFlags";
import { flagshipFallbackRedirect } from "./flagshipFallback";

/**
 * Flagship shell routes render only when the country's feature flag is
 * on (NEXT_PUBLIC_FLAGSHIP_SHELL=true or the localStorage override).
 * Otherwise a country still on v2 goes to its v2 Reports page (see
 * flagshipFallbackRedirect); the US keeps its not-found page, so
 * production routing there is unchanged.
 *
 * SSR notes: the env flag is inlined into both server and client
 * bundles, so it renders consistently. The localStorage override only
 * exists client-side, so it is read after mount, and nothing redirects
 * before it is. The fallback avoids the shared NotFoundPage, which uses
 * react-router APIs that are unavailable under Next.js server rendering.
 */
export default function FlagshipGate({
  children,
}: {
  children: React.ReactNode;
}) {
  // Each country has its own switch: the UK stays on v2 until its flag is on.
  const { countryId } = useParams<{ countryId: string }>();
  const router = useRouter();
  const envEnabled = isFlagshipShellEnvEnabled(countryId);
  const [storageEnabled, setStorageEnabled] = useState(false);
  const [storageChecked, setStorageChecked] = useState(false);

  useEffect(() => {
    if (!envEnabled) {
      setStorageEnabled(isFlagshipShellEnabled(countryId));
      setStorageChecked(true);
    }
  }, [envEnabled, countryId]);

  const enabled = envEnabled || storageEnabled;
  const fallback = flagshipFallbackRedirect(countryId);
  const redirectTo = !enabled && storageChecked ? fallback : null;

  useEffect(() => {
    if (redirectTo) {
      router.replace(redirectTo);
    }
  }, [redirectTo, router]);

  if (enabled) {
    return <>{children}</>;
  }

  if (fallback) {
    // Nothing until the override is read, and while the redirect runs.
    return null;
  }

  return (
    <div style={{ padding: 48, textAlign: "center" }}>
      <h1>Page not found</h1>
      <p>
        <a href="./reports">Go to reports</a>
      </p>
    </div>
  );
}
