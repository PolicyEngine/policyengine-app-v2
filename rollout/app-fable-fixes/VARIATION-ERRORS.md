# Variation and MTR corrective errors

Finding 2 and the point-calculation HTTP 200 residual are fixed. Both calculation APIs use the shared household error parser for HTTP failures and parsed `status: "error"` responses. The parser preserves `errors[].code` and its message and marks the five existing corrective SPM codes `retryable: false`. The existing variation hook retry predicate consequently stops identical corrective requests; transient failures retain one retry.

Earnings variation and marginal tax rate pages display an accessible error containing the API code/message and directions to update the affected baseline or reform household in report setup. An error appears immediately even while the other simulation's calculation is pending. No axes generation, numeric calculation, notebook generator, existing fixture, household/policy date, or report write code was changed.

## API source binding

Read-only inspection of `policyengine-api-canonical` was bound to stable HEAD `a21fcd6d8f764aad565b105db696a0b14c2ee647`. Exact file SHA-256 values and line references are in [variation-api-source-binding.json](variation-api-source-binding.json).

Current point and calculate-full routes execute `HouseholdCalculationService` and `country.calculate` locally. Typed SPM exceptions propagate through the country calculation to `_spm_error_response`, which emits HTTP 400 with `{status: "error", message, result: null, errors: [{code, message}]}`. There is no direct worker-response forwarding for either household endpoint. The source and OpenAPI contract agree on this envelope.

HTTP 200 tests exercise compatibility with that same error envelope and the pre-existing `message`/`error` fields; they do not claim that the current API emits typed SPM failures with HTTP 200 or invent top-level code fields. All requests in these tests use mocked `Response` objects. No live or expensive calculation was run.

## Verification

| Check | Result |
| --- | --- |
| Initial regression-first API and actual-hook/page tests | 32 failed, 2 passed across 2 suites, before source changes; missing metadata and duplicate requests reproduced |
| Deferred-sibling regression before error/loading branch correction | 4 failed, 10 skipped in 1 suite; both roles and both pages hid the error behind the sibling spinner |
| Final focused API and actual-hook/page tests | 41 passed across 2 suites |
| Final broader affected SPM/API/strategy suite | 105 passed across 9 suites |
| Scoped ESLint | Passed with `--max-warnings 0` on all 9 changed/new TypeScript files |
| Scoped Prettier check | Passed on all 9 changed/new TypeScript files |
| `git diff --check` | Passed |

The focused tests cover all five existing corrective SPM codes under HTTP 400 and compatible HTTP 200 envelopes for point and variation APIs; legacy error messages; malformed JSON, plain text and null fallback bodies; no duplicate corrective requests for baseline/reform in earnings/MTR; a pending sibling; and one retry for HTTP 500 failures.

The broader command, run from `app/`, was:

```sh
bun run vitest src/tests/unit/api/householdErrors.test.ts src/tests/unit/api/householdSPM.test.ts src/tests/unit/api/householdCalculation.test.ts src/tests/unit/libs/calculations/strategies/HouseholdCalcStrategy.test.ts src/tests/integration/household/HouseholdVariationSPMErrors.test.tsx src/tests/integration/household/HouseholdVariationSPMReadiness.test.tsx src/tests/integration/household/HouseholdSPMSaveErrors.test.tsx src/tests/integration/household/SavedReportSPMErrors.test.tsx src/tests/integration/household/HouseholdSPMMethodology.test.tsx
```

Local execution evidence: `variation-errors-red.log`, `variation-errors-pending-sibling-red.log`, `variation-errors-green.log`, `variation-errors-affected.log`, `variation-errors-eslint.log`, and `variation-errors-format-check.log` in this directory. Repository-wide `.log` ignore rules apply; the committed summary above records their results. Root owns the combined R3 regression suite, typechecks/builds, exact notebook-hash reuse receipt, commits, push, and PR verification.
