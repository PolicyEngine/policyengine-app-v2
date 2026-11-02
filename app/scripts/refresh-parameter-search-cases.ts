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
 * The same bills, with the values an analyst set, are the Ask agent's
 * drafting evaluation cases (askAgentEvalCases.json).
 *
 * Run with:
 *   NEXT_PUBLIC_TRACKER_SUPABASE_URL=... NEXT_PUBLIC_TRACKER_SUPABASE_ANON_KEY=... \
 *     bun run refresh-search-eval-cases [-- --only search|ask]
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import type { AskAgentEvalCase, ReformValue } from '../src/libs/flagship/askAgentEval';
import type { ParameterSearchEvalCase } from '../src/libs/parameterSearchEval';
import { loadParameterMetadata } from './loadParameterMetadata';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CASES_PATH = path.join(__dirname, '../src/tests/fixtures/libs/parameterSearchEvalCases.json');
const ASK_CASES_PATH = path.join(__dirname, '../src/tests/fixtures/libs/askAgentEvalCases.json');

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

/** A reform value is either bare or keyed by `start.end` period; the earliest period wins. */
function reformValue(raw: unknown): { value: ReformValue | null; periods: number } {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const periods = Object.keys(raw as Record<string, unknown>).sort();
    const first = (raw as Record<string, unknown>)[periods[0]];
    return {
      value: typeof first === 'number' || typeof first === 'boolean' ? first : null,
      periods: periods.length,
    };
  }
  return {
    value: typeof raw === 'number' || typeof raw === 'boolean' ? raw : null,
    periods: 1,
  };
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
    trackerSelect('research', 'id,title,description,state'),
    trackerSelect('reform_impacts', 'id,reform_params'),
    loadParameterMetadata('us'),
  ]);
  const researchById = new Map(research.map((row) => [row.id, row]));

  const only = process.argv.includes('--only')
    ? process.argv[process.argv.indexOf('--only') + 1]
    : null;
  const cases: ParameterSearchEvalCase[] = [];
  const askCases: AskAgentEvalCase[] = [];
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

    // Agent cases keep only values a reform can set directly: numbers and
    // booleans, taking the first period of a multi-period change.
    const expected: Record<string, ReformValue> = {};
    let multiPeriod = false;
    for (const [rawPath, raw] of Object.entries(impact.reform_params ?? {})) {
      const normalized = normalizePath(rawPath);
      if (!expectedPaths.includes(normalized)) {
        continue;
      }
      const { value, periods } = reformValue(raw);
      multiPeriod ||= periods > 1;
      if (value !== null) {
        expected[normalized] = value;
      }
    }
    const expectedKeys = Object.keys(expected);
    if (expectedKeys.length > 0) {
      askCases.push({
        id: impact.id,
        title: record.title,
        description: record.description ?? '',
        state:
          record.state && /^[a-z]{2}$/i.test(record.state) && record.state.toUpperCase() !== 'US'
            ? record.state.toUpperCase()
            : null,
        expected,
        contrib: expectedKeys.every((key) => key.startsWith('gov.contrib.')),
        multiPeriod,
      });
    }
  }

  cases.sort((a, b) => a.id.localeCompare(b.id));
  askCases.sort((a, b) => a.id.localeCompare(b.id));
  if (only !== 'ask') {
    fs.writeFileSync(CASES_PATH, `${JSON.stringify(cases, null, 2)}\n`);
  }
  if (only !== 'search') {
    fs.writeFileSync(ASK_CASES_PATH, `${JSON.stringify(askCases, null, 2)}\n`);
    console.log(`Wrote ${askCases.length} Ask agent cases to ${ASK_CASES_PATH}`);
  }
  const paths = new Set(cases.flatMap((testCase) => testCase.expectedPaths));
  console.log(
    `${only === 'ask' ? 'Found' : 'Wrote'} ${cases.length} search cases (${paths.size} distinct parameters)\n` +
      `Dropped ${droppedPaths} unresolvable paths and ${droppedCases} cases with none left, ` +
      `against model ${metadata.version}.`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
