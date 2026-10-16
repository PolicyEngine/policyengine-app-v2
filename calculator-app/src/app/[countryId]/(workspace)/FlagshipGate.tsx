"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  isFlagshipShellEnabled,
  isFlagshipShellEnvEnabled,
} from "@/libs/featureFlags";

/**
 * Flagship shell routes render only when the feature flag is on
 * (NEXT_PUBLIC_FLAGSHIP_SHELL=true or the localStorage override);
 * otherwise they behave as a 404 so production routing is unchanged.
 *
 * SSR notes: the env flag is inlined into both server and client
 * bundles, so it renders consistently. The localStorage override only
 * exists client-side, so it is read after mount. The fallback avoids
 * the shared NotFoundPage, which uses react-router APIs that are
 * unavailable under Next.js server rendering.
 */
export default function FlagshipGate({
  children,
}: {
  children: React.ReactNode;
}) {
  // Each country has its own switch: the UK stays on v2 until its flag is on.
  const { countryId } = useParams<{ countryId: string }>();
  const envEnabled = isFlagshipShellEnvEnabled(countryId);
  const [storageEnabled, setStorageEnabled] = useState(false);

  useEffect(() => {
    if (!envEnabled) {
      setStorageEnabled(isFlagshipShellEnabled(countryId));
    }
  }, [envEnabled, countryId]);

  if (!envEnabled && !storageEnabled) {
    return (
      <div style={{ padding: 48, textAlign: "center" }}>
        <h1>Page not found</h1>
        <p>
          <a href="./reports">Go to reports</a>
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
