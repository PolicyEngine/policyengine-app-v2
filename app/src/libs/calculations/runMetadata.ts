import type { PolicyEngineBundle, SocietyWideReportOutput } from '@/api/societyWideCalculation';
import type { RunMetadata } from '@/types/runMetadata';

export const APP_RUNTIME_NAME = 'policyengine-app-v2';

function normalizeNullableString(value: unknown): string | null | undefined {
  if (value == null) {
    return null;
  }
  return typeof value === 'string' ? value : undefined;
}

export function buildRunMetadataFromPolicyEngineBundle(
  bundle?: PolicyEngineBundle | null
): RunMetadata {
  return {
    country_package_version: normalizeNullableString(bundle?.model_version),
    policyengine_version: normalizeNullableString(bundle?.policyengine_version),
    data_version: normalizeNullableString(bundle?.data_version),
    runtime_app_name: APP_RUNTIME_NAME,
    resolved_dataset: normalizeNullableString(bundle?.dataset),
  };
}

export function buildRunMetadataFromSocietyWideOutput(
  output?: SocietyWideReportOutput | null
): RunMetadata {
  if (!output) {
    return {
      runtime_app_name: APP_RUNTIME_NAME,
    };
  }

  return {
    country_package_version: normalizeNullableString(output.model_version),
    policyengine_version: normalizeNullableString(output.policyengine_version),
    data_version: normalizeNullableString(output.data_version),
    runtime_app_name: APP_RUNTIME_NAME,
    resolved_dataset: normalizeNullableString(output.dataset),
  };
}

export function mergeConsistentRunMetadata(
  metadataItems: Array<RunMetadata | null | undefined>
): RunMetadata | undefined {
  const populatedItems = metadataItems.filter(
    (metadata): metadata is RunMetadata => metadata != null
  );
  if (populatedItems.length === 0) {
    return undefined;
  }

  const merged: RunMetadata = {};
  const keys: Array<keyof RunMetadata> = [
    'country_package_version',
    'policyengine_version',
    'data_version',
    'runtime_app_name',
    'resolved_dataset',
  ];

  for (const key of keys) {
    const firstValue = populatedItems[0][key];
    if (
      populatedItems.every((metadata) => (metadata[key] ?? null) === (firstValue ?? null))
    ) {
      merged[key] = firstValue ?? null;
    }
  }

  return merged;
}
