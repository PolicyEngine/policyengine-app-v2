# Migration brittleness analysis

## Critical: No idempotency

If the user clicks "Migrate" twice, or the page remounts after a partial migration, the entire pipeline runs again from scratch. Every report gets duplicated in v2 — new policies, new households, new reports, new associations. There's nothing that checks "did I already migrate this?"

- The banner shows after `setV1Reports([])` clears state, but a page refresh re-detects from localStorage (cleanup is dry-run)
- A network timeout mid-migration leaves some reports migrated and some not, but the next run re-migrates the ones that already succeeded
- The v2 API happily creates duplicate policies/households/reports

## Critical: No rollback on partial failure

The orchestrator fails-fast at each step (policy → household → report → association). If step 5 (create analysis) fails after step 3 (policy) and step 4 (household) succeeded, those orphaned v2 policies and households are never cleaned up. Over time this creates garbage in the v2 database with no way to trace it back.

## High: v1 API availability is assumed

The entire pipeline depends on the v1 API still being live (`BASE_URL`):
- `fetchReportById` → `/{countryId}/report/{reportId}`
- `fetchSimulationById` → `/{countryId}/simulation/{simulationId}`
- `fetchV1Policy` → v1 policy endpoint
- `fetchV1Household` → `/{countryId}/household/{householdId}`

If the v1 API goes down or is decommissioned before all users have migrated, the migration breaks completely. There's no cached/offline fallback.

## High: `parseDateRange` is fragile

```ts
const parts = dateRange.split('.');
```

This splits on `.`, but v1 date ranges come in at least three formats: `"2025-01-01.2025-12-31"`, `"2025.2026"`, `"2025"`. If any v1 policy uses an unexpected format (e.g. `"2025-01-01.2025-06-30.2025-12-31"` or an empty string), the parser silently produces wrong dates rather than failing loudly.

## High: Parameter name mapping is lossy

```ts
if (!parameterId) {
  unmappedParams.push(paramName);
  continue;  // silently skips this parameter
}
```

If a v1 policy references parameters that don't exist in v2 (renamed, removed, or not yet imported), those parameters are silently dropped. The migration reports "success" but the migrated policy is semantically different from the original. The user has no way to know their reform lost parameters.

## Medium: No concurrency protection

`migrateAllV1Reports` runs sequentially (good), but there's nothing preventing two browser tabs from running migration simultaneously. Both would detect the same v1 reports from localStorage and create duplicate v2 entities.

## Medium: Household conversion assumes v1 structure

`v1ResponseToHousehold` does `Object.values(v1People)` and extracts year-keyed values. If a v1 household has an unexpected structure (missing `people` key, nested differently, or corrupted data), the conversion silently produces an empty or partial household rather than failing.

## Medium: `'current_law'` string literal

```ts
baseline_policy_id: baselinePolicyResult.v2Id ?? 'current_law',
```

The string `'current_law'` is used as a magic sentinel. If the v2 API ever changes how it represents baseline policies, this breaks silently.

## Low: Detection logic will miss edge cases

```ts
function isV1Report(report: UserReport): boolean {
  return !report.outputType || !report.simulationIds?.length;
}
```

A v1 report that somehow has `outputType` set (maybe from a half-completed v2 write) won't be detected as needing migration. Conversely, a v2 report that's been freshly created but hasn't had its simulations populated yet would be incorrectly flagged as v1.

## Low: Year parsing

```ts
year: parseInt(v1Report.year, 10),
```

If `v1Report.year` is `null`, `undefined`, or non-numeric, `parseInt` returns `NaN`, which gets passed to the economy analysis endpoint.

## Prioritized fixes

1. **Idempotency guard** — before migrating each report, check if a v2 user-report-association already exists for this `(userId, label/reportId)` combo. Skip if found.
2. **Surface unmapped parameters** — bubble the `unmappedParams` list up through `MigrationError` so it shows in the banner (currently only logged to console).
3. **Guard against re-runs** — either mark migrated v1 records in localStorage (add a `migratedToV2: true` field) or persist migration state separately so detection skips them.
