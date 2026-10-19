/* eslint-disable no-console */
/**
 * Shared metadata loader for the parameter-search scripts.
 *
 * The full parameter metadata is tens of megabytes, so it is cached under
 * node_modules/.cache rather than re-downloaded per run. The API has no
 * endpoint that reports its model version without the whole payload, so
 * the cache expires by age (METADATA_CACHE_MAX_AGE_HOURS, default 24) and
 * a refetch says when the model version moved. Pass --refresh to the
 * scripts to refetch now.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import {
  isMetadataCacheFresh,
  readModelledPrograms,
  type MetadataCacheStamp,
  type ModelledProgram,
} from '../src/libs/parameterSearchEval';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = path.join(__dirname, '../node_modules/.cache/policyengine');
const DEFAULT_MAX_AGE_HOURS = 24;

export interface LoadedMetadata {
  parameters: Record<string, any>;
  version: string;
  /** metadata.modelled_policies.programs — every program the model implements. */
  programs: ModelledProgram[];
}

export interface LoadOptions {
  /** Refetch even when the cache is fresh. */
  refresh?: boolean;
  /** Cache lifetime in hours; defaults to METADATA_CACHE_MAX_AGE_HOURS or 24. */
  maxAgeHours?: number;
}

function readStamp(stampPath: string): MetadataCacheStamp | null {
  try {
    return JSON.parse(fs.readFileSync(stampPath, 'utf-8'));
  } catch {
    return null;
  }
}

export async function loadParameterMetadata(
  country: string,
  override?: string | null,
  { refresh = false, maxAgeHours }: LoadOptions = {}
): Promise<LoadedMetadata> {
  if (override) {
    return unpack(JSON.parse(fs.readFileSync(override, 'utf-8')), override);
  }

  const cachePath = path.join(CACHE_DIR, `${country}-metadata.json`);
  const stampPath = path.join(CACHE_DIR, `${country}-metadata.stamp.json`);
  const maxAge =
    maxAgeHours ?? Number(process.env.METADATA_CACHE_MAX_AGE_HOURS ?? DEFAULT_MAX_AGE_HOURS);
  const stamp = readStamp(stampPath);

  // A cache without a stamp predates versioning: its age is unknown, so refetch.
  if (!refresh && fs.existsSync(cachePath) && isMetadataCacheFresh(stamp, maxAge)) {
    return unpack(JSON.parse(fs.readFileSync(cachePath, 'utf-8')), cachePath);
  }

  console.log(`Fetching ${country} metadata (cached to ${cachePath} for later runs)…`);
  const response = await fetch(`https://api.policyengine.org/${country}/metadata`);
  if (!response.ok) {
    throw new Error(`Metadata fetch failed: ${response.status}`);
  }
  const payload = await response.json();
  const loaded = unpack(payload, 'the API');
  if (stamp && stamp.version !== loaded.version) {
    console.log(
      `Model version changed since the cached copy: ${stamp.version} → ${loaded.version}`
    );
  }
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(cachePath, JSON.stringify(payload));
  const newStamp: MetadataCacheStamp = {
    version: loaded.version,
    fetchedAt: new Date().toISOString(),
  };
  fs.writeFileSync(stampPath, JSON.stringify(newStamp));
  return loaded;
}

function unpack(payload: any, source: string): LoadedMetadata {
  const result = payload.result ?? payload;
  return {
    parameters: result.parameters,
    version: result.version ?? 'unknown',
    programs: programsIn(result, source),
  };
}

function programsIn(result: any, source: string): ModelledProgram[] {
  const { programs, warning } = readModelledPrograms(result?.modelled_policies);
  if (warning) {
    console.warn(`Warning (${source}): ${warning}`);
  }
  return programs;
}
