/* eslint-disable no-console */
/**
 * Regenerate the parameter-search evaluation cases from the legislative
 * tracker.
 *
 * Every bill the tracker has scored pairs a natural-language title and
 * summary with the parameter paths an analyst actually reformed — free
 * ground truth for search. The result is committed as a fixture so the
 * evaluation runs without credentials or network.
 *
 * Run with:
 *   NEXT_PUBLIC_TRACKER_SUPABASE_URL=... NEXT_PUBLIC_TRACKER_SUPABASE_ANON_KEY=... \
 *     bun run refresh-search-eval-cases
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import type { ParameterSearchEvalCase } from '../src/libs/parameterSearchEval';
import { loadParameterMetadata } from './loadParameterMetadata';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CASES_PATH = path.join(__dirname, '../src/tests/fixtures/libs/parameterSearchEvalCases.json');

/** Bill summaries run long; a searcher's query does not. */
const QUERY_CHAR_LIMIT = 120;

/**
 * The tracker writes bracket paths with a literal `brackets` segment
 * (`...rates.joint.brackets[1].rate`) while the model's metadata indexes
 * the bracket directly (`...rates.joint[1].rate`). Both name the same
 * parameter, so the fixture stores the metadata's spelling — otherwise
 * two thirds of the ground truth points at paths search cannot return.
 */
function normalizePath(path: string): string {
  return path.replace(/\.brackets\[/g, '[');
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing ${name}. Both tracker env vars are required.`);
    process.exit(1);
  }
  return value;
}

async function trackerSelect(table: string, select: string): Promise<any[]> {
  const url = requireEnv('NEXT_PUBLIC_TRACKER_SUPABASE_URL');
  const anonKey = requireEnv('NEXT_PUBLIC_TRACKER_SUPABASE_ANON_KEY');
  const response = await fetch(`${url}/rest/v1/${table}?select=${select}&limit=1000`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
  });
  if (!response.ok) {
    throw new Error(`Tracker ${table} failed: ${response.status}`);
  }
  return response.json();
}

async function main(): Promise<void> {
  const [research, impacts, metadata] = await Promise.all([
    trackerSelect('research', 'id,title,description'),
    trackerSelect('reform_impacts', 'id,reform_params'),
    loadParameterMetadata('us'),
  ]);
  const researchById = new Map(research.map((row) => [row.id, row]));

  const cases: ParameterSearchEvalCase[] = [];
  let droppedPaths = 0;
  let droppedCases = 0;
  for (const impact of impacts) {
    const record = researchById.get(impact.id);
    const raw = Object.keys(impact.reform_params ?? {});
    if (!record?.title || raw.length === 0) {
      continue;
    }
    // Reform dicts carry control keys (_use_reform, _skip_params) and
    // parameters that have since been renamed or never merged. A target
    // search cannot return is not a search failure, so it is not a case.
    const expectedPaths = [...new Set(raw.map(normalizePath))].filter(
      (candidate) => candidate.startsWith('gov.') && metadata.parameters[candidate] !== undefined
    );
    droppedPaths += raw.length - expectedPaths.length;
    if (expectedPaths.length === 0) {
      droppedCases += 1;
      continue;
    }
    cases.push({
      id: impact.id,
      query: `${record.title} ${record.description ?? ''}`.trim().slice(0, QUERY_CHAR_LIMIT),
      expectedPaths,
    });
  }

  cases.sort((a, b) => a.id.localeCompare(b.id));
  fs.writeFileSync(CASES_PATH, `${JSON.stringify(cases, null, 2)}\n`);
  const paths = new Set(cases.flatMap((testCase) => testCase.expectedPaths));
  console.log(
    `Wrote ${cases.length} cases (${paths.size} distinct parameters) to ${CASES_PATH}\n` +
      `Dropped ${droppedPaths} unresolvable paths and ${droppedCases} cases with none left, ` +
      `against model ${metadata.version}.`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
