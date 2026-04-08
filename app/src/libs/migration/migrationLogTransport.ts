import type {
  MigrationComparisonLogPayload,
  MigrationEventLogPayload,
  MigrationFieldDetail,
  MigrationLogMetadata,
  MigrationRemoteLogPayload,
} from './migrationLogTypes';

const MIGRATION_LOG_ENDPOINT = '/api/migration-log';
const MAX_PAYLOAD_CHARS = 32_000;
const MAX_DETAIL_VALUE_CHARS = 500;
const MAX_DETAILS = 40;
const MIN_DETAILS = 5;
const MAX_METADATA_ENTRIES = 20;
const MAX_METADATA_STRING_CHARS = 500;

function isRemoteLoggingEnabled(): boolean {
  return import.meta.env.VITE_ENABLE_VERCEL_MIGRATION_LOGS === 'true';
}

function truncateString(value: string, maxChars: number): string {
  return value.length <= maxChars ? value : `${value.slice(0, maxChars - 1)}…`;
}

function getLocationContext(): Pick<MigrationRemoteLogPayload, 'pathname' | 'href'> {
  if (typeof window === 'undefined') {
    return {};
  }

  return {
    pathname: window.location.pathname,
    href: window.location.href,
  };
}

function sanitizeDetails(details: MigrationFieldDetail[]): MigrationFieldDetail[] {
  return details.slice(0, MAX_DETAILS).map((detail) => ({
    ...detail,
    v1: truncateString(detail.v1, MAX_DETAIL_VALUE_CHARS),
    v2: truncateString(detail.v2, MAX_DETAIL_VALUE_CHARS),
  }));
}

function sanitizeMetadata(metadata?: Record<string, unknown>): MigrationLogMetadata | undefined {
  if (!metadata) {
    return undefined;
  }

  const entries = Object.entries(metadata).slice(0, MAX_METADATA_ENTRIES);
  return Object.fromEntries(
    entries.map(([key, value]) => {
      if (value === null || typeof value === 'number' || typeof value === 'boolean') {
        return [key, value];
      }

      return [key, truncateString(String(value), MAX_METADATA_STRING_CHARS)];
    })
  );
}

function buildComparisonPayload(
  payload: MigrationComparisonLogPayload
): MigrationComparisonLogPayload {
  const details = sanitizeDetails(payload.details);
  const basePayload: MigrationComparisonLogPayload = {
    ...payload,
    ...getLocationContext(),
    detailCount: payload.detailCount,
    details,
    truncatedDetailCount: Math.max(payload.detailCount - details.length, 0) || undefined,
  };

  if (JSON.stringify(basePayload).length <= MAX_PAYLOAD_CHARS) {
    return basePayload;
  }

  let trimmedDetails = details;
  while (trimmedDetails.length > MIN_DETAILS) {
    trimmedDetails = trimmedDetails.slice(0, Math.ceil(trimmedDetails.length / 2));
    const candidate: MigrationComparisonLogPayload = {
      ...basePayload,
      details: trimmedDetails,
      truncatedDetailCount: payload.detailCount - trimmedDetails.length,
    };

    if (JSON.stringify(candidate).length <= MAX_PAYLOAD_CHARS) {
      return candidate;
    }
  }

  return {
    ...basePayload,
    details: [],
    truncatedDetailCount: payload.detailCount,
  };
}

function buildEventPayload(payload: MigrationEventLogPayload): MigrationEventLogPayload {
  const candidate: MigrationEventLogPayload = {
    ...payload,
    ...getLocationContext(),
    metadata: sanitizeMetadata(payload.metadata),
  };

  if (JSON.stringify(candidate).length <= MAX_PAYLOAD_CHARS) {
    return candidate;
  }

  return {
    ...candidate,
    metadata: undefined,
  };
}

function preparePayload(payload: MigrationRemoteLogPayload): MigrationRemoteLogPayload {
  return payload.kind === 'comparison'
    ? buildComparisonPayload(payload)
    : buildEventPayload(payload);
}

export function sendMigrationLog(payload: MigrationRemoteLogPayload): void {
  if (!isRemoteLoggingEnabled() || typeof window === 'undefined') {
    return;
  }

  const body = JSON.stringify(preparePayload(payload));

  try {
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const ok = navigator.sendBeacon(MIGRATION_LOG_ENDPOINT, body);

      if (ok) {
        return;
      }
    }
  } catch {
    // Fall back to fetch below.
  }

  if (typeof fetch !== 'function') {
    return;
  }

  void fetch(MIGRATION_LOG_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body,
    keepalive: true,
  }).catch(() => {
    // Remote logging must never block user flows.
  });
}
