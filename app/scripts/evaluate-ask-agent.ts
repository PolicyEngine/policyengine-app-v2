/* eslint-disable no-console */
/**
 * Score the US Ask agent's reform drafting against tracker-modelled bills.
 *
 * Each case sends a bill to the real agent (the same loop, tools, prompt,
 * and settings the chat route uses) and compares the reform it validates
 * with the one an analyst built. Every run calls the Anthropic API and
 * costs money, so runs stop at a spending budget.
 *
 * Run with (ANTHROPIC_API_KEY set):
 *   bun run evaluate-ask -- --limit 5                 # small sample first
 *   bun run evaluate-ask -- --budget 20 --label opus-5.5-medium --effort medium
 *   bun run evaluate-ask -- --update-baseline --label baseline
 *
 * Flags override US_ASK_DEFAULTS: --model, --effort, --cache, --fallbacks,
 * --max-turns. Also --ids a,b, --concurrency N, --metadata <path>, and
 * --judge, which asks a second model whether a non-exact draft is still
 * equivalent to the analyst's reform.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import Anthropic from '@anthropic-ai/sdk';
import {
  askAgentEvalPrompt,
  buildJudgePrompt,
  estimateCostUsd,
  extractProposedReform,
  gradeAskAgentCase,
  groupAskAgentResults,
  parseJudgeVerdict,
  sampleAskAgentCases,
  summarizeAskAgentResults,
  type AskAgentCaseResult,
  type AskAgentEvalCase,
  type AskAgentSuiteSummary,
  type ProposedReform,
  type ReformLine,
} from '../src/libs/flagship/askAgentEval';
import {
  buildUsAskContextFromMetadata,
  createReferenceFetcher,
  executeUsAskTool,
  US_ASK_DEFAULTS,
  US_ASK_SYSTEM_PROMPT,
  US_ASK_TOOLS,
} from '../src/libs/flagship/usAskAgent';
import { runAskAgentLoop, type AskAgentEffort } from '../src/libs/flagship/usAskLoop';
import { getCurrentValue } from '../src/utils/parameterValues';
import { loadParameterMetadata } from './loadParameterMetadata';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.join(__dirname, '../src/tests/fixtures/libs');
const CASES_PATH = path.join(FIXTURES, 'askAgentEvalCases.json');
const BASELINE_PATH = path.join(FIXTURES, 'askAgentEvalBaseline.json');
const RESULTS_DIR = path.join(__dirname, '../node_modules/.cache/policyengine/ask-eval');
const CASE_TIMEOUT_MS = 240_000;
const JUDGE_MODEL = 'claude-sonnet-5-5';

function readFlag(name: string): string | null {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? (process.argv[index + 1] ?? null) : null;
}

function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

interface RunConfig {
  model: string;
  effort: AskAgentEffort | undefined;
  cachePrompt: boolean;
  fallbacks: boolean;
  maxToolTurns: number;
}

function runConfig(): RunConfig {
  return {
    model: readFlag('model') ?? US_ASK_DEFAULTS.model,
    effort: (readFlag('effort') as AskAgentEffort | null) ?? US_ASK_DEFAULTS.effort,
    cachePrompt: hasFlag('cache') || US_ASK_DEFAULTS.cachePrompt,
    fallbacks: hasFlag('fallbacks') || US_ASK_DEFAULTS.fallbacks,
    maxToolTurns: Number(readFlag('max-turns') ?? US_ASK_DEFAULTS.maxToolTurns),
  };
}

function formatSummary(title: string, summary: AskAgentSuiteSummary): string {
  if (summary.cases === 0) {
    return `\n${title}\n  no cases`;
  }
  const pct = (value: number) => `${(100 * value).toFixed(1)}%`;
  return [
    `\n${title}`,
    `  ${summary.cases} cases${summary.errors ? ` · ${summary.errors} errors` : ''}`,
    `    all values right  ${pct(summary.allCorrectRate)}`,
    `    exact reform      ${pct(summary.exactRate)}`,
    `    path recall       ${pct(summary.pathRecall)}`,
    `    value accuracy    ${pct(summary.valueAccuracy)}`,
    ...(summary.judgedEquivalentRate === null
      ? []
      : [
          `    judged equivalent ${pct(summary.judgedEquivalentRate)} (partial ${pct(summary.judgedPartialRate ?? 0)})`,
        ]),
    `    model calls       ${summary.meanModelCalls.toFixed(1)} per case`,
    `    cost              $${summary.meanCostUsd.toFixed(3)} per case · $${summary.totalCostUsd.toFixed(2)} total`,
    `    median latency    ${(summary.medianLatencyMs / 1000).toFixed(1)}s`,
  ].join('\n');
}

async function main(): Promise<void> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY is required; this evaluation calls the Anthropic API.');
    process.exit(1);
  }
  const config = runConfig();
  const budget = Number(readFlag('budget') ?? 5);
  const concurrency = Math.max(1, Number(readFlag('concurrency') ?? 3));
  const label = readFlag('label') ?? `${config.model}${config.effort ? `-${config.effort}` : ''}`;
  const ids = readFlag('ids')?.split(',');
  const limit = readFlag('limit') ? Number(readFlag('limit')) : null;
  const judge = hasFlag('judge');

  const allCases: AskAgentEvalCase[] = JSON.parse(fs.readFileSync(CASES_PATH, 'utf-8'));
  const cases = ids
    ? allCases.filter((testCase) => ids.includes(testCase.id))
    : sampleAskAgentCases(allCases, limit);

  const metadata = await loadParameterMetadata('us', readFlag('metadata'));
  const context = buildUsAskContextFromMetadata(metadata.parameters, {
    fetchReferences: createReferenceFetcher(),
  });
  const client = new Anthropic();

  console.log(
    `Running ${cases.length} cases${judge ? ` with the ${JUDGE_MODEL} judge` : ''} as "${label}" · model ${config.model}` +
      ` · effort ${config.effort ?? 'default'} · cache ${config.cachePrompt ? 'on' : 'off'}` +
      ` · budget $${budget} · metadata ${metadata.version}`
  );

  const describe = (reform: Record<string, unknown>): ReformLine[] =>
    Object.entries(reform).map(([path, value]) => ({
      path,
      label:
        context.index.entries.find((entry) => entry.path === path)?.breadcrumb ??
        metadata.parameters[path]?.label ??
        path,
      current: getCurrentValue(metadata.parameters[path]?.values),
      value,
    }));
  const judgeDraft = async (
    testCase: AskAgentEvalCase,
    proposed: ProposedReform | null,
    allCorrect: boolean
  ): Promise<Pick<AskAgentCaseResult, 'judge' | 'judgeCostUsd'>> => {
    if (allCorrect) {
      return { judge: { verdict: 'equivalent', reason: 'Exact match' }, judgeCostUsd: 0 };
    }
    if (!proposed || Object.keys(proposed.reform).length === 0) {
      return { judge: { verdict: 'none', reason: 'No reform drafted' }, judgeCostUsd: 0 };
    }
    const response = await client.messages.create({
      model: JUDGE_MODEL,
      max_tokens: 2048,
      output_config: { effort: 'low' },
      messages: [
        {
          role: 'user',
          content: buildJudgePrompt(
            testCase,
            describe(testCase.expected),
            describe(proposed.reform)
          ),
        },
      ],
    });
    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('');
    return {
      judge: parseJudgeVerdict(text),
      judgeCostUsd: estimateCostUsd(JUDGE_MODEL, {
        modelCalls: 1,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        cacheReadTokens: 0,
        cacheWriteTokens: 0,
      }),
    };
  };

  const results: AskAgentCaseResult[] = [];
  let spent = 0;
  let next = 0;
  let stopped = false;

  const runCase = async (testCase: AskAgentEvalCase): Promise<AskAgentCaseResult> => {
    const started = Date.now();
    try {
      const run = await runAskAgentLoop({
        client,
        model: config.model,
        system: US_ASK_SYSTEM_PROMPT,
        tools: US_ASK_TOOLS as unknown as Anthropic.Beta.BetaToolUnion[],
        messages: [{ role: 'user', content: askAgentEvalPrompt(testCase) }],
        executeTool: (name, input) => executeUsAskTool(context, name, input),
        signal: AbortSignal.timeout(CASE_TIMEOUT_MS),
        maxToolTurns: config.maxToolTurns,
        effort: config.effort,
        cachePrompt: config.cachePrompt,
        fallbacks: config.fallbacks,
      });
      const proposed = extractProposedReform(run.toolCalls);
      const grade = gradeAskAgentCase(testCase, proposed);
      return {
        id: testCase.id,
        contrib: testCase.contrib,
        expectedPaths: Object.keys(testCase.expected).length,
        grade,
        ...(judge ? await judgeDraft(testCase, proposed, grade.allCorrect) : {}),
        validated: proposed?.validated ?? false,
        usage: run.usage,
        costUsd: estimateCostUsd(config.model, run.usage),
        latencyMs: Date.now() - started,
        stopReason: run.stopReason,
        proposed: proposed?.reform ?? null,
      };
    } catch (error) {
      return {
        id: testCase.id,
        contrib: testCase.contrib,
        expectedPaths: Object.keys(testCase.expected).length,
        grade: gradeAskAgentCase(testCase, null),
        validated: false,
        usage: {
          modelCalls: 0,
          inputTokens: 0,
          outputTokens: 0,
          cacheReadTokens: 0,
          cacheWriteTokens: 0,
        },
        costUsd: 0,
        latencyMs: Date.now() - started,
        stopReason: 'error',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  };

  const worker = async () => {
    while (!stopped && next < cases.length) {
      if (spent >= budget) {
        stopped = true;
        break;
      }
      const testCase = cases[next++];
      const result = await runCase(testCase);
      spent += result.costUsd + (result.judgeCostUsd ?? 0);
      results.push(result);
      const mark = result.error ? 'ERR' : result.grade.allCorrect ? 'ok ' : 'no ';
      console.log(
        `  ${mark} ${testCase.id.padEnd(22)} ${result.grade.valuesCorrect}/${result.grade.expectedPaths} values` +
          ` · ${result.usage.modelCalls} calls · $${result.costUsd.toFixed(3)}` +
          ` · ${(result.latencyMs / 1000).toFixed(0)}s` +
          `${result.judge && !result.grade.allCorrect ? ` · judged ${result.judge.verdict}` : ''}` +
          `${result.error ? ` · ${result.error.slice(0, 80)}` : ''}`
      );
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, cases.length) }, worker));

  if (stopped) {
    console.log(
      `\nStopped at the $${budget} budget after ${results.length} of ${cases.length} cases.`
    );
  }

  const groups = groupAskAgentResults(results);
  const summaries = Object.fromEntries(
    Object.entries(groups).map(([name, group]) => [name, summarizeAskAgentResults(group)])
  );
  for (const [name, summary] of Object.entries(summaries)) {
    console.log(formatSummary(name, summary));
  }

  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  const resultsPath = path.join(RESULTS_DIR, `${label}-${Date.now()}.json`);
  fs.writeFileSync(resultsPath, JSON.stringify({ label, config, results }, null, 2));
  console.log(`\nPer-case results: ${resultsPath}`);

  if (hasFlag('update-baseline')) {
    const baseline = fs.existsSync(BASELINE_PATH)
      ? JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf-8'))
      : {};
    baseline[label] = {
      recordedAt: new Date().toISOString().slice(0, 10),
      metadataVersion: metadata.version,
      config,
      suites: summaries,
    };
    fs.writeFileSync(BASELINE_PATH, `${JSON.stringify(baseline, null, 2)}\n`);
    console.log(`Recorded "${label}" in ${BASELINE_PATH}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
