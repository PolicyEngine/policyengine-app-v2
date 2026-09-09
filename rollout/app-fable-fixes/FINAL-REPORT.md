# App PR #1192: final Fable fixes

All three findings are fixed and committed locally. **934 tests across 84 suites passed**, along with all three forced workspace typechecks, both production builds, and formatting/lint on all 29 changed TypeScript files. **Publication is blocked by session permissions/networking.** PR #1192 remains open/draft at its original head; it has not received these fixes.

## Exact source binding

- Owned checkout: `/Users/maxghenis/spm-rebuild-20260908/worktrees/policyengine-app-v2-canonical`.
- Repository / PR: `PolicyEngine/policyengine-app-v2` / #1192.
- Unchanged base: `2e38710033e846461217291328a3748d1cd45de7`.
- Starting and last verified remote head: `8a94c03b81117eeedde2fb9325c6f860496789af`.
- Target remote branch: `max/canonical-spm-household-reports-20260909`; local branch: `canonical-spm-choice`.
- Validated implementation commit: `d9ee7aab4e2af4793e58de09647eaf25ca67ba14`.
- Exact validated `app/src` Git tree: `97349af472b9a8693cbb7d87c7a2d7921f66b7a1`.
- Validation/changelog commit: `fd3525207bc5afcdf975edae8d5366559d980012`. The final report/progress/PR-body commit follows it without source changes.

The complete Fable review was read from `/Users/maxghenis/chief-of-staff/state/subfleet/gates/20260909-171303-pr-9fbed02a/rounds/001-2576d7d9a00c/peer-output.md`. Its SHA-256, original handoff hashes and notebook receipt binding are recorded in [source-binding.json](source-binding.json). Repository/app/test guidance and design standards were read before implementation. Fetch was attempted before edits; the GitHub connector independently verified the exact requested PR head/base.

## Changes

1. **Mixed populations fail before writes.** Shared report preflight validates the actual selected population in every simulation before creating any household or simulation. It rejects household/geography mixtures in either direction, dual selections and stale declared population kinds. Create, replace and save-as-new all use this boundary. Readiness disables submission, visible guidance identifies the correction, accessible “Swap population” controls remain available, and independent-population browsing offers the matching type. Shared baseline changes can still switch both populations together. Independent same-type households and policies retain their own inputs and dates.

2. **Variation/MTR corrective errors retain their meaning.** Point and calculate-full APIs reuse the same parser for HTTP failures and parsed `status: "error"` responses. The existing five corrective SPM codes retain their API message/code and `retryable: false`, stopping identical automatic retries. Transient HTTP 500 failures still retry once. Both earnings and MTR pages show corrective guidance immediately, even while the sibling calculation remains pending. The point HTTP 200 code-loss residual is also covered.

   Read-only API inspection is bound to `a21fcd6d8f764aad565b105db696a0b14c2ee647` and seven exact file hashes in [variation-api-source-binding.json](variation-api-source-binding.json). Current routes return HTTP 400 with `status`, `message`, `result: null`, and `errors: [{code, message}]`. HTTP 200 tests cover compatibility with the same envelope and existing message/error fields; they do not assert a new live response shape. See [VARIATION-ERRORS.md](VARIATION-ERRORS.md).

3. **Invalid hydration terminates visibly.** Completed source/country mismatches, missing report data and empty simulations produce actionable load errors. The page checks errors before its missing-state loading branch. Invalid or switched sources hide old drafts on the first render; retired snapshot ownership prevents delayed callbacks from changing a recovered draft, including after reopening the same source. Valid snapshots retain class-aware cloning and original-state cancellation.

## Verification

Regression tests were run before their fixes:

| Scope | Before fix | Final focused result |
| --- | --- | --- |
| Mixed population writes and correction UI | 8 write-boundary failures plus 6 readiness/UI failures | 60 tests / 8 suites passed |
| Hydration and snapshot ownership | 13 original failures plus 2 recovered-owner failures | 26 tests / 4 suites passed |
| Typed variation errors and pending sibling | 32 original failures plus 4 pending-sibling failures | 105 tests / 9 affected suites passed |

These focused counts overlap the combined run; they are not additive. Mixed-population cases exercise actual hydrated and manual state with readiness deliberately bypassed, both directions and all three save modes, asserting no household/simulation/report/association write or success callback. Existing R3 effective-year recovery, original household/policy dates, independent inputs, cancellation, failed writes, receipt persistence and reopening remain covered. Expected numeric fixture values were not weakened.

Final combined validation:

- **934 tests / 84 suites passed in 36.15 seconds**: the prior 79-suite R3 set plus five additional affected suites. Exact arguments are in [test-run.json](test-run.json); suite paths are in [affected-tests.txt](affected-tests.txt). Command from `app/`: `bun run vitest --maxWorkers=2 --no-cache` followed by those paths.
- Root `bun run typecheck --force`: **3/3 workspace tasks passed**, zero cached tasks, after Next generated its types.
- `app/`: `bun run build:calculator` passed. `calculator-app/`: `bun run build` passed.
- Prettier check and ESLint `--max-warnings=0` passed on all **29** changed/new TypeScript paths in [changed-typescript.txt](changed-typescript.txt).
- `git diff --check` passed. Independent cross-review found no remaining material source issue.

Exact log paths and SHA-256 hashes are in [validation.json](validation.json). Existing Vite chunk-size/mixed-import warnings and Turbo cache-write permission warnings remain; compilation succeeded. Historical 848/79 and independent 238/27 evidence were not presented as today's counts.

## Notebook qualification and preservation

All **18/18** generation-source SHA-256 hashes still match `/Users/maxghenis/spm-rebuild-20260908/rollout/app-installed-notebook-qualification/source-receipt.json` (receipt SHA-256 `59f1c146bd0998a0353fca48d5893757c12739cc9f22556f285f5952a803401a`). That receipt records the precommit base as its head; reuse is established by the exact file hashes, not that older head field. The existing notebook qualification is reused without generator or numeric changes and without a new numerical-parity claim.

All five original untracked handoff reports are preserved byte-for-byte. Existing source, fixtures and prior evidence remain intact. No browser, live population work, expensive axes/notebook recalculation, dependency changes, global chrome changes, sibling edits, deployment, merge, or forbidden-log access occurred.

## Publication and root handoff

Shell fetch/push failed with `Could not resolve host: github.com`. The GitHub connector could read and verify the PR, but rejected the first tree-creation request with **“MCP tool call requires approval, but approval policy is never.”** No tree upload, remote branch update, PR-body update or merge occurred. See [publication-status.json](publication-status.json).

The remote PR body was re-read and verified unchanged; it still describes the earlier head and historical validation. [PR-BODY.md](PR-BODY.md) is the prepared replacement for use after the source is pushed. All local commit messages were verified after writing them.

Root can publish from a session with working authorized transport:

```sh
git push origin HEAD:refs/heads/max/canonical-spm-household-reports-20260909
gh pr edit 1192 --body-file rollout/app-fable-fixes/PR-BODY.md
gh pr view 1192 --json headRefOid,baseRefOid,headRefName,body,state
```

Then verify remote head equals local HEAD, the base is unchanged, and the PR body matches the prepared file. Root retains Fable gate recording and live service/published-package verification. The dispatcher's BrokenPipeError was not bypassed, and no approval/promotion claim is made.
