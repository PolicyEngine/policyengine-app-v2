/* eslint-disable no-console */
/**
 * Shared metadata loader for the parameter-search scripts.
 *
 * The full parameter metadata is tens of megabytes, so it is fetched
 * once and cached under node_modules/.cache rather than re-downloaded
 * per run.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = path.join(__dirname, '../node_modules/.cache/policyengine');

export interface LoadedMetadata {
  parameters: Record<string, any>;
  version: string;
}

export async function loadParameterMetadata(
  country: string,
  override?: string | null
): Promise<LoadedMetadata> {
  const cachePath = path.join(CACHE_DIR, `${country}-metadata.json`);
  const source = override ?? cachePath;

  if (fs.existsSync(source)) {
    const cached = JSON.parse(fs.readFileSync(source, 'utf-8'));
    const result = cached.result ?? cached;
    return { parameters: result.parameters, version: result.version ?? 'unknown' };
  }

  console.log(`Fetching ${country} metadata (cached to ${cachePath} for later runs)…`);
  const response = await fetch(`https://api.policyengine.org/${country}/metadata`);
  if (!response.ok) {
    throw new Error(`Metadata fetch failed: ${response.status}`);
  }
  const payload = await response.json();
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(cachePath, JSON.stringify(payload));
  const result = payload.result ?? payload;
  return { parameters: result.parameters, version: result.version ?? 'unknown' };
}
