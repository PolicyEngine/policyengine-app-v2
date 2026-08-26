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
  buildConceptAliases,
  buildConceptClusters,
  buildParameterSearchEntries,
  createParameterSearchIndex,
  DEFAULT_SEARCH_FILTERS,
  searchParameters,
} from '../src/libs/parameterSearch';
import {
  buildProgramEvalCases,
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

/**
 * Two suites, never averaged: the tracker cases are one analyst's exact
 * parameter in one policy area, the program cases are shallow coverage
 * across everything the model implements. A single blended number would
 * hide whichever one moved.
 */
type SuiteName = 'tracker' | 'programs';

interface Baseline {
  /** Model version the baseline was recorded against, for context on drift. */
  metadataVersion: string;
  country: string;
  suites: Partial<Record<SuiteName, ParameterSearchEvalMetrics>>;
}

function readFlag(name: string): string | null {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? (process.argv[index + 1] ?? null) : null;
}

function reportSuite(
  title: string,
  note: string,
  metrics: ParameterSearchEvalMetrics,
  msPerQuery: number
): void {
  console.log(`\n${title}`);
  console.log(`  ${note}`);
  console.log(`  ${metrics.cases} cases · ${msPerQuery.toFixed(0)}ms/query`);
  for (const [cutoff, rate] of Object.entries(metrics.hitRate)) {
    console.log(`    hit rate @${cutoff.padEnd(3)} ${(100 * rate).toFixed(1)}%`);
  }
  console.log(`    MRR          ${metrics.mrr.toFixed(3)}`);
  console.log(`    median rank  ${metrics.medianRank ?? '—'}`);
  if (metrics.misses.length > 0) {
    console.log(`    misses (nothing expected in the top 20):`);
    for (const miss of metrics.misses) {
      console.log(`      ${miss.query.slice(0, 90)}`);
    }
  }
}

async function main(): Promise<void> {
  const country = readFlag('country') ?? 'us';
  const { parameters, version, programs } = await loadParameterMetadata(
    country,
    readFlag('metadata')
  );

  const buildStart = performance.now();
  const entries = buildParameterSearchEntries(parameters);
  const clusters = buildConceptClusters(parameters);
  const aliases = buildConceptAliases(parameters);
  const index = createParameterSearchIndex(entries, clusters, aliases);
  const buildMs = performance.now() - buildStart;

  console.log(`\n${country.toUpperCase()} · model ${version}`);
  console.log(
    `${entries.length.toLocaleString()} entries · ${clusters.length.toLocaleString()} clusters · ` +
      `${aliases.size.toLocaleString()} aliases · index built in ${buildMs.toFixed(0)}ms`
  );

  // Ground truth includes gov.contrib.* parameters — a quarter of the
  // tracker cases reform nothing else — so scoring with the UI's default
  // filter would count filter policy as a ranking failure. Measure
  // ranking here; the filter default is a separate question.
  const filters = { ...DEFAULT_SEARCH_FILTERS, includeContrib: true };
  const run = (query: string, limit: number) =>
    searchParameters(index, query, limit, filters).map((entry) => entry.path);
  const score = (cases: ParameterSearchEvalCase[]) => {
    const started = performance.now();
    const metrics = evaluateParameterSearch(run, cases, { cutoffs: [5, 10, 20], maxMisses: 5 });
    return { metrics, msPerQuery: (performance.now() - started) / Math.max(cases.length, 1) };
  };

  const suites: Partial<Record<SuiteName, ParameterSearchEvalMetrics>> = {};

  // Suite 1 — bills the tracker analysed: an analyst's exact parameter,
  // deep in one policy area (US state income tax).
  if (country === 'us') {
    const trackerCases: ParameterSearchEvalCase[] = JSON.parse(
      fs.readFileSync(CASES_PATH, 'utf-8')
    );
    const expected = trackerCases.flatMap((testCase) => testCase.expectedPaths ?? []);
    const stateOf = /^gov\.(?:contrib\.)?states\.([a-z]{2})\./;
    const states = new Set(expected.map((path) => stateOf.exec(path)?.[1]).filter(Boolean));
    const federal = expected.filter((path) => !stateOf.test(path)).length;
    const { metrics, msPerQuery } = score(trackerCases);
    suites.tracker = metrics;
    reportSuite(
      'Tracker bills — exact parameter, one policy area',
      `${expected.length} parameters across ${states.size} states; ${federal} federal`,
      metrics,
      msPerQuery
    );
  }

  // Suite 2 — every program the model implements, queried by the names
  // the model itself gives them. Shallow (any parameter in the program
  // counts) but broad, and each program contributes both its acronym and
  // its spelled-out name.
  // Searchable entries, not every parameter: Medicaid and its like carry
  // economy/household false and never enter the index, so a program with
  // nothing searchable behind it is unreachable by construction rather
  // than badly ranked.
  const searchablePaths = entries.map((entry) => entry.path);
  const {
    cases: programCases,
    skippedUnmapped,
    skippedBroad,
  } = buildProgramEvalCases(programs, searchablePaths);
  if (programCases.length > 0) {
    const { metrics, msPerQuery } = score(programCases);
    suites.programs = metrics;
    reportSuite(
      'Modelled programs — right region of the tree, every policy area',
      `${programCases.length} queries over ${programs.length} programs; ` +
        `skipped ${skippedUnmapped.length} unmapped, ${skippedBroad.length} too broad`,
      metrics,
      msPerQuery
    );

    // Acronyms and their expansions should reach the same place; where
    // they do not, that is the concept-matching gap in one number.
    const byId = new Map(programCases.map((testCase) => [testCase.id, testCase]));
    let pairs = 0;
    let agree = 0;
    const disagreed: string[] = [];
    for (const [id, testCase] of byId) {
      if (!id.endsWith(':name')) {
        continue;
      }
      const full = byId.get(id.replace(':name', ':full'));
      if (!full) {
        continue;
      }
      pairs += 1;
      const shortHit = run(testCase.query, 10).some((path) =>
        testCase.expectedPrefixes?.some((prefix) => path.startsWith(`${prefix}.`))
      );
      const longHit = run(full.query, 10).some((path) =>
        full.expectedPrefixes?.some((prefix) => path.startsWith(`${prefix}.`))
      );
      if (shortHit === longHit) {
        agree += 1;
      } else {
        disagreed.push(`${testCase.query} ${shortHit ? '>' : '<'} ${full.query}`);
      }
    }
    if (pairs > 0) {
      console.log(
        `\n  short name vs full name agree on ${agree}/${pairs} programs ` +
          `(${((100 * agree) / pairs).toFixed(0)}%)`
      );
      for (const line of disagreed.slice(0, 6)) {
        console.log(`    only one form finds it: ${line}`);
      }
    }
  }

  if (process.argv.includes('--update-baseline')) {
    const baseline: Baseline = {
      metadataVersion: version,
      country,
      suites: Object.fromEntries(
        Object.entries(suites).map(([name, metrics]) => [name, { ...metrics, misses: [] }])
      ),
    };
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
  let regressedAnywhere = false;
  console.log(`\nAgainst baseline (model ${baseline.metadataVersion}):`);
  for (const [name, metrics] of Object.entries(suites) as [
    SuiteName,
    ParameterSearchEvalMetrics,
  ][]) {
    const recorded = baseline.suites?.[name];
    if (!recorded) {
      console.log(`  ${name}: no baseline recorded`);
      continue;
    }
    const { regressed, lines } = compareToBaseline(metrics, recorded);
    console.log(`  ${name}:`);
    lines.forEach((line) => console.log(`    ${line}`));
    regressedAnywhere ||= regressed;
  }
  if (regressedAnywhere) {
    console.error('\nSearch quality regressed beyond tolerance.');
    process.exit(1);
  }
  console.log('\nNo regression.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
