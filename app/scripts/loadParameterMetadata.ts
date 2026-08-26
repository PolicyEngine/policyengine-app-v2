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
import type { ModelledProgram } from '../src/libs/parameterSearchEval';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = path.join(__dirname, '../node_modules/.cache/policyengine');

export interface LoadedMetadata {
  parameters: Record<string, any>;
  version: string;
  /** metadata.modelled_policies.programs — every program the model implements. */
  programs: ModelledProgram[];
}

export async function loadParameterMetadata(
  country: string,
  override?: string | null
): Promise<LoadedMetadata> {
  const cachePath = path.join(CACHE_DIR, `${country}-metadata.json`);
  const source = override ?? cachePath;

  if (fs.existsSync(source)) {
    const cached = JSON.parse(fs.readFileSync(source, 'utf-8'));
    return unpack(cached);
  }

  console.log(`Fetching ${country} metadata (cached to ${cachePath} for later runs)…`);
  const response = await fetch(`https://api.policyengine.org/${country}/metadata`);
  if (!response.ok) {
    throw new Error(`Metadata fetch failed: ${response.status}`);
  }
  const payload = await response.json();
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(cachePath, JSON.stringify(payload));
  return unpack(payload);
}

function unpack(payload: any): LoadedMetadata {
  const result = payload.result ?? payload;
  return {
    parameters: result.parameters,
    version: result.version ?? 'unknown',
    programs: result.modelled_policies?.programs ?? [],
  };
}
