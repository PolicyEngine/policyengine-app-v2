# Performance profiling findings

Profiled the full user journey from app init to completed report output using the `JourneyProfiler` utility (browser Performance API marks). Total wall-clock time: **~259s (4.3 minutes)**.

## Journey breakdown

| Phase                      | Wall-clock     | Description                                                                   |
| -------------------------- | -------------- | ----------------------------------------------------------------------------- |
| App init → metadata loaded | +0s to +23s    | App boots, 3 metadata fetches (one takes 20s)                                 |
| Dashboard idle / browsing  | +23s to +171s  | User on site before starting pathway                                          |
| Dashboard entity loading   | +171s to +177s | 15 individual API calls to hydrate reports, simulations, policies, households |
| Report creation pathway    | +177s to +252s | 12 pathway steps, 2 simulation creations, 1 policy creation                   |
| Report submission → output | +252s to +259s | POST report, economy calculation (5.5s), render                               |

---

## API-level findings

### Finding 1: Triple metadata fetch

Three parallel requests to the same endpoint fire within 220ms of each other on app init:

| Request            | Start  | Duration     |
| ------------------ | ------ | ------------ |
| `GET /us/metadata` | +3.09s | 2,344ms      |
| `GET /us/metadata` | +3.25s | **19,755ms** |
| `GET /us/metadata` | +3.31s | 5,372ms      |

With `staleTime: Infinity` configured on the QueryClient, these should deduplicate into a single request. The fact that they don't means either:

- Multiple components trigger `useFetchMetadata` before the first request settles (race on initial mount)
- The query keys differ slightly between callers
- The fetches are triggered outside of React Query (direct `fetch()` calls that bypass deduplication)

One of the three takes **20 seconds**, which blocks the entire app via `MetadataGuard`.

**Root cause:** Race condition between `CountryGuard` dispatching `setCurrentCountry` and `useFetchMetadata` checking Redux state. `CountryGuard` runs as a parent component, so its effect fires after child effects (`MetadataLazyLoader`), causing `metadata.currentCountry` to change and re-triggering the fetch. In dev mode, StrictMode adds a third fetch. The metadata thunk (`createAsyncThunk`) has no `condition` callback to deduplicate in-flight requests.

**Estimated savings:** 0-2s wall-clock (the guard unblocks on the first response at ~2.3s; the 20s response doesn't block further). The main win is reducing server load and connection contention.
**Effort:** Low. Add a `condition` callback to `createAsyncThunk` that checks `getState().metadata.loading`.

### Finding 2: N+1 entity loading on dashboard

When the user reaches the reports dashboard, the app loads user associations from localStorage, then fetches each referenced entity individually:

```
4 report fetches      (636, 791, 792, 830)          375-780ms each
6 simulation fetches  (71, 698, 905, 857, 858, 859) 374-824ms each
4 policy fetches      (2, 71041, 95989, 95949)       366-1,094ms each
1 household fetch     (57089)                         544ms
---
15 individual HTTP requests, serialized into waves by browser connection limit (6/domain)
```

Total API time for dashboard hydration: ~6s of cumulative request time, spread across ~6s of wall-clock due to parallelism limits.

**Estimated savings:** 3-5s on dashboard load with batch endpoints or embedded associations.
**Effort:** High. May require API-side batch endpoints (`GET /us/reports?ids=636,791,792,830`) or a single dashboard endpoint that returns all user entities.

### Finding 3: Full cache invalidation cascade after mutations

After creating a simulation (`POST /us/simulation`), `queryClient.invalidateQueries({ queryKey: simulationKeys.all })` nukes the entire simulation cache namespace. This triggers a re-fetch of **every cached simulation**, not just the new one.

**After first simulation creation (+212s):**

```
GET /us/simulation/71    573ms
GET /us/simulation/698   572ms
GET /us/simulation/905   955ms
GET /us/simulation/857   566ms
GET /us/simulation/858   562ms
GET /us/simulation/859   560ms
```

**After second simulation creation (+248s), the same 6 + the new one are all re-fetched again.**

The same pattern occurs for policies after `POST /us/policy`:

```
GET /us/policy/2       537ms
GET /us/policy/71041   533ms
GET /us/policy/95989   536ms
GET /us/policy/95949   532ms
```

This adds ~5-8s of redundant API calls per mutation.

**Fix:** Replace broad `invalidateQueries({ queryKey: simulationKeys.all })` with targeted cache updates:

```ts
// Instead of invalidating all simulations:
queryClient.invalidateQueries({ queryKey: simulationKeys.all });

// Add the new entity directly to cache:
queryClient.setQueryData(simulationKeys.byId(newSimId), newSimulation);
// Only invalidate the list query (associations), not individual entities:
queryClient.invalidateQueries({ queryKey: simulationAssociationKeys.all });
```

**Estimated savings:** ~1-2s wall-clock per mutation (connection contention relief), ~17 fewer API calls, ~17 fewer component re-renders across two mutations.
**Effort:** Medium. Change `onSuccess` handlers in `useCreateSimulation.ts`, `useCreatePolicy.ts`, `useCreateHousehold.ts`, `useCreateReport.ts`.

### Finding 4: 20-second metadata response (backend)

One of the three metadata calls takes 19,755ms while the others complete in 2-5s. Possible causes:

- API cold start (first request warms the server, subsequent ones are fast)
- Server-side contention from 3 simultaneous requests to the same endpoint
- Backend query or serialization bottleneck

**Action:** Being addressed separately on the API side.

### Finding 5: `refetchOnWindowFocus: true` on API queries

**File:** `libs/queryConfig.ts`

```ts
api: {
  staleTime: 5 * 60 * 1000,
  refetchOnWindowFocus: true,  // ← fires on every tab switch
  retry: 3,
}
```

Switching browser tabs and returning triggers a refetch of every active query. With 15+ queries active on the dashboard, this fires 15 simultaneous API calls every time the user alt-tabs back.

**Estimated savings:** Eliminates 15 redundant API calls per tab switch.
**Effort:** Trivial. Set `refetchOnWindowFocus: false`.

### Finding 6: `gcTime: 0` forces full refetch on back-navigation

**File:** `useUserReports.ts:146,403`

```ts
staleTime: Infinity,  // Never auto-refetch ✓
gcTime: 0,            // Delete from cache IMMEDIATELY on unmount ✗
```

Simulations are garbage-collected from the React Query cache the instant the component unmounts. Navigating away from Reports and back refetches all 6 simulations from scratch. The `staleTime: Infinity` is pointless because data is destroyed before it can be reused.

**Estimated savings:** ~1-2s per back-navigation to Reports or dashboard.
**Effort:** Trivial. Change `gcTime: 0` to `gcTime: 5 * 60 * 1000`.

---

## Bundle and loading findings

### Finding 7: No code splitting — entire app loads on first page visit

**Files:** `CalculatorRouter.tsx`, `WebsiteRouter.tsx`

Every page is eagerly imported at the top of the router files:

```ts
import DashboardPage from './pages/Dashboard.page';
import ReportOutputPage from './pages/ReportOutput.page';
import SimulationsPage from './pages/Simulations.page';

// ... ~15 page components, all eagerly loaded
```

The app already has the correct pattern in one place — `LazyPlot` uses `React.lazy()` for Plotly. But none of the page components use it. This means JS for report output charts, household builders, blog markdown rendering (with rehype/remark plugins), research filtering (with Fuse.js), etc. all load upfront even if the user never visits those pages.

**Estimated savings:** 40-60% smaller initial JS bundle, directly reducing time-to-interactive.
**Effort:** Low. Wrap each page import in `React.lazy()`, add `<Suspense>` fallbacks at the route level.

### Finding 8: Blog post processing runs at module import time

**File:** `data/posts/postTransformers.ts:17-38`

```ts
// Runs at IMPORT TIME, not when blog pages are visited
const postsSorted = [...postsRaw].sort((a, b) => (a.date < b.date ? 1 : -1));
for (const post of postsSorted) {
  post.slug = filenameWithoutExt.toLowerCase().replace(/_/g, '-');
}
const uniqueTags = [...new Set(tags.flat())].sort();
```

Processes all blog posts (77KB JSON, 1700+ lines) synchronously at module initialization. Without code splitting (Finding 7), this runs on app startup even if the user never visits the blog.

**Estimated savings:** ~10-20ms off startup (more if combined with code splitting to defer entirely).
**Effort:** Low. Wrap in a lazy initializer or move behind code splitting.

---

## Re-render and state management findings

### Finding 9: Broad `useSelector` on entire metadata object in recursive components

**Files:** `HouseholdSummaryCard.tsx:25`, `HouseholdBreakdown.tsx:22`, `VariableArithmetic.tsx:43`

```tsx
const metadata = useSelector((state: RootState) => state.metadata);
```

`VariableArithmetic` is a **recursive** component that renders a tree of tax variables. Each instance selects the entire metadata object (~500 variables, ~200 parameters, entity definitions, economy options). Any Redux state change triggers a re-render cascade through 50+ recursive instances.

Memoized selectors already exist in `libs/metadataUtils.ts` (using `createSelector`) but aren't used in these components.

**Estimated savings:** Eliminates 50+ unnecessary re-renders on any metadata state change during household views.
**Effort:** Low. Change to `useSelector((state: RootState) => state.metadata.variables)` or use existing `createSelector` selectors.

### Finding 10: ReportYearContext creates new object reference every render

**File:** `contexts/ReportYearContext.tsx:15`

```tsx
return <ReportYearContext.Provider value={{ year }}>{children}</ReportYearContext.Provider>;
```

Every render creates a new `{ year }` object reference, causing all `useReportYearContext()` consumers to re-render even when `year` hasn't changed. This wraps the entire report output page tree.

**Fix:** `const value = useMemo(() => ({ year }), [year]);`
**Estimated savings:** Eliminates unnecessary re-renders of all report output subpage components on parent re-renders.
**Effort:** Trivial. One line change.

### Finding 11: Report output chart components not memoized, data arrays recreated every render

**Files:** `BudgetaryImpactByProgramSubPage.tsx`, `PovertyImpactByAgeSubPage.tsx`, `NetIncomeSubPage.tsx`, and other report output subpages.

Two compounding issues:

1. **No `React.memo`** on expensive chart subpage components. Parent re-renders (from tab navigation, context changes, or Finding 10) cause full chart re-renders even when props are identical.

2. **Chart data arrays recreated on every render** without `useMemo`:

```tsx
// BudgetaryImpactByProgramSubPage.tsx:108-119
const items: WaterfallItem[] = [
  ...programs.map((p) => ({ name: p.label, value: p.value })),
  { name: 'Total', value: budgetaryImpact / 1e9, isTotal: true },
];
const data = computeWaterfallData(items, ...);
const dataWithHover = data.map((d) => ({ ...d, hoverText: hoverMessage(...) }));
```

New arrays → chart components see new prop references → full Recharts re-render.

**Estimated savings:** Eliminates the most expensive re-render work in report output views.
**Effort:** Medium. Add `React.memo` wrappers + wrap data transformations in `useMemo`.

### Finding 12: localStorage parsed and transformed on every hook call

**Files:** All 5 association stores (`reportAssociation.ts`, `simulationAssociation.ts`, `policyAssociation.ts`, `householdAssociation.ts`, `geographicAssociation.ts`)

```ts
private getStoredHouseholds(): UserHouseholdPopulation[] {
  const stored = localStorage.getItem(this.STORAGE_KEY);  // sync I/O
  const parsed = JSON.parse(stored);                        // full parse
  return parsed.map((data: any) => ({                       // transform
    ...data, id: String(data.id), userId: String(data.userId), ...
  }));
}
```

Called on every `findByUser()` query invocation. Navigate to 3 pages → 3x full `JSON.parse` + array transform of the same unchanged data. No in-memory cache between calls.

**Estimated savings:** Eliminates repeated synchronous `JSON.parse` + array transform during render.
**Effort:** Low-medium. Add a simple in-memory cache with dirty flag on writes.

---

## Additional findings (lower priority)

### Finding 13: @normy/react-query normalization overhead

**File:** `CalculatorApp.tsx:37-42`

The `QueryNormalizerProvider` wraps the entire app and runs normalization logic on every query response. With 15 dashboard entity loads, each pays a normalization tax (~2-5ms per response). The normalized cache is used via `queryNormalizer.getObjectById()` in `useUserReports.ts`, but it's unclear whether the benefits justify the per-query overhead. Worth benchmarking.

### Finding 14: CacheMonitor enabled in production

**File:** `utils/cacheMonitor.ts`

`CacheMonitor` defaults to `enabled: true` and subscribes to every QueryCache event. Unlike `JourneyProfiler` which correctly checks `import.meta.env.DEV`, `CacheMonitor` runs in production, adding ~0.5-1ms overhead per query state change.

### Finding 15: IngredientReadView renders all rows without virtualization

**File:** `components/IngredientReadView.tsx:146-189`

All table rows render in a single pass with no virtualization. Currently manageable if most users have <50 items, but will degrade with scale. For lists with 100+ items, this creates thousands of DOM nodes.

### Finding 16: Congressional district context value triggers broad consumer re-renders

**File:** `contexts/congressional-district/CongressionalDistrictDataContext.tsx:217-255`

Context value includes 16 properties in a single object. Consumers that only need `isLoading` still re-render when `stateResponses` (a large Map) changes as each of 50 states loads.

---

## Summary: all recommended fixes by impact

| #   | Fix                                         | Est. savings                            | Effort     | Where                                       |
| --- | ------------------------------------------- | --------------------------------------- | ---------- | ------------------------------------------- |
| 7   | Code splitting with React.lazy              | 40-60% smaller initial bundle           | Low        | `CalculatorRouter.tsx`, `WebsiteRouter.tsx` |
| 1   | Deduplicate metadata to 1 fetch             | 0-2s startup + reduced server load      | Low        | `metadataReducer.ts` condition callback     |
| 3   | Targeted cache invalidation after mutations | ~1-2s per mutation, 17 fewer API calls  | Medium     | `onSuccess` in mutation hooks               |
| 2   | Batch entity loading for dashboard          | 3-5s dashboard load                     | High       | API batch endpoints + query refactor        |
| 6   | Fix gcTime: 0 → 5 min                       | ~1-2s per back-navigation               | Trivial    | `useUserReports.ts`                         |
| 5   | Disable refetchOnWindowFocus                | 15 fewer API calls per tab switch       | Trivial    | `libs/queryConfig.ts`                       |
| 9   | Narrow metadata selectors                   | 50+ fewer re-renders in household views | Low        | Household components                        |
| 10  | Memoize ReportYearContext value             | Fewer report output re-renders          | Trivial    | `ReportYearContext.tsx`                     |
| 11  | Memo chart components + data arrays         | Fewer expensive chart re-renders        | Medium     | Report output subpages                      |
| 12  | Cache localStorage reads in-memory          | Faster page navigations                 | Low-medium | 5 association store files                   |
| 8   | Lazy-init blog post processing              | ~10-20ms off startup                    | Low        | `postTransformers.ts`                       |
| 4   | Investigate 20s metadata response           | Up to 17s if backend issue              | Varies     | API-side (separate workstream)              |

---

## Profiling method

- Tool: `JourneyProfiler` utility (`app/src/utils/journeyProfiler.ts`)
- Mechanism: Browser `performance.mark()` / `performance.measure()` API + global `fetch` interceptor
- Instrumented points: app init, metadata guard, pathway step transitions, calculation lifecycle, report output render
- All API calls to `api.policyengine.org` auto-instrumented via fetch interceptor
- Marks visible in Chrome DevTools Performance panel > Timings lane
- Console access: `window.__journeyProfiler.printSummary()`
