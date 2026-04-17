import { fetchDatasets } from '@/api/v2/datasets';
import { fetchRegionByCode } from '@/api/v2/regions';
import type { CountryId } from '@/libs/countries';
import {
  createResolvedRegionTarget,
  getRegionYearKey,
  normalizeRegionCode,
  toRegionRecord,
  type RegionFilterStrategy,
  type RegionRecord,
  type ResolvedRegionTarget,
} from '@/models/region';
import type { V2DatasetMetadata } from '@/types/metadata';
import { logMigrationComparison } from './comparisonLogger';
import { setResolvedDatasetId, setResolvedRegionId } from './idMapping';
import { logMigrationConsole } from './migrationLogRuntime';
import { sendMigrationLog } from './migrationLogTransport';

const SUPPORTED_REGION_COUNTRIES = new Set<CountryId>(['us', 'uk']);
const inFlightResolutions = new Map<string, Promise<ResolvedRegionTarget | null>>();
const resolvedTargetCache = new Map<string, ResolvedRegionTarget | null>();
const datasetPromiseCache = new Map<CountryId, Promise<V2DatasetMetadata[]>>();
const regionPromiseCache = new Map<string, Promise<RegionRecord>>();

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

function sortDatasetsByYearDesc(a: V2DatasetMetadata, b: V2DatasetMetadata): number {
  if (a.year !== b.year) {
    return b.year - a.year;
  }

  if (a.updated_at !== b.updated_at) {
    return b.updated_at.localeCompare(a.updated_at);
  }

  return a.id.localeCompare(b.id);
}

function sortDatasetsByYearAsc(a: V2DatasetMetadata, b: V2DatasetMetadata): number {
  if (a.year !== b.year) {
    return a.year - b.year;
  }

  if (a.updated_at !== b.updated_at) {
    return a.updated_at.localeCompare(b.updated_at);
  }

  return a.id.localeCompare(b.id);
}

export function selectDatasetForRegionYear(
  datasets: V2DatasetMetadata[],
  year?: number | null
): V2DatasetMetadata | null {
  const baseDatasets = datasets.filter((dataset) => !dataset.is_output_dataset);

  if (!baseDatasets.length) {
    return null;
  }

  if (year == null) {
    return [...baseDatasets].sort(sortDatasetsByYearDesc)[0] ?? null;
  }

  const exactMatch = [...baseDatasets]
    .filter((dataset) => dataset.year === year)
    .sort(sortDatasetsByYearDesc)[0];
  if (exactMatch) {
    return exactMatch;
  }

  const latestAtOrBeforeYear = [...baseDatasets]
    .filter((dataset) => dataset.year <= year)
    .sort(sortDatasetsByYearDesc)[0];
  if (latestAtOrBeforeYear) {
    return latestAtOrBeforeYear;
  }

  return [...baseDatasets].sort(sortDatasetsByYearAsc)[0] ?? null;
}

export function inferRegionFilterStrategy(region: RegionRecord): RegionFilterStrategy {
  if (!region.requiresFilter || !region.filterField || !region.filterValue) {
    return null;
  }

  if (region.countryId === 'uk') {
    if (region.regionType === 'country') {
      return 'row_filter';
    }

    if (region.regionType === 'constituency' || region.regionType === 'local_authority') {
      return 'weight_replacement';
    }
  }

  if (region.countryId === 'us') {
    if (region.regionType === 'place' || region.regionType === 'state') {
      return 'row_filter';
    }

    if (region.regionType === 'congressional_district') {
      return 'weight_replacement';
    }
  }

  return 'row_filter';
}

async function fetchDatasetsCached(countryId: CountryId): Promise<V2DatasetMetadata[]> {
  const cachedPromise = datasetPromiseCache.get(countryId);
  if (cachedPromise) {
    return cachedPromise;
  }

  const promise = fetchDatasets(countryId).catch((error) => {
    datasetPromiseCache.delete(countryId);
    throw error;
  });
  datasetPromiseCache.set(countryId, promise);
  return promise;
}

async function fetchRegionRecordCached(
  countryId: CountryId,
  regionCode: string,
  region?: RegionRecord
): Promise<RegionRecord> {
  if (region) {
    return region;
  }

  const cacheKey = `${countryId}:${regionCode}`;
  const cachedPromise = regionPromiseCache.get(cacheKey);
  if (cachedPromise) {
    return cachedPromise;
  }

  const promise = fetchRegionByCode(countryId, regionCode)
    .then((record) => toRegionRecord(countryId, record))
    .catch((error) => {
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
      datasetYear: null,
      datasetId: null,
      filterStrategy: null,
    },
    v2: {
      countryId: target.countryId,
      code: target.code,
      label: target.label,
      regionType: target.regionType,
      filterField: target.filterField,
      filterValue: target.filterValue,
      datasetYear: target.year,
      datasetId: target.datasetId,
      filterStrategy: target.filterStrategy,
    },
    skipFields: [
      ...(selectedLabel == null ? (['label'] as const) : []),
      'regionType',
      'filterField',
      'filterValue',
      'datasetYear',
      'datasetId',
      'filterStrategy',
    ],
  };
}

async function shadowResolveRegionTargetImpl(args: {
  countryId: CountryId;
  regionCode: string;
  year?: number | null;
  selectedLabel?: string | null;
  region?: RegionRecord;
}): Promise<ResolvedRegionTarget | null> {
  const { countryId, region, selectedLabel, year = null } = args;
  const canonicalCode = normalizeRegionCode(countryId, args.regionCode);
  const yearKey = getRegionYearKey(year);

  if (!SUPPORTED_REGION_COUNTRIES.has(countryId)) {
    logRegionEvent('SKIPPED', 'Region resolution skipped: unsupported country', {
      countryId,
      regionCode: canonicalCode,
      year: yearKey,
    });
    return null;
  }

  let resolvedRegion: RegionRecord;
  try {
    resolvedRegion = await fetchRegionRecordCached(countryId, canonicalCode, region);
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
        year: yearKey,
        error: errorMessage,
      }
    );
    return null;
  }

  let datasets: V2DatasetMetadata[];
  try {
    datasets = await fetchDatasetsCached(countryId);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logRegionEvent('FAILED', `Region resolution failed: ${errorMessage}`, {
      countryId,
      regionCode: resolvedRegion.code,
      year: yearKey,
      error: errorMessage,
    });
    return null;
  }

  const dataset = selectDatasetForRegionYear(datasets, year);
  if (!dataset) {
    logRegionEvent('SKIPPED', 'Region resolution skipped: no dataset available', {
      countryId,
      regionCode: resolvedRegion.code,
      year: yearKey,
    });
  }

  const target = createResolvedRegionTarget({
    region: resolvedRegion,
    datasetId: dataset?.id ?? null,
    year: dataset?.year ?? null,
    filterStrategy: inferRegionFilterStrategy(resolvedRegion),
  });

  setResolvedRegionId(countryId, resolvedRegion.code, resolvedRegion.id);
  if (dataset?.id) {
    setResolvedDatasetId(countryId, resolvedRegion.code, yearKey, dataset.id);
  }

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
  year?: number | null;
  selectedLabel?: string | null;
  region?: RegionRecord;
}): Promise<ResolvedRegionTarget | null> {
  const canonicalCode = normalizeRegionCode(args.countryId, args.regionCode);
  const cacheKey = `${args.countryId}:${canonicalCode}:${getRegionYearKey(args.year)}`;
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
  datasetPromiseCache.clear();
  regionPromiseCache.clear();
}
