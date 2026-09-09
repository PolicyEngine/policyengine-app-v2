# Canonical SPM app integration progress

## Fable final findings — 2026-09-09

### State
- All three final findings implemented, verified and committed locally for PR #1192; publication is blocked by transport/session approval policy. Starting head `8a94c03b81117eeedde2fb9325c6f860496789af`; unchanged base `2e38710033e846461217291328a3748d1cd45de7`.
- Verified implementation commit `d9ee7aab4e2af4793e58de09647eaf25ca67ba14`; exact app source tree and test/log hashes are in `rollout/app-fable-fixes/validation.json`.
- Current standing orders supersede historical no-commit instructions below: each coherent step committed, final publication targets `max/canonical-spm-household-reports-20260909`.

### Done
- Read the full Fable review, app/repository/test guidance, and design standards; attempted fetch before editing. Shell fetch failed DNS, while GitHub connector verified exact open/draft PR head/base/branch.
- Committed terminal hydration errors, immediate old-state hiding and immutable snapshot ownership; 13 original red failures plus two recovered-owner failures, then 26 focused tests / 4 suites passed.
- Committed mixed-population preflight before household/simulation writes plus correction/selection UI. Both directions across create/replace/save-as-new, actual hydrated state, stale readiness, ambiguous manual state and independent households/policies are covered; 14 red failures, then 60 tests / 8 suites passed.
- Committed shared typed HTTP 400 and compatible HTTP 200 error parsing for point/variation; deterministic SPM retries stop, corrective errors appear while a sibling is pending. 32 original red failures plus four pending-sibling failures, then 105 affected tests / 9 suites passed. Exact read-only API source SHA-256 binding is recorded.
- Final combined regression run: **934 tests / 84 suites passed** (36.15s), covering the prior 79-suite R3 set and five added affected suites. All three forced workspace typechecks, both production builds, scoped Prettier/ESLint on all 29 changed TypeScript files, and diff checks passed.
- All **18/18 notebook generation-source hashes** match the original qualification receipt; all five original untracked handoff reports remain byte-for-byte intact. No generator/numeric, fixture expected-value, dependency or global chrome changes.
- No browser, live population calculation, expensive axes/notebook recalculation, deployment, merge, sibling edits, or forbidden-log access. Independent cross-review found no remaining material source issue.

- Shell push failed DNS. Connector tree upload was rejected: “MCP tool call requires approval, but approval policy is never.” No remote mutation occurred. Final read verified PR still open/draft at starting head with its unchanged body.
- Final whole-follow-up diff audit found only trailing whitespace in newly captured hydration logs; normalized that whitespace without changing evidence or source. Full diff check now passes.
- Wrote `rollout/app-fable-fixes/FINAL-REPORT.md`, concise `STATUS.md`, prepared `PR-BODY.md` and exact publication blocker record. Local final artifacts are committed; code tree remains the tested tree.

### Next
- Root: push local HEAD to the authorized remote branch using working transport, apply prepared PR body, and verify remote head/base/body.
- Root retains Fable gate recording (dispatcher BrokenPipeError was not bypassed), live service/published-package verification and rollout decisions.

## Follow-up review R3 — 2026-09-09

### State
- Completed the supported-year recovery in `rollout/app-final-r2-independent-review.md`, retaining all resolved R2 fixes and earlier reports. Final output: `APP-SPM-REVIEW-FIXES-R3.md`.
- App worktree only, base `2e387100`; no commits, push, deployment, browser, dependency changes, numerical generator changes, or sibling source edits. Forbidden log files and secrets are not accessed.

### Done
- Read the independent review, app instructions, PolicyEngine app/design/writing guidance, and testing conventions.
- Traced the real year selector, modification, immutable household creation, calculation, and persisted report paths.
- Implemented a single-annual-snapshot copy into per-simulation drafts, preserving ages, monetary amounts, membership, explicit SPM settings, FIPS, and policy date ranges. Submission materializes fresh household IDs and passes their actual objects to both calculation entry points.
- Added visible period-copy guidance, ambiguous-input rejection, and report submission errors. No household writes occur on selector change or cancel.
- Added 12 real selector/create/modify/HTTP persistence/reopen regressions and 18 focused period-copy tests. Already-selected-year mismatches have an explicit copy action; every household is checked before writes.
- Passed 848 tests / 79 affected suites, all three forced workspace typechecks, both production builds, lint/format on 110 TypeScript files, and diff checks.
- Corrected independent reform inheritance/rendering, class-preserving cancel/reset, and source-identity isolation while editing reports; 31 ownership tests pass.
- Finished `APP-SPM-REVIEW-FIXES-R3.md` with the exact 79-suite command, 30 R3 files, and explicit automatic-copy/API-period limitations. Numerical generator, global chrome, dependency pins, and expected snapshots are unchanged in R3.

### Next
- Root owns final diff review, service-backed recovery/reopening, native notebook and numerical verification, Fable, final published pins, and publication. Source is ready for review and remains uncommitted.

## Follow-up review R2 — 2026-09-09

### State
- Implemented all three P2 gaps in `rollout/app-final-independent-review.md` and the coordinated `SPM_YEAR_UNAVAILABLE` corrective error. Final validation passed: 768 tests / 65 suites, three workspace typechecks, both production builds, lint/format on 85 TypeScript files, and diff checks. Final output: `APP-SPM-REVIEW-FIXES-R2.md`.
- Same app-only ownership, preserved prior dirty implementation and five fixes. No commits, pushes, deployment, browsers, sibling source edits, package changes, or expected-value snapshot rewrites.

### Done
- Read the follow-up review and traced the generic strategy/orchestrator path that drops envelopes and fails to persist terminal errors.
- Generic create/modify now preserves full calculation envelopes, uses the saved simulation household/policy, and passes the parent report ID.
- Report output joins the same per-QueryClient calculation owner through persistence; terminal responses and parent reconciliation share one writer. Parent completion waits for durable sibling writes, and terminal errors retain code/message.
- Canonical notebooks pin recorded core and SPM calculator runtimes and reject missing/conflicting required pins. Unsupported-year errors offer year correction while preserving geography.
- Added 22 passing real HTTP/storage/provider integration tests covering create/modify, reopened receipts/errors, both startup/completion orders, delayed PATCH writes, unmount, and economy report/household simulation numeric ID collisions. Additional runtime/year regressions pass.
- Finished `APP-SPM-REVIEW-FIXES-R2.md` with the exact 65-suite test command, 32 R2-touched files, and remaining live checks. Shared global chrome, snapshots, manifests, and lockfiles retain no diff.

### Next
- Root owns candidate-wheel execution of the generated notebooks, service-backed persistence/reopening, final published pins, final diff review, and Fable. Source is ready for review and remains uncommitted.

## Independent review fixes — 2026-09-09

### State
- All five findings in `rollout/app-independent-review.md` are implemented against base `2e387100`, preserving all existing dirty SPM changes. Final validation passed: 593 tests across 52 suites, three workspace typechecks, both production builds, scoped lint/format checks, and diff checks. The final output is `APP-SPM-REVIEW-FIXES.md`.
- Ownership is restricted to this app worktree. No commits, pushes, deployment, native browser automation, package upgrades, snapshot rewrites, or sibling repository edits. The task-specific no-commit instruction overrides the standing commit order.
- Read both handoffs. Root has completed the locked dependency install and prior three-workspace typecheck/Next build; no installation is needed.

### Done
- Captured the initial dirty file inventory and read the independent review and repository guidance.
- Split metadata readiness, reproduction, and saved-report error preservation into bounded parallel tasks; builder errors and variation receipt placement remain with the primary agent.
- Implemented all five findings in the builders/report paths with integration tests exercising real HTTP error parsing, immutable replacement, persistence/hydration, separate reproduction inputs, and axes receipt rendering.
- Passed 530 tests across 49 related suites, forced typechecks for all three workspaces, and scoped ESLint/Prettier. Production builds are running.
- Independent follow-up identified pending saved-report and axes auto-calculation paths that also required metadata readiness checks; both are now covered.
- Closed both pending saved-report and axes auto-calculation bypasses, including a country change while household loading is in flight. Completed historical point results remain readable.
- Exact reproduction now requires the saved year, resolved model version, and matching canonical settings/receipt; null cleanup and serialization preserve actual inputs.
- Final combined verification passed **593 tests / 52 suites**, forced typechecks in all three workspaces, and ESLint on **71 TypeScript files**.
- Passed final Vite calculator and Next.js calculator production builds, final Prettier check on 71 TypeScript files, and `git diff --check`. No manifest, lockfile, global chrome, or snapshot changes.
- Finished `APP-SPM-REVIEW-FIXES.md` with the exact test command, changed-file inventory, and remaining root-owned live checks.

### Next
- Root owns final certified API/model/artifact integration, executable Python parity, live persisted report reopening, browser review, and publication.

## State
Scoped implementation complete and uncommitted in isolated `canonical-spm-choice` worktree at cached `origin/main` commit `2e38710033e846461217291328a3748d1cd45de7`. Original app checkout was inspected clean before and after work and remains untouched. Remote fetch failed DNS, so latest remote status is unverified. Task-specific no-commit/push/deploy/publication instruction overrides the standing commit instruction.

## Done
- Read global/repository guidance and PolicyEngine app/design skills.
- Created independent repository metadata under workspace `.sources` and isolated app worktree.
- Added visible national/county SPM choice gated on API `metadata.spm.available === true`, with explicit county_fips inputs and no implicit geography fallback.
- Persisted settings across household model edits, serialization, API create/get, immutable household replacement, stored-policy replay, and axes requests.
- Blocked canonical report creation/modification for old saved households without explicit selection, with a visible explanation to edit the household.
- Preserved calculation receipts through existing simulation output storage, shown in a results methodology footnote; Python reproduction keeps selected SPM settings.
- Preserved API SPM validation codes/messages for household create/calculation errors.
- Passed 201 tests across 18 relevant suites, changed-file ESLint/Prettier, `git diff --check`, and Vite calculator production build.
- Attempted full typecheck and Next.js calculator build: blocked by missing inherited database/Anthropic dependencies, with no reported errors in changed SPM files.
- Wrote `APP-CANONICAL-SPM-HANDOFF.md` with interfaces, changed files, checks, and release blockers.

## Next
- Root: fetch/rebase against verified latest remote, resolve coordinated country/API/bundle release and certification gates, and install existing locked dependencies to complete Next.js build/typecheck.
- Root: run app-to-API integration against the new country model, inspect UI in a browser, audit other household clients, and own rollout gates. Nothing has been published or deployed.

## 2026-09-09 continuation

- State: original scoped app changes retained; root fetched live main and HEAD...FETCH_HEAD is verified 0/0. No commits, dependency-version changes or publication.
- Done: reran all 201 relevant tests (18 suites), all passed. Attempted existing locked workspace install; sandbox networking blocked missing packages. Full workspace typecheck and calculator Next build still fail on those missing packages.
- Next: root materializes locked dependencies with `TMPDIR=/private/tmp bun install --frozen-lockfile`; complete full typecheck/Next build and root's browser/rollout gates.
