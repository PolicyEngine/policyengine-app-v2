'use client';

import posthog from 'posthog-js';

type PolicyEngineWindow = Window & {
  __policyenginePostHogInitialized?: boolean;
};

export function isPostHogAvailable() {
  return (
    typeof window !== 'undefined' &&
    Boolean((window as PolicyEngineWindow).__policyenginePostHogInitialized)
  );
}

export function getPostHogClient() {
  return isPostHogAvailable() ? posthog : null;
}
