import { fetchRegionByCode } from '@/api/v2/regions';
import type { CountryId } from '@/libs/countries';
import {
  createResolvedRegionTarget,
  fromV2RegionMetadata,
  getLegacyRegionCodeFallbacks,
  normalizeRegionCode,
  type Region,
  type ResolvedRegionTarget,
} from '@/models/region';
import { logMigrationComparison } from './comparisonLogger';
import { setResolvedRegionId } from './idMapping';
import { logMigrationConsole } from './migrationLogRuntime';
import { sendMigrationLog } from './migrationLogTransport';

const SUPPORTED_REGION_COUNTRIES = new Set<CountryId>(['us', 'uk']);
const inFlightResolutions = new Map<string, Promise<ResolvedRegionTarget | null>>();
const resolvedTargetCache = new Map<string, ResolvedRegionTarget | null>();
const regionPromiseCache = new Map<string, Promise<Region>>();

function logRegionEvent(
  status: 'FAILED' | 'SKIPPED',
  message: string,
  metadata: Record<string, string | number | boolean | null>
): void {
  logMigrationConsole(`[RegionMigration] ${message}`);
  sendMigrationLog({
    kind: 'event',
    prefix: 'RegionMigration',
    operation: 'RESOLVE',
    status,
    message,
    metadata,
    ts: new Date().toISOString(),
  });
}

async function fetchRegionRecordCached(
  countryId: CountryId,
  regionCode: string,
  originalRegionCode: string,
  region?: Region
): Promise<Region> {
  if (region) {
    return region;
  }

  const cacheKey = `${countryId}:${regionCode}`;
  const cachedPromise = regionPromiseCache.get(cacheKey);
  if (cachedPromise) {
    return cachedPromise;
  }

  const fetchCandidates = [
    regionCode,
    ...getLegacyRegionCodeFallbacks(countryId, originalRegionCode),
  ];

  const promise = (async () => {
    let lastError: unknown;

    for (const candidateCode of fetchCandidates) {
      try {
        const record = await fetchRegionByCode(countryId, candidateCode);
        return fromV2RegionMetadata(countryId, record);
      } catch (error) {
        lastError = error;

        const isNotFound = error instanceof Error && error.message.startsWith('Region not found:');
        const isLastCandidate = candidateCode === fetchCandidates[fetchCandidates.length - 1];

        if (!isNotFound || isLastCandidate) {
          throw error;
        }
      }
    }

    throw lastError ?? new Error(`Failed to resolve region ${regionCode} for ${countryId}`);
  })().catch((error) => {
    regionPromiseCache.delete(cacheKey);
    throw error;
  });
  regionPromiseCache.set(cacheKey, promise);
  return promise;
}

function buildResolutionComparable(args: {
  countryId: CountryId;
  code: string;
  selectedLabel?: string | null;
  target: ResolvedRegionTarget;
}) {
  const { code, countryId, selectedLabel, target } = args;

  return {
    v1: {
      countryId,
      code,
      label: selectedLabel ?? null,
      regionType: null,
      filterField: null,
      filterValue: null,
      filterStrategy: null,
    },
    v2: {
      countryId: target.countryId,
      code: target.code,
      label: target.label,
      regionType: target.regionType,
      filterField: target.filterField,
      filterValue: target.filterValue,
      filterStrategy: target.filterStrategy,
    },
    skipFields: [
      ...(selectedLabel == null ? (['label'] as const) : []),
      'regionType',
      'filterField',
      'filterValue',
      'filterStrategy',
    ],
  };
}

async function shadowResolveRegionTargetImpl(args: {
  countryId: CountryId;
  regionCode: string;
  originalRegionCode: string;
  selectedLabel?: string | null;
  region?: Region;
}): Promise<ResolvedRegionTarget | null> {
  const { countryId, originalRegionCode, region, selectedLabel } = args;
  const canonicalCode = normalizeRegionCode(countryId, args.regionCode);

  if (!SUPPORTED_REGION_COUNTRIES.has(countryId)) {
    logRegionEvent('SKIPPED', 'Region resolution skipped: unsupported country', {
      countryId,
      regionCode: canonicalCode,
    });
    return null;
  }

  let resolvedRegion: Region;
  try {
    resolvedRegion = await fetchRegionRecordCached(
      countryId,
      canonicalCode,
      originalRegionCode,
      region
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const status =
      error instanceof Error && error.message.startsWith('Region not found:')
        ? ('SKIPPED' as const)
        : ('FAILED' as const);

    logRegionEvent(
      status,
      `Region resolution ${status === 'SKIPPED' ? 'skipped' : 'failed'}: ${errorMessage}`,
      {
        countryId,
        regionCode: canonicalCode,
        error: errorMessage,
      }
    );
    return null;
  }

  // Dataset selection stays server-side for now. API v2 alpha resolves region-scoped
  // datasets when simulations or reports are created, which is the first point where
  // the app has enough context to ask for a region+year-backed dataset correctly.
  const target = createResolvedRegionTarget({
    region: resolvedRegion,
  });

  setResolvedRegionId(countryId, resolvedRegion.code, resolvedRegion.id);

  const comparable = buildResolutionComparable({
    countryId,
    code: canonicalCode,
    selectedLabel,
    target,
  });

  logMigrationComparison('RegionMigration', 'RESOLVE', comparable.v1, comparable.v2, {
    skipFields: comparable.skipFields,
  });

  return target;
}

export async function shadowResolveRegionTarget(args: {
  countryId: CountryId;
  regionCode: string;
  selectedLabel?: string | null;
  region?: Region;
}): Promise<ResolvedRegionTarget | null> {
  const canonicalCode = normalizeRegionCode(args.countryId, args.regionCode);
  const cacheKey = `${args.countryId}:${canonicalCode}`;
  const cachedTarget = resolvedTargetCache.get(cacheKey);

  if (cachedTarget !== undefined) {
    return cachedTarget;
  }

  const inFlight = inFlightResolutions.get(cacheKey);
  if (inFlight) {
    return inFlight;
  }

  const promise = shadowResolveRegionTargetImpl({
    ...args,
    originalRegionCode: args.regionCode,
    regionCode: canonicalCode,
  })
    .then((target) => {
      if (target) {
        resolvedTargetCache.set(cacheKey, target);
      }
      return target;
    })
    .finally(() => {
      inFlightResolutions.delete(cacheKey);
    });

  inFlightResolutions.set(cacheKey, promise);
  return promise;
}

export function clearRegionShadowCachesForTest(): void {
  inFlightResolutions.clear();
  resolvedTargetCache.clear();
  regionPromiseCache.clear();
}
