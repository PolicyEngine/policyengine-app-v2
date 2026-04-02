# PostHog Implementation Plan

## Current Single-Branch Execution Plan

This is the implementation plan we are actively working from on the current branch.

### Goals

- finish the Next.js PostHog foundation cleanly
- fully instrument both calculator surfaces:
  - household flows
  - society-wide/report flows
- add real website event instrumentation
- complete robust error tracking, release plumbing, and replay/deployment hardening

### Delivery Strategy

We will do this in one branch, but in a few internal milestones so validation stays manageable.

#### Milestone 1: Foundation Cleanup

- normalize the Next.js bootstrap and shared PostHog access points
- keep `website/` and `calculator-app/` as the real runtime bootstrap locations
- keep shared analytics helpers in `app/src/`
- standardize environment variable usage and ownership
- preserve the Next-based local dev workflow as the main validation path

#### Milestone 2: Calculator Event Schema

- add typed event contracts for calculator analytics
- add snapshot builders for modeled inputs
- implement full event coverage for:
  - builders
  - report creation
  - calculation lifecycle
  - report output lifecycle
  - download/share/copy actions
- treat household and society-wide flows as equal first-class surfaces

#### Milestone 3: Website Event Instrumentation

- add real website-specific custom events for:
  - entering the calculator
  - newsletter lifecycle
  - research list interactions
  - research article views
  - country switching

#### Milestone 4: Error Tracking and Release Plumbing

- expand manual exception capture in high-value calculator paths
- make Next route/global/shared-boundary errors consistent
- add release metadata and source-map/release upload hooks
- make server-side request error capture production-ready

#### Milestone 5: Replay and Deployment Hardening

- enable replay intentionally for website and calculator
- add ingestion hardening through proxy or managed proxy configuration
- align env and deployment behavior across local, preview, and production

#### Milestone 6: Final Validation and Docs

- verify pageviews, custom events, and exceptions in both apps
- verify release metadata and production diagnostics
- update this document to reflect the implemented system instead of the planned one
- leave a short internal runbook for local verification and expected events

### Current Status

- foundation: substantially complete
- calculator event schema: in progress
- website event instrumentation: in progress
- error tracking: partially complete
- replay/release/proxy hardening: not yet complete

### Implementation Notes

Current branch progress:

- Next.js PostHog bootstrap remains owned by `website/` and `calculator-app`
- shared calculator analytics now have typed event contracts and snapshot builders
- report creation, calculation lifecycle, report output views, household builder interactions, and policy creation now emit richer calculator events
- website CTA, newsletter, country switcher, research filters, and article views now emit custom website events
- release plumbing, replay configuration, and deployment hardening remain ahead

## Scope

This plan covers:

- `website/` as the public Next.js app-router site
- `calculator-app/` as the product Next.js app-router app
- shared calculator code in `app/src/`
- analytics, session replay, feature-flag readiness, and robust error tracking

This plan assumes:

- one PostHog project for both apps
- anonymous tracking only at first
- modeled household and society-wide configurations are valid analytics payloads
- error tracking is a first-class deliverable, not a later add-on

## Architecture Decisions

### 1. One PostHog project across both apps

Reason:

- lets us track journeys from `policyengine.org` to `app.policyengine.org`
- keeps website, calculator, replay, errors, and experiments in one place
- simplifies release tracking and error correlation

### 2. Use Next.js-native PostHog setup

Use:

- `instrumentation-client.ts` for client bootstrap
- app-root PostHog provider for hooks and React integrations
- `instrumentation.ts` plus `posthog-node` for server-side request error capture
- app-router `error.tsx` and `global-error.tsx` for robust client exception capture

### 3. Keep calculator telemetry in shared code

Most calculator behavior lives in `app/src/`, not the thin Next route wrappers in `calculator-app/src/app/**`.

Therefore:

- Next-specific bootstrap belongs in `calculator-app/`
- event and exception helpers used by calculator flows belong in `app/src/utils/**`
- instrumentation should be attached at real product behavior points in shared code

### 4. Use a typed event model

Implement typed payload maps so event names and payloads are not ad hoc strings.

Benefits:

- fewer broken queries
- consistent dimensions across household and society-wide flows
- easier refactors when shared code changes

### 5. Stay anonymous for now

Do not call `identify()` with placeholders like `anonymous`.

Initial plan:

- rely on PostHog anonymous distinct IDs
- do not create person profiles intentionally
- add `identify(realUserId)` later only if/when auth exists

## Environment Variables

Use these in both apps unless noted otherwise.

| Variable | Scope | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` | client | PostHog project token |
| `NEXT_PUBLIC_POSTHOG_HOST` | client | PostHog host or managed reverse-proxy host |
| `NEXT_PUBLIC_APP_RELEASE` | client | release SHA/version shown on all client events |
| `APP_RELEASE` | server | release SHA/version for server-side errors/events |
| `POSTHOG_PROJECT_TOKEN` | server | server-side token if not reusing public token |
| `POSTHOG_HOST` | server | server-side host |
| `POSTHOG_PERSONAL_API_KEY` | deploy | source-map / release upload |
| `POSTHOG_PROJECT_ID` | deploy | release/source-map targeting |
| `NEXT_PUBLIC_WEBSITE_URL` | calculator only | already used by calculator build |
| `NEXT_PUBLIC_CALCULATOR_URL` | website only | already used by website CTA |

Recommended release value:

- `VERCEL_GIT_COMMIT_SHA`

## Package Dependencies

### Add to `website/package.json`

- `posthog-js`
- `posthog-node`

### Add to `calculator-app/package.json`

- `posthog-js`
- `posthog-node`

No separate `@posthog/react` package is required for this plan. Use `posthog-js/react` per the Next.js docs path.

## File-by-File Changes

## Website: New Files

| File | Responsibility | Exact Exports / Functions |
| --- | --- | --- |
| `website/instrumentation-client.ts` | client bootstrap for PostHog | initialize `posthog` singleton with `defaults`, replay, autocapture, release property |
| `website/instrumentation.ts` | server request error capture | `register()`, `onRequestError(err, request, context)` |
| `website/src/app/providers.tsx` | app-level React provider for PostHog | `PostHogProvider({ children })`, `PostHogPageviewTracker()` |
| `website/src/lib/posthog-server.ts` | singleton Node SDK setup | `getPostHogServer()` |
| `website/src/lib/posthog-events.ts` | typed website event helpers | `captureWebsiteEvent`, `captureWebsiteException`, `trackEnterCalculatorClicked`, `trackNewsletterSignupStarted`, `trackNewsletterSignupSucceeded`, `trackNewsletterSignupFailed`, `trackResearchArticleViewed`, `trackResearchFiltersChanged`, `trackCountrySwitched` |
| `website/src/app/error.tsx` | route-level error capture | default error component calling `captureWebsiteException` |
| `website/src/app/global-error.tsx` | root-layout error capture | default global error component calling `captureWebsiteException` |
| `website/scripts/posthog-release.mjs` | release + source-map upload | `main()` |

## Website: Modified Files

| File | Change |
| --- | --- |
| [website/src/app/layout.tsx](/Users/administrator/Documents/PolicyEngine/app-v2-posthog-pathways/website/src/app/layout.tsx) | wrap app body with `PostHogProvider` |
| [website/src/components/home/HeroCTA.tsx](/Users/administrator/Documents/PolicyEngine/app-v2-posthog-pathways/website/src/components/home/HeroCTA.tsx) | fire `trackEnterCalculatorClicked` before navigation |
| [website/src/components/Footer.tsx](/Users/administrator/Documents/PolicyEngine/app-v2-posthog-pathways/website/src/components/Footer.tsx) | fire newsletter signup started/succeeded/failed events |
| [website/src/components/Header.tsx](/Users/administrator/Documents/PolicyEngine/app-v2-posthog-pathways/website/src/components/Header.tsx) | fire `trackCountrySwitched` |
| [website/src/app/[countryId]/research/ResearchClient.tsx](/Users/administrator/Documents/PolicyEngine/app-v2-posthog-pathways/website/src/app/[countryId]/research/ResearchClient.tsx) | fire `trackResearchFiltersChanged` on meaningful filter/search changes |
| [website/src/app/[countryId]/research/[slug]/ArticleClient.tsx](/Users/administrator/Documents/PolicyEngine/app-v2-posthog-pathways/website/src/app/[countryId]/research/[slug]/ArticleClient.tsx) | fire `trackResearchArticleViewed` on mount |
| [website/scripts/vercel-build.sh](/Users/administrator/Documents/PolicyEngine/app-v2-posthog-pathways/website/scripts/vercel-build.sh) | invoke `posthog-release.mjs` after build when env is available |

## Calculator App: New Files

| File | Responsibility | Exact Exports / Functions |
| --- | --- | --- |
| `calculator-app/instrumentation-client.ts` | client bootstrap for PostHog | initialize `posthog` singleton with replay, autocapture, release property |
| `calculator-app/instrumentation.ts` | server request error capture | `register()`, `onRequestError(err, request, context)` |
| `calculator-app/src/app/posthog-provider.tsx` | app-root PostHog React provider | `PostHogProvider({ children })`, `PostHogPageviewTracker()` |
| `calculator-app/src/lib/posthog-server.ts` | singleton Node SDK setup | `getPostHogServer()` |
| `calculator-app/src/app/global-error.tsx` | root-layout error capture | default global error component calling calculator exception helper |
| `calculator-app/scripts/posthog-release.mjs` | release + source-map upload | `main()` |
| `calculator-app/scripts/vercel-build.sh` | deployment build wrapper | build app, then call `posthog-release.mjs` |
| `calculator-app/vercel.json` | explicit build config if calculator is deployed independently | install/build/output settings |

## Calculator App: Modified Files

| File | Change |
| --- | --- |
| [calculator-app/src/app/layout.tsx](/Users/administrator/Documents/PolicyEngine/app-v2-posthog-pathways/calculator-app/src/app/layout.tsx) | wrap root body with `PostHogProvider` |
| [calculator-app/src/app/error.tsx](/Users/administrator/Documents/PolicyEngine/app-v2-posthog-pathways/calculator-app/src/app/error.tsx) | call calculator exception helper in `useEffect` |
| [calculator-app/src/app/[countryId]/error.tsx](/Users/administrator/Documents/PolicyEngine/app-v2-posthog-pathways/calculator-app/src/app/[countryId]/error.tsx) | call calculator exception helper in `useEffect` |
| [calculator-app/package.json](/Users/administrator/Documents/PolicyEngine/app-v2-posthog-pathways/calculator-app/package.json) | add PostHog dependencies and optional build script |
| [calculator-app/next.config.ts](/Users/administrator/Documents/PolicyEngine/app-v2-posthog-pathways/calculator-app/next.config.ts) | expose PostHog env vars into shared code if needed |

## Shared Calculator Code: New Files

| File | Responsibility | Exact Exports / Functions |
| --- | --- | --- |
| `app/src/utils/analyticsSchemas.ts` | typed calculator event contracts | `CalculatorEventName`, `CalculatorEventPayloadMap`, payload interfaces |
| `app/src/utils/errorTracking.ts` | shared exception capture utilities | `captureCalculatorException(error, context?)`, `captureCalculationException(error, context)`, `captureRouteException(error, context)` |
| `app/src/utils/analyticsSnapshots.ts` | serialization helpers for modeled inputs | `buildHouseholdSnapshot`, `buildSimulationSnapshot`, `buildReportConfigSnapshot` |
| `app/src/utils/posthogClient.ts` | browser-safe singleton access | `getPostHogClient()`, `isPostHogAvailable()` |

## Shared Calculator Code: Modified Files

| File | Change |
| --- | --- |
| [app/src/utils/analytics.ts](/Users/administrator/Documents/PolicyEngine/app-v2-posthog-pathways/app/src/utils/analytics.ts) | replace GA-only `gtag` wrapper with typed PostHog-backed wrapper; keep existing helper exports; add new calculator helpers |
| [app/src/components/common/ErrorBoundary.tsx](/Users/administrator/Documents/PolicyEngine/app-v2-posthog-pathways/app/src/components/common/ErrorBoundary.tsx) | call `captureCalculatorException` in `componentDidCatch` |
| [app/src/pages/reportBuilder/hooks/useReportSubmission.ts](/Users/administrator/Documents/PolicyEngine/app-v2-posthog-pathways/app/src/pages/reportBuilder/hooks/useReportSubmission.ts) | emit report-builder and snapshot events |
| [app/src/hooks/useCreateReport.ts](/Users/administrator/Documents/PolicyEngine/app-v2-posthog-pathways/app/src/hooks/useCreateReport.ts) | emit report-created / calculation-start events and capture exceptions |
| [app/src/libs/calculations/CalcOrchestrator.ts](/Users/administrator/Documents/PolicyEngine/app-v2-posthog-pathways/app/src/libs/calculations/CalcOrchestrator.ts) | emit `calculation_started`, `calculation_completed`, `calculation_failed` |
| [app/src/libs/calculations/household/HouseholdReportOrchestrator.ts](/Users/administrator/Documents/PolicyEngine/app-v2-posthog-pathways/app/src/libs/calculations/household/HouseholdReportOrchestrator.ts) | emit household-specific calc failures and capture exceptions |
| [app/src/components/household/HouseholdBuilderForm.tsx](/Users/administrator/Documents/PolicyEngine/app-v2-posthog-pathways/app/src/components/household/HouseholdBuilderForm.tsx) | emit builder-opened and variable add/remove events |
| [app/src/pathways/report/views/policy/PolicySubmitView.tsx](/Users/administrator/Documents/PolicyEngine/app-v2-posthog-pathways/app/src/pathways/report/views/policy/PolicySubmitView.tsx) | preserve `trackPolicyCreated` and include richer context |
| [app/src/pages/report-output/SocietyWideReportOutput.tsx](/Users/administrator/Documents/PolicyEngine/app-v2-posthog-pathways/app/src/pages/report-output/SocietyWideReportOutput.tsx) | emit output viewed / subpage viewed |
| [app/src/pages/report-output/HouseholdReportOutput.tsx](/Users/administrator/Documents/PolicyEngine/app-v2-posthog-pathways/app/src/pages/report-output/HouseholdReportOutput.tsx) | emit output viewed / subpage viewed |
| [app/src/components/ChartContainer.tsx](/Users/administrator/Documents/PolicyEngine/app-v2-posthog-pathways/app/src/components/ChartContainer.tsx) | preserve CSV event with richer context |
| [app/src/components/report/DashboardCard.tsx](/Users/administrator/Documents/PolicyEngine/app-v2-posthog-pathways/app/src/components/report/DashboardCard.tsx) | preserve CSV event with richer context |
| [app/src/pages/report-output/reproduce-in-python/PolicyReproducibility.tsx](/Users/administrator/Documents/PolicyEngine/app-v2-posthog-pathways/app/src/pages/report-output/reproduce-in-python/PolicyReproducibility.tsx) | preserve Python copy event with richer context |
| [app/src/pages/report-output/reproduce-in-python/HouseholdReproducibility.tsx](/Users/administrator/Documents/PolicyEngine/app-v2-posthog-pathways/app/src/pages/report-output/reproduce-in-python/HouseholdReproducibility.tsx) | preserve Python copy event with richer context |

## Exact Function Surface

## `app/src/utils/analytics.ts`

Implement these exact exports.

### Core exports

- `captureCalculatorEvent<T extends CalculatorEventName>(event: T, properties: CalculatorEventPayloadMap[T]): void`
- `registerCalculatorSuperProperties(properties: Record<string, unknown>): void`
- `clearCalculatorSuperProperties(): void`

### Existing exports to preserve

- `trackSimulationCompleted`
- `trackToolEngaged`
- `trackContactClicked`
- `trackNewsletterSignup`
- `trackReportStarted`
- `trackPolicyCreated`
- `trackChartCsvDownloaded`
- `trackPythonCodeCopied`
- `trackLandingPageViewed`

### New exports to add

- `trackBuilderOpened`
- `trackBuilderSelectionChanged`
- `trackHouseholdVariableAdded`
- `trackHouseholdVariableRemoved`
- `trackHouseholdSaved`
- `trackReportCreated`
- `trackCalculationStarted`
- `trackCalculationFailed`
- `trackReportOutputViewed`
- `trackReportOutputSubpageViewed`
- `trackReportShared`
- `trackConfigurationSnapshot`

## `app/src/utils/errorTracking.ts`

Implement these exact exports.

- `captureCalculatorException(error: unknown, context?: Record<string, unknown>): void`
- `captureCalculationException(error: unknown, context: Record<string, unknown>): void`
- `captureRouteException(error: unknown, context: Record<string, unknown>): void`
- `captureApiException(error: unknown, context: Record<string, unknown>): void`

## `website/src/lib/posthog-events.ts`

Implement these exact exports.

- `captureWebsiteEvent(name: WebsiteEventName, properties: WebsiteEventProperties): void`
- `captureWebsiteException(error: unknown, context?: Record<string, unknown>): void`
- `trackEnterCalculatorClicked`
- `trackNewsletterSignupStarted`
- `trackNewsletterSignupSucceeded`
- `trackNewsletterSignupFailed`
- `trackResearchArticleViewed`
- `trackResearchFiltersChanged`
- `trackCountrySwitched`

## Event Model

## Base calculator event properties

Every calculator event should automatically include:

```ts
interface BaseCalculatorEventProperties {
  surface: "calculator";
  release: string;
  country_id?: string;
  year?: string;
  report_id?: string;
  simulation_id?: string;
  simulation_ids?: string[];
  calc_type?: "household" | "society_wide";
  builder_kind?: "household" | "society_wide" | "policy" | "report";
  output_subpage?: string;
  output_view?: string;
}
```

## Base website event properties

Every website event should automatically include:

```ts
interface BaseWebsiteEventProperties {
  surface: "website";
  release: string;
  country_id?: string;
  pathname?: string;
  referrer?: string;
}
```

## Calculator event names and payload shapes

### `builder_opened`

Use for both household and society-wide entry flows.

```ts
interface BuilderOpenedProperties extends BaseCalculatorEventProperties {
  builder_kind: "household" | "society_wide";
  entrypoint: string;
}
```

### `builder_selection_changed`

Use for high-value report-builder choices. Do not emit on every keystroke.

```ts
interface BuilderSelectionChangedProperties extends BaseCalculatorEventProperties {
  builder_kind: "household" | "society_wide";
  selection_key:
    | "year"
    | "dataset"
    | "baseline_policy_id"
    | "reform_policy_id"
    | "population_type"
    | "geography_id"
    | "geography_type";
  selection_value: string | number | boolean | null;
}
```

### `household_variable_added`

```ts
interface HouseholdVariableAddedProperties extends BaseCalculatorEventProperties {
  builder_kind: "household";
  variable_name: string;
  entity_name?: string;
  entity_kind: "person" | "household" | "tax_unit" | "spm_unit";
}
```

### `household_variable_removed`

```ts
interface HouseholdVariableRemovedProperties extends BaseCalculatorEventProperties {
  builder_kind: "household";
  variable_name: string;
  entity_name?: string;
  entity_kind: "person" | "household" | "tax_unit" | "spm_unit";
}
```

### `household_saved`

```ts
interface HouseholdSavedProperties extends BaseCalculatorEventProperties {
  builder_kind: "household";
  household_id?: string;
  person_count: number;
  child_count: number;
  marital_status: "single" | "married";
  variable_names: string[];
}
```

### `report_started`

Preserve existing event name and enrich it.

```ts
interface ReportStartedProperties extends BaseCalculatorEventProperties {
  builder_kind: "household" | "society_wide";
  country_id: string;
  year: string;
  simulation_count: number;
  baseline_policy_id: string;
  reform_policy_id?: string;
  population_type: "household" | "geography";
  geography_id?: string;
  dataset?: string;
}
```

### `report_created`

```ts
interface ReportCreatedProperties extends ReportStartedProperties {
  report_id: string;
  simulation_ids: string[];
}
```

### `calculation_started`

```ts
interface CalculationStartedProperties extends BaseCalculatorEventProperties {
  calc_type: "household" | "society_wide";
  report_id?: string;
  simulation_id?: string;
  country_id: string;
  year: string;
}
```

### `simulation_completed`

Preserve existing event name and enrich it.

```ts
interface SimulationCompletedProperties extends BaseCalculatorEventProperties {
  calc_type: "household" | "society_wide";
  country_id: string;
  report_id?: string;
  simulation_id?: string;
  duration_ms?: number;
}
```

### `calculation_failed`

```ts
interface CalculationFailedProperties extends BaseCalculatorEventProperties {
  calc_type: "household" | "society_wide";
  country_id: string;
  report_id?: string;
  simulation_id?: string;
  error_name?: string;
  error_message?: string;
  stage:
    | "create_report"
    | "create_simulation"
    | "fetch_household"
    | "fetch_society_wide"
    | "persist_simulation"
    | "persist_report"
    | "resume_on_load";
}
```

### `report_output_viewed`

```ts
interface ReportOutputViewedProperties extends BaseCalculatorEventProperties {
  report_id: string;
  calc_type: "household" | "society_wide";
  output_subpage: string;
  output_view?: string;
}
```

### `report_output_subpage_viewed`

```ts
interface ReportOutputSubpageViewedProperties extends BaseCalculatorEventProperties {
  report_id: string;
  calc_type: "household" | "society_wide";
  output_subpage: string;
  output_view?: string;
}
```

### `configuration_snapshot`

Use only at milestone points.

```ts
interface ConfigurationSnapshotProperties extends BaseCalculatorEventProperties {
  snapshot_kind: "report_config" | "simulation" | "household";
  report_config?: Record<string, unknown>;
  simulation_config?: Record<string, unknown>;
  household_config?: Record<string, unknown>;
}
```

## Website event names and payload shapes

### `enter_calculator_clicked`

```ts
interface EnterCalculatorClickedProperties extends BaseWebsiteEventProperties {
  country_id: string;
  destination: string;
  cta_location: "hero";
}
```

### `newsletter_signup_started`

```ts
interface NewsletterSignupStartedProperties extends BaseWebsiteEventProperties {
  placement: "footer";
}
```

### `newsletter_signup_succeeded`

```ts
interface NewsletterSignupSucceededProperties extends BaseWebsiteEventProperties {
  placement: "footer";
}
```

### `newsletter_signup_failed`

```ts
interface NewsletterSignupFailedProperties extends BaseWebsiteEventProperties {
  placement: "footer";
  error_message?: string;
}
```

### `research_article_viewed`

```ts
interface ResearchArticleViewedProperties extends BaseWebsiteEventProperties {
  country_id: string;
  slug: string;
  title: string;
  tags: string[];
}
```

### `research_filters_changed`

```ts
interface ResearchFiltersChangedProperties extends BaseWebsiteEventProperties {
  country_id: string;
  search_query?: string;
  topic_filters: string[];
  location_filters: string[];
  sort?: string;
}
```

### `country_switched`

```ts
interface CountrySwitchedProperties extends BaseWebsiteEventProperties {
  from_country_id: string;
  to_country_id: string;
  pathname: string;
}
```

## Exact Instrumentation Points

## Website

| Event | File | Trigger |
| --- | --- | --- |
| `enter_calculator_clicked` | [website/src/components/home/HeroCTA.tsx](/Users/administrator/Documents/PolicyEngine/app-v2-posthog-pathways/website/src/components/home/HeroCTA.tsx) | CTA click |
| `newsletter_signup_started` / `succeeded` / `failed` | [website/src/components/Footer.tsx](/Users/administrator/Documents/PolicyEngine/app-v2-posthog-pathways/website/src/components/Footer.tsx) | Mailchimp submission lifecycle |
| `country_switched` | [website/src/components/Header.tsx](/Users/administrator/Documents/PolicyEngine/app-v2-posthog-pathways/website/src/components/Header.tsx) | country selector change |
| `research_filters_changed` | [website/src/app/[countryId]/research/ResearchClient.tsx](/Users/administrator/Documents/PolicyEngine/app-v2-posthog-pathways/website/src/app/[countryId]/research/ResearchClient.tsx) | debounced search/filter changes |
| `research_article_viewed` | [website/src/app/[countryId]/research/[slug]/ArticleClient.tsx](/Users/administrator/Documents/PolicyEngine/app-v2-posthog-pathways/website/src/app/[countryId]/research/[slug]/ArticleClient.tsx) | article client mount |

## Calculator

| Event | File | Trigger |
| --- | --- | --- |
| `builder_opened` | [calculator-app/src/app/[countryId]/households/create/page.tsx](/Users/administrator/Documents/PolicyEngine/app-v2-posthog-pathways/calculator-app/src/app/[countryId]/households/create/page.tsx) and [calculator-app/src/app/[countryId]/reports/create/page.tsx](/Users/administrator/Documents/PolicyEngine/app-v2-posthog-pathways/calculator-app/src/app/[countryId]/reports/create/page.tsx) or underlying shared page mount | first render of household / society-wide builder surfaces |
| `household_variable_added` / `removed` | [app/src/components/household/HouseholdBuilderForm.tsx](/Users/administrator/Documents/PolicyEngine/app-v2-posthog-pathways/app/src/components/household/HouseholdBuilderForm.tsx) | variable add/remove handlers |
| `household_saved` | shared create-household success path | household creation success |
| `builder_selection_changed` | [app/src/pages/reportBuilder/hooks/useReportSubmission.ts](/Users/administrator/Documents/PolicyEngine/app-v2-posthog-pathways/app/src/pages/reportBuilder/hooks/useReportSubmission.ts) and related builder state change handlers | year/dataset/geography/policy changes |
| `report_started` | [app/src/pages/reportBuilder/hooks/useReportSubmission.ts](/Users/administrator/Documents/PolicyEngine/app-v2-posthog-pathways/app/src/pages/reportBuilder/hooks/useReportSubmission.ts) | submit click |
| `report_created` | [app/src/hooks/useCreateReport.ts](/Users/administrator/Documents/PolicyEngine/app-v2-posthog-pathways/app/src/hooks/useCreateReport.ts) | report creation success |
| `calculation_started` | [app/src/libs/calculations/CalcOrchestrator.ts](/Users/administrator/Documents/PolicyEngine/app-v2-posthog-pathways/app/src/libs/calculations/CalcOrchestrator.ts) | initial calc start |
| `simulation_completed` | [app/src/libs/calculations/CalcOrchestrator.ts](/Users/administrator/Documents/PolicyEngine/app-v2-posthog-pathways/app/src/libs/calculations/CalcOrchestrator.ts) | existing completion logic |
| `calculation_failed` | [app/src/libs/calculations/CalcOrchestrator.ts](/Users/administrator/Documents/PolicyEngine/app-v2-posthog-pathways/app/src/libs/calculations/CalcOrchestrator.ts), [app/src/libs/calculations/household/HouseholdReportOrchestrator.ts](/Users/administrator/Documents/PolicyEngine/app-v2-posthog-pathways/app/src/libs/calculations/household/HouseholdReportOrchestrator.ts), [app/src/hooks/useCreateReport.ts](/Users/administrator/Documents/PolicyEngine/app-v2-posthog-pathways/app/src/hooks/useCreateReport.ts) | any major failure point |
| `report_output_viewed` | [app/src/pages/report-output/SocietyWideReportOutput.tsx](/Users/administrator/Documents/PolicyEngine/app-v2-posthog-pathways/app/src/pages/report-output/SocietyWideReportOutput.tsx), [app/src/pages/report-output/HouseholdReportOutput.tsx](/Users/administrator/Documents/PolicyEngine/app-v2-posthog-pathways/app/src/pages/report-output/HouseholdReportOutput.tsx) | completed output first shown |
| `report_output_subpage_viewed` | same output files | subpage/view change |
| `chart_csv_downloaded` | [app/src/components/ChartContainer.tsx](/Users/administrator/Documents/PolicyEngine/app-v2-posthog-pathways/app/src/components/ChartContainer.tsx), [app/src/components/report/DashboardCard.tsx](/Users/administrator/Documents/PolicyEngine/app-v2-posthog-pathways/app/src/components/report/DashboardCard.tsx) | download click |
| `python_code_copied` | [app/src/pages/report-output/reproduce-in-python/PolicyReproducibility.tsx](/Users/administrator/Documents/PolicyEngine/app-v2-posthog-pathways/app/src/pages/report-output/reproduce-in-python/PolicyReproducibility.tsx), [app/src/pages/report-output/reproduce-in-python/HouseholdReproducibility.tsx](/Users/administrator/Documents/PolicyEngine/app-v2-posthog-pathways/app/src/pages/report-output/reproduce-in-python/HouseholdReproducibility.tsx) | copy click |

## Error Tracking Plan

## Client-side

### Website

- add `website/src/app/error.tsx`
- add `website/src/app/global-error.tsx`
- use `captureWebsiteException(error, { route: pathname, surface: "website" })`

### Calculator app

- modify [calculator-app/src/app/error.tsx](/Users/administrator/Documents/PolicyEngine/app-v2-posthog-pathways/calculator-app/src/app/error.tsx)
- modify [calculator-app/src/app/[countryId]/error.tsx](/Users/administrator/Documents/PolicyEngine/app-v2-posthog-pathways/calculator-app/src/app/[countryId]/error.tsx)
- add `calculator-app/src/app/global-error.tsx`
- upgrade [app/src/components/common/ErrorBoundary.tsx](/Users/administrator/Documents/PolicyEngine/app-v2-posthog-pathways/app/src/components/common/ErrorBoundary.tsx) to call `captureCalculatorException`

## Server-side

### Website

- add `website/instrumentation.ts`
- add `website/src/lib/posthog-server.ts`
- parse PostHog cookie when available and pass `distinctId` to `captureException`

### Calculator app

- add `calculator-app/instrumentation.ts`
- add `calculator-app/src/lib/posthog-server.ts`
- same cookie parsing approach

## Catch-and-report upgrades

Replace `console.error(...)`-only handling with capture-plus-log in:

- [app/src/hooks/useCreateReport.ts](/Users/administrator/Documents/PolicyEngine/app-v2-posthog-pathways/app/src/hooks/useCreateReport.ts)
- [app/src/pages/reportBuilder/hooks/useReportSubmission.ts](/Users/administrator/Documents/PolicyEngine/app-v2-posthog-pathways/app/src/pages/reportBuilder/hooks/useReportSubmission.ts)
- [app/src/libs/calculations/CalcOrchestrator.ts](/Users/administrator/Documents/PolicyEngine/app-v2-posthog-pathways/app/src/libs/calculations/CalcOrchestrator.ts)
- [app/src/libs/calculations/household/HouseholdReportOrchestrator.ts](/Users/administrator/Documents/PolicyEngine/app-v2-posthog-pathways/app/src/libs/calculations/household/HouseholdReportOrchestrator.ts)
- any API wrapper where failures are currently logged and rethrown without telemetry

Standard exception context keys:

- `surface`
- `release`
- `country_id`
- `report_id`
- `simulation_id`
- `calc_type`
- `stage`
- `pathname`

## Replay Plan

### Website

- enable replay globally
- no route exclusions initially

### Calculator app

- enable replay globally for product routes
- no exclusions for household or society-wide setup/output
- if future auth/payment/account pages are added, exclude those routes then

## Release and Source Map Plan

### Website deployment

Modify [website/scripts/vercel-build.sh](/Users/administrator/Documents/PolicyEngine/app-v2-posthog-pathways/website/scripts/vercel-build.sh):

1. build website
2. if `POSTHOG_PERSONAL_API_KEY` and `POSTHOG_PROJECT_ID` exist:
   - run `node scripts/posthog-release.mjs`

`website/scripts/posthog-release.mjs` responsibilities:

- derive release from `VERCEL_GIT_COMMIT_SHA || APP_RELEASE`
- register release metadata in PostHog
- upload Next.js browser source maps
- attach deploy URL / environment metadata if available

### Calculator deployment

Add:

- `calculator-app/scripts/vercel-build.sh`
- `calculator-app/scripts/posthog-release.mjs`
- `calculator-app/vercel.json`

Build flow:

1. `cd .. && bun install --frozen-lockfile`
2. build design system if needed
3. `cd calculator-app && bun run build`
4. upload release/source maps if PostHog env is available

## Reverse Proxy Plan

Preferred first implementation:

- use PostHog managed reverse proxy
- set `NEXT_PUBLIC_POSTHOG_HOST` to that managed proxy host
- do not change app rewrites initially

Fallback implementation if managed proxy is not used:

- add `/_posthog/*` rewrites in [website/next.config.ts](/Users/administrator/Documents/PolicyEngine/app-v2-posthog-pathways/website/next.config.ts) and [calculator-app/next.config.ts](/Users/administrator/Documents/PolicyEngine/app-v2-posthog-pathways/calculator-app/next.config.ts)
- route analytics and static assets through that path

## Rollout Order

### Step 1

Bootstrap and shared helpers.

- add client bootstrap files
- add providers
- add shared analytics/error utility files
- replace GA-only `analytics.ts`

### Step 2

Error tracking.

- add app-router error files
- add server-side instrumentation files
- add shared exception capture helpers

### Step 3

Core calculator milestone events.

- household builder
- report builder
- report creation
- calculation lifecycle
- output viewed

### Step 4

Website events.

- calculator CTA
- newsletter
- research filters
- article views
- country switching

### Step 5

Replay, releases, and source maps.

## Done Criteria

The implementation is complete when:

- both apps initialize PostHog correctly
- website and calculator pageviews appear in one PostHog project
- household and society-wide report flows are queryable end-to-end
- route errors and shared React boundary errors appear in PostHog
- server-side Next request errors appear in PostHog
- production stack traces are source-mapped
- replay links from exceptions work in production
