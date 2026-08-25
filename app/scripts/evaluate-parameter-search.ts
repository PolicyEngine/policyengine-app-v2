/* eslint-disable no-console */
/**
 * Score parameter search against the tracker-derived cases.
 *
 * Search ranking is easy to change and hard to judge by eye — one query
 * improving says nothing about the other seventy-six. This runs the whole
 * fixture and prints hit rate and MRR, so a ranking change arrives with a
 * number attached.
 *
 * Run with:
 *   bun run evaluate-search                     # score, compare to baseline
 *   bun run evaluate-search -- --update-baseline
 *   bun run evaluate-search -- --country uk
 *
 * Metadata is fetched once and cached under node_modules/.cache; pass
 * --metadata <path> to score against a local snapshot instead.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import {
  buildConceptClusters,
  buildParameterSearchEntries,
  createParameterSearchIndex,
  DEFAULT_SEARCH_FILTERS,
  searchParameters,
} from '../src/libs/parameterSearch';
import {
  compareToBaseline,
  evaluateParameterSearch,
  type ParameterSearchEvalCase,
  type ParameterSearchEvalMetrics,
} from '../src/libs/parameterSearchEval';
import { loadParameterMetadata } from './loadParameterMetadata';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.join(__dirname, '../src/tests/fixtures/libs');
const CASES_PATH = path.join(FIXTURES, 'parameterSearchEvalCases.json');
const BASELINE_PATH = path.join(FIXTURES, 'parameterSearchEvalBaseline.json');

interface Baseline extends ParameterSearchEvalMetrics {
  /** Model version the baseline was recorded against, for context on drift. */
  metadataVersion: string;
  country: string;
}

function readFlag(name: string): string | null {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? (process.argv[index + 1] ?? null) : null;
}

async function main(): Promise<void> {
  const country = readFlag('country') ?? 'us';
  const cases: ParameterSearchEvalCase[] = JSON.parse(fs.readFileSync(CASES_PATH, 'utf-8'));
  const { parameters, version } = await loadParameterMetadata(country, readFlag('metadata'));

  const buildStart = performance.now();
  const entries = buildParameterSearchEntries(parameters);
  const clusters = buildConceptClusters(parameters);
  const index = createParameterSearchIndex(entries, clusters);
  const buildMs = performance.now() - buildStart;

  // Ground truth includes gov.contrib.* parameters — a quarter of the
  // cases reform nothing else — so scoring with the UI's default filter
  // would count filter policy as a ranking failure. Measure ranking here;
  // the filter default is a separate question.
  const filters = { ...DEFAULT_SEARCH_FILTERS, includeContrib: true };
  const searchStart = performance.now();
  const metrics = evaluateParameterSearch(
    (query, limit) => searchParameters(index, query, limit, filters).map((entry) => entry.path),
    cases,
    { cutoffs: [5, 10, 20], maxMisses: 8 }
  );
  const searchMs = performance.now() - searchStart;

  console.log(`\n${country.toUpperCase()} · model ${version}`);
  console.log(
    `${entries.length.toLocaleString()} entries · ${clusters.length.toLocaleString()} clusters · ` +
      `index built in ${buildMs.toFixed(0)}ms`
  );
  const contribOnly = cases.filter((testCase) =>
    testCase.expectedPaths.every((expected) => expected.startsWith('gov.contrib.'))
  ).length;
  const expected = cases.flatMap((testCase) => testCase.expectedPaths);
  const stateOf = /^gov\.(?:contrib\.)?states\.([a-z]{2})\./;
  const states = new Set(expected.map((p) => stateOf.exec(p)?.[1]).filter(Boolean));
  const federal = expected.filter((p) => !stateOf.test(p)).length;
  console.log(
    `${metrics.cases} cases (${contribOnly} reform only contributed parameters) · ` +
      `${(searchMs / Math.max(metrics.cases, 1)).toFixed(0)}ms/query\n`
  );
  for (const [cutoff, rate] of Object.entries(metrics.hitRate)) {
    console.log(`  hit rate @${cutoff.padEnd(3)} ${(100 * rate).toFixed(1)}%`);
  }
  console.log(`  MRR          ${metrics.mrr.toFixed(3)}`);
  console.log(`  median rank  ${metrics.medianRank ?? '—'}`);

  // Coverage is part of the result: a score means little without knowing
  // which slice of policy it was measured on.
  console.log('\nWhat these cases cover:');
  console.log(`  ${expected.length} expected parameters across ${states.size} states`);
  console.log(
    `  ${federal} are federal (${((100 * federal) / expected.length).toFixed(0)}%) — the tracker follows state bills`
  );

  if (metrics.misses.length > 0) {
    console.log('\nMisses (no expected parameter in the top 20):');
    for (const miss of metrics.misses) {
      console.log(`  ${miss.query}`);
      console.log(`    wanted: ${miss.expectedPaths.slice(0, 2).join(', ')}`);
    }
  }

  if (process.argv.includes('--update-baseline')) {
    const baseline: Baseline = { ...metrics, misses: [], metadataVersion: version, country };
    fs.writeFileSync(BASELINE_PATH, `${JSON.stringify(baseline, null, 2)}\n`);
    console.log(`\nBaseline updated: ${BASELINE_PATH}`);
    return;
  }

  if (!fs.existsSync(BASELINE_PATH)) {
    console.log('\nNo baseline recorded yet — run with --update-baseline to record this run.');
    return;
  }

  const baseline: Baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf-8'));
  if (baseline.country !== country) {
    console.log(`\nBaseline is for ${baseline.country}; skipping comparison.`);
    return;
  }
  const { regressed, lines } = compareToBaseline(metrics, baseline);
  console.log(`\nAgainst baseline (model ${baseline.metadataVersion}):`);
  lines.forEach((line) => console.log(`  ${line}`));
  if (regressed) {
    console.error('\nSearch quality regressed beyond tolerance.');
    process.exit(1);
  }
  console.log('\nNo regression.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
