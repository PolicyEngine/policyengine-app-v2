# Calculator Migration to Next.js — Approach & Plan

## Background

PolicyEngine has two front-end apps:
- **Website** (`www.policyengine.org`) — static pages, blog articles, SEO-focused. **Already migrated to Next.js** (PR #820, #840).
- **Calculator** (`app.policyengine.org`) — interactive policy simulator. Currently a Vite + React Router SPA. **Migration planned** (issue #814).

This document outlines the recommended approach for migrating the calculator.

---

## Current Calculator Architecture

### What it does
The calculator lets users create policy simulations, run calculations against the PolicyEngine API, and view results as charts and tables. Key flows:
- Create/manage **policies** (tax/benefit parameter changes)
- Create/manage **households** (family composition for individual impact)
- Run **simulations** (policy + population → results)
- View **reports** (charts comparing baseline vs reform)

### Tech stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Routing | React Router v7 | SPA with nested routes, guards, wizard flows |
| Global state | Redux (single slice) | Country metadata (parameters, variables) |
| Entity data | React Query + @normy | Reports, simulations, policies, households |
| Wizard flows | Local React state | Multi-step creation (pathway pattern) |
| Calculations | CalcOrchestrator (singleton) | Manages async calculation lifecycle |
| User data | localStorage | User's saved items (no auth yet) |
| Charts | Recharts + react-simple-maps | Economic impact visualization |
| API | Native fetch() | `https://api.policyengine.org` |
| UI | Tailwind + Radix UI | Design system shared with website |

### Size
- ~18,600 lines of calculator-specific code
- 180+ components, 46 pathway files, 41 hooks, 15 API files
- 51 report output subpages (most complex UI area)

### Key patterns to understand

**Guard-based routing:**
```
/:countryId → CountryGuard (validates country)
  ├── MetadataGuard (blocks until metadata loads)
  │   ├── /report-output/:reportId — needs metadata
  │   └── /*/create — wizard flows need metadata
  └── MetadataLazyLoader (loads in background)
      ├── /reports — list page, doesn't need metadata immediately
      ├── /simulations, /policies, /households — same
      └── /reports/create — report builder
```

**Pathway wizards (multi-step creation):**
```
SimulationPathwayWrapper manages:
  LABEL → SETUP → POLICY_SETUP → POLICY_LABEL → ...
  → POPULATION_SETUP → POPULATION_SCOPE → ... → SUBMIT

Each step is a view component receiving props:
  { data, onNext, onBack, onCancel, onChange }

State lives in the wrapper, views are stateless.
Navigation uses a custom stack (not URL-based).
```

**Calculation orchestration:**
```
Household calculation: fetch() blocks for 30-45 seconds → result
Economy calculation: POST → poll every 2s until complete → result

CalcOrchestratorManager (singleton, lives in React context):
  → Creates CalcOrchestrator per calculation
  → Manages lifecycle: start → poll → persist → cleanup
  → Prevents duplicate calculations
```

---

## Migration Options

### Option A: Multi-zones (two Next.js apps) ← RECOMMENDED

Two separate Next.js applications, each owning their URL paths:

```
www.policyengine.org/* → website/ (existing Next.js app)
app.policyengine.org/* → calculator-next/ (new Next.js app)
```

**How multi-zones work:**
- Each zone is a standalone Next.js app with its own build
- Within a zone: soft navigation (SPA-like, no page reload)
- Between zones: hard navigation (full page load)
- Each zone sets `assetPrefix` to avoid JS/CSS conflicts
- One zone can proxy requests to another via `rewrites` in `next.config.ts`

**Why this is recommended:**
1. Calculator is 100% client-side — every page uses hooks, state, effects. Wrapping everything in `"use client"` would defeat the purpose of server components.
2. Independent deployments — website changes don't rebuild calculator and vice versa.
3. Matches the existing architecture — calculator already runs on a separate domain.
4. Team mentioned multi-zones in planning discussions.
5. Incremental — each calculator page can be ported independently.

### Option B: Single Next.js app with route groups

Merge calculator into `website/` using Next.js route groups:

```
website/src/app/
  (website)/          ← static pages, blog
    [countryId]/
      research/
      team/
      ...
  (calculator)/       ← interactive calculator
    [countryId]/
      reports/
      simulations/
      ...
```

**Pros:** Soft navigation between website and calculator, shared providers.
**Cons:** Larger build, tighter coupling, calculator JS shipped to website pages.

### Option C: Keep calculator as Vite SPA

Don't migrate the calculator. Leave it as-is.

**Pros:** No work needed.
**Cons:** Two frameworks to maintain long-term.

---

## Recommended Implementation Plan (Option A: Multi-zones)

### Phase 1: Scaffold calculator Next.js app
- Create `calculator-next/` workspace with Next.js 15
- Set up root `"use client"` layout (everything is interactive)
- Port the provider stack: Redux → React Query → @normy → CalcOrchestrator
- Configure `assetPrefix` for multi-zone
- Set up Vercel project (`policyengine-calculator-next` or reuse existing)

### Phase 2: Port CRUD list pages (easiest)
Pages: `/reports`, `/simulations`, `/policies`, `/households`

These are data tables powered by React Query hooks. Each follows the same pattern:
1. Fetch user data via hook
2. Transform to table format
3. Render with `IngredientReadView` component
4. Handle rename/delete via modals

**What to port:** Page components, React Query hooks, adapters, `IngredientReadView`

### Phase 3: Port pathway wizards (hardest)
Flows: create simulation, create policy, create household, create report

Current pattern uses a local state + custom navigation stack. Next.js options:
- **Option 3a:** Keep as client-side state machine (easiest port, same UX)
- **Option 3b:** URL-based steps (`/simulations/create/label`, `/simulations/create/policy`)
  - Better browser back/forward support
  - State via URL search params or React context
  - More Next.js-idiomatic but significant refactor

**Recommendation:** Start with 3a (same pattern, just port the code). Refactor to 3b later if needed.

### Phase 4: Port report output (most complex UI)
51 subpages with Recharts charts, Plotly charts, choropleth maps.

All `"use client"` — these are pure visualization components. Port the chart components, calculation status hooks, and the report output router.

### Phase 5: Port calculation orchestration
- Move CalcOrchestratorManager to root layout context
- Keep the existing polling pattern (or optionally upgrade to SSE)
- Port ResultPersister
- Test long-running calculations (30-45 second household, multi-minute economy)

### Phase 6: Wire multi-zones
- Website's `next.config.ts` gets rewrite rules for calculator paths
- Calculator's `next.config.ts` sets `assetPrefix: '/calculator-static'`
- Cross-zone links use `<a>` tags (not `<Link>`) since zones are separate apps
- Test navigation between website and calculator

---

## Next.js Cheat Sheet for React/Vite Developers

### Routing: files not config

| Vite + React Router | Next.js App Router |
|---|---|
| `<Route path="/us/reports" element={<ReportsPage />} />` | `app/[countryId]/reports/page.tsx` |
| `<Route path="/us/reports/:id" element={<ReportPage />} />` | `app/[countryId]/reports/[id]/page.tsx` |
| Nested `<Outlet />` | Nested `layout.tsx` with `{children}` |
| `useNavigate()` | `useRouter()` from `next/navigation` |
| `useParams()` → `{ countryId: "us" }` | `params` prop (Promise, must `await`) |
| `useSearchParams()` | `useSearchParams()` from `next/navigation` |
| `<Link to="/us/team">` | `<Link href="/us/team">` |

### Server vs client components

```tsx
// SERVER COMPONENT (default) — runs on server, no hooks allowed
// Good for: data fetching, reading files, SEO metadata
export default async function Page({ params }) {
  const data = await fetchFromAPI();      // runs on server
  return <ClientComponent data={data} />; // passes data to client
}

// CLIENT COMPONENT — runs in browser, hooks allowed
"use client";
export default function ClientComponent({ data }) {
  const [state, setState] = useState(data);  // hooks work here
  return <button onClick={() => ...}>...</button>;
}
```

**For the calculator:** Almost everything will be `"use client"` since it's all interactive.

### Layouts replace guard components

```
Vite (guard pattern):
  CountryGuard → MetadataGuard → StandardLayout → Page

Next.js (layout pattern):
  app/[countryId]/layout.tsx     ← validates country (replaces CountryGuard)
    app/[countryId]/(calc)/layout.tsx ← loads metadata (replaces MetadataGuard)
      app/[countryId]/(calc)/reports/page.tsx ← actual page
```

### Key differences

| Concept | Vite | Next.js |
|---------|------|---------|
| Code splitting | `React.lazy()` | Automatic per-route |
| Env vars | `import.meta.env.VITE_*` | `process.env.NEXT_PUBLIC_*` |
| Static files | `public/` served as-is | `public/` served as-is (same) |
| API proxy | Vite dev server proxy | `next.config.ts` rewrites |
| Build output | Single bundle | Per-route chunks |
| SSR | Not available | Default (opt out with `"use client"`) |

### What stays the same
- React Query — works identically in Next.js client components
- Redux — works identically wrapped in `"use client"` provider
- Tailwind — works identically
- Design system — shared workspace package, no changes
- All hooks — just change router imports (`react-router-dom` → `next/navigation`)
- All API calls — `fetch()` works the same
- localStorage — works the same in client components

---

## Estimated Effort

| Phase | Scope | Estimate |
|-------|-------|----------|
| 1. Scaffold | Setup + providers | 1-2 days |
| 2. CRUD pages | 4 list pages + components | 2-3 days |
| 3. Pathways | 4 wizard flows | 3-5 days |
| 4. Report output | 51 subpages + charts | 3-5 days |
| 5. Calculations | Orchestrator + polling | 1-2 days |
| 6. Multi-zones | Wiring + testing | 1-2 days |
| **Total** | | **~11-19 days** |

---

## Open Questions (need team input)

1. **Multi-zones vs single app?** — Confirm with Anthony that multi-zones is the intended approach.
2. **Vite calculator lifespan** — Should the Vite calculator stay running while we port, or do we cut over page-by-page?
3. **Auth timeline** — Is auth being added before or after the migration? Affects how we handle user associations.
4. **Priority** — Should we launch the website first (assign domain), then start calculator migration? Or do both in parallel?
