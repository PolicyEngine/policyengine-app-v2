/**
 * localStorage cache for tax-benefit MODEL METADATA ONLY.
 *
 * This module caches parameter tree structure and parameter definitions that
 * come from the tax-benefit model. This data is the same for all users and
 * only changes when the model version is updated.
 *
 * DO NOT use this module for user-specific data (policies, households,
 * associations, simulation results, etc.). User data must always be fetched
 * fresh from the API to avoid stale or cross-user leaks.
 *
 * Storage keys:
 * - pe_model_version_${countryId} → version info + fetchedAt timestamp
 * - pe_param_children_${countryId} → Record<parentPath, ParameterChildrenResponse>
 * - pe_params_${countryId} → Record<paramName, ParameterMetadata>
 * - pe_variables_${countryId} → Record<varName, VariableMetadata>
 *
 * All caches have a 2-week TTL. When the model version changes,
 * clearMetadataCache() wipes all cached data for that country.
 */

import type { ParameterChildrenResponse } from '@/api/v2';
import type { ParameterMetadata, VariableMetadata } from '@/types/metadata';

const CACHE_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 2 weeks

interface CachedModelVersion {
  versionId: string;
  version: string;
  fetchedAt: number;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function readJSON<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota exceeded or access denied — silently ignore
  }
}

function isCacheStale(fetchedAt: number): boolean {
  return Date.now() - fetchedAt > CACHE_TTL_MS;
}

// ---------------------------------------------------------------------------
// Model version
// ---------------------------------------------------------------------------

export function getCachedModelVersion(countryId: string): CachedModelVersion | null {
  const cached = readJSON<CachedModelVersion>(`pe_model_version_${countryId}`);
  if (!cached || isCacheStale(cached.fetchedAt)) return null;
  return cached;
}

export function setCachedModelVersion(
  countryId: string,
  versionId: string,
  version: string,
): void {
  writeJSON(`pe_model_version_${countryId}`, {
    versionId,
    version,
    fetchedAt: Date.now(),
  });
}

// ---------------------------------------------------------------------------
// Parameter children (tree navigation)
// ---------------------------------------------------------------------------

type ChildrenCache = Record<string, { data: ParameterChildrenResponse; fetchedAt: number }>;

export function getCachedParameterChildren(
  countryId: string,
  parentPath: string,
): ParameterChildrenResponse | null {
  const cache = readJSON<ChildrenCache>(`pe_param_children_${countryId}`);
  if (!cache) return null;
  const entry = cache[parentPath];
  if (!entry || isCacheStale(entry.fetchedAt)) return null;
  return entry.data;
}

export function setCachedParameterChildren(
  countryId: string,
  parentPath: string,
  data: ParameterChildrenResponse,
): void {
  const cache = readJSON<ChildrenCache>(`pe_param_children_${countryId}`) ?? {};
  cache[parentPath] = { data, fetchedAt: Date.now() };
  writeJSON(`pe_param_children_${countryId}`, cache);
}

// ---------------------------------------------------------------------------
// Parameters by name (merged record)
// ---------------------------------------------------------------------------

type ParamsCache = { data: Record<string, ParameterMetadata>; fetchedAt: number };

export function getCachedParameters(
  countryId: string,
  names: string[],
): Record<string, ParameterMetadata> | null {
  const cache = readJSON<ParamsCache>(`pe_params_${countryId}`);
  if (!cache || isCacheStale(cache.fetchedAt)) return null;

  // Check that ALL requested names exist in the cache
  const result: Record<string, ParameterMetadata> = {};
  for (const name of names) {
    if (!cache.data[name]) return null; // cache miss
    result[name] = cache.data[name];
  }
  return result;
}

export function setCachedParameters(
  countryId: string,
  data: Record<string, ParameterMetadata>,
): void {
  const cache = readJSON<ParamsCache>(`pe_params_${countryId}`);
  const existing = cache && !isCacheStale(cache.fetchedAt) ? cache.data : {};
  writeJSON(`pe_params_${countryId}`, {
    data: { ...existing, ...data },
    fetchedAt: Date.now(),
  });
}

// ---------------------------------------------------------------------------
// Variables (full variable catalog)
// ---------------------------------------------------------------------------

type VariablesCache = { data: Record<string, VariableMetadata>; fetchedAt: number };

export function getCachedVariables(
  countryId: string,
): Record<string, VariableMetadata> | null {
  const cache = readJSON<VariablesCache>(`pe_variables_${countryId}`);
  if (!cache || isCacheStale(cache.fetchedAt)) return null;
  return cache.data;
}

export function setCachedVariables(
  countryId: string,
  data: Record<string, VariableMetadata>,
): void {
  writeJSON(`pe_variables_${countryId}`, {
    data,
    fetchedAt: Date.now(),
  });
}

// ---------------------------------------------------------------------------
// Cache invalidation
// ---------------------------------------------------------------------------

export function clearMetadataCache(countryId: string): void {
  try {
    localStorage.removeItem(`pe_model_version_${countryId}`);
    localStorage.removeItem(`pe_param_children_${countryId}`);
    localStorage.removeItem(`pe_params_${countryId}`);
    localStorage.removeItem(`pe_variables_${countryId}`);
  } catch {
    // Silently ignore access errors
  }
}
