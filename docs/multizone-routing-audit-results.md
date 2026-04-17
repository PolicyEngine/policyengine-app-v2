# Multizone Routing Audit Results

Use this file for summarized findings from parallel audit sessions. Keep the
row status in `website/src/data/multizoneRoutingReview.json` in sync with these
findings so the preview page remains useful to the team.

## Session Status

| Session | Scope | Status | Notes |
| --- | --- | --- | --- |
| Session A - direct rewrite calculators | Oregon Kicker, WATCA, Keep Your Pay Act, Working Parents | Audited | All four are multizone-ready for routing; WATCA and Working Parents have polish follow-ups. |
| Session B - Vercel research interactives | Public Vercel-backed research apps | Audited | Most zones need path-scoped asset/base path work before host rewrites; Marriage and student loan decisions are deferred. |
| Session C - static/GitHub Pages/legacy embeds | Static or GitHub Pages interactives | Not started | Determine whether to migrate hosting or keep iframe by exception. |
| Session D - special routes | API docs, TAXSIM, model docs, slides, bespoke routes | In progress | API docs is the reference asset-prefix zone. |
| Session E - lower-priority/unlisted | Not listed in research or ownership unclear | Not started | Prioritize after main public interactives. |

## Session B - Vercel Research Interactives

Audited on April 17, 2026. These apps are shown in research and should be
treated as multizone targets by default unless noted otherwise.

| App | Public path | Origin/source | Source repo | Recommendation | Summary |
| --- | --- | --- | --- | --- | --- |
| Scotland income tax analysis dashboard | `/uk/scotland-income-tax-reform` | `https://scotland-income-tax-reform.vercel.app/` | `PolicyEngine/scotland-income-tax-reform` | `multizone-zone-work` | Next dashboard has no `basePath` or `assetPrefix`; origin public path returns 404 and root HTML emits `/_next/static` assets. Host has no rewrite. |
| Introducing the PE-84 | `/us/pe84` | `https://april-fools-2026-two.vercel.app/calculator` | `PolicyEngine/april-fools-2026` | `multizone-zone-work` | Next app has empty `next.config.ts`, root `/_next/static` assets, root-relative icon metadata, and `/us/pe84` returns 404. Host has no rewrite. |
| Student loan visualisation | `/uk/student-loan-visualisation` | `https://student-loan-visualisation.vercel.app/` | `PolicyEngine/student-loan-visualisation` | `simple-rewrite` | Single-file static HTML with external D3/fonts and inline data; no app router or local asset bundle found. A base rewrite to the root document is likely sufficient if the team keeps this as a static article-style interactive. |
| Energy price shock | `/uk/energy-price-shock` | `https://energy-price-shock.vercel.app/` | `PolicyEngine/energy-price-shock` | `multizone-zone-work` | Vite app uses default root base and deployed HTML emits `/assets/...`; origin public path returns 404. Needs path-scoped Vite `base` or a dedicated asset prefix plus host rewrites. |
| Council tax to land value tax reform dashboard | `/uk/uk-land-value-tax` | `https://uk-land-value-tax.vercel.app/` | `PolicyEngine/uk-land-value-tax` | `multizone-zone-work` | Next dashboard has no `basePath` or `assetPrefix`; origin public path returns 404 and root HTML emits `/_next/static` assets. Host has no rewrite. |
| UK Spring Statement 2026 analysis dashboard | `/uk/spring-statement-2026` | `https://uk-spring-statement-2026-policy-engine.vercel.app/` | `PolicyEngine/uk-spring-statement-2026` | `multizone-zone-work` | Next static export emits root `/_next/static` assets, metadata lacks first-party canonical/OG URL, and origin public path returns 404. Host has no rewrite. |
| Cliff Watch | `/us/cliff-watch` | `https://cliff-watch.vercel.app/` | `PolicyEngine/cliff-watch` | `multizone-zone-work` | Vite app uses `base: "/"`, emits `/assets/...`, and origin public path returns 404. It calls `https://api.policyengine.org` directly but also has root-relative `/api/...` fallback calls that need scrutiny under the website host. |
| Marriage incentive calculator | `/us/marriage` | `https://marriage-zeta-beryl.vercel.app/` | `PolicyEngine/marriage` | `needs-investigation` | Defer migration decision. The repo is one shared US/UK app: it has UK calculator logic via `?country=uk`, but the deployed Next `basePath`, assets, metadata, and nav are US-scoped at `/us/marriage`. Tackle US and UK marriage routing together rather than in the straightforward batch. |
| The SALTernative | `/us/salternative` | `https://salt-amt-calculator.vercel.app/?embedded=true` | `PolicyEngine/salt-amt-calculator` | `multizone-zone-work` | Vite app currently serves `/us/salternative` through SPA fallback, but HTML emits root `/assets/...`, title is still generic, and `vite.config.ts` uses `base: "/"`. API calls use Modal absolute URLs. |
| Two-child limit calculator | `/uk/two-child-limit-comparison` | `https://uk-two-child-limit-app.vercel.app` | `PolicyEngine/uk-two-child-limit-app` | `multizone-zone-work` | Vite app uses default root base, emits `/assets/...`, origin public path returns 404, and app code fetches root-relative `/data/all-results.csv`. Needs path-scoped assets and data URL handling before host rewrites. |

### Session B Host Findings

- No Session B public paths currently have host rewrites in `website/next.config.ts`.
- For the Next zones that currently emit root `/_next/static` assets, add zone
  `basePath` or a separate `assetPrefix` before adding host rewrites to avoid
  collisions with the website app and other zones.
- For Vite zones that emit root `/assets/...`, set `base` to the public path or
  a dedicated zone asset prefix and audit any root-relative data/API calls.
- `PolicyEngine/marriage` should be deferred from the straightforward batch.
  It is one shared app with both US and UK calculator logic, but its production
  routing and metadata are US-path scoped. The duplicate UK `apps.json` row for
  `marriage` is not covered by the US `/us/marriage` base path, so US and UK
  marriage should be handled in one follow-up routing decision.

## Oregon Kicker Refund

- Recommendation: `multizone-ready`
- Public path: `/us/oregon-kicker-refund`
- Origin: `https://oregon-kicker-refund.vercel.app`
- Source repo: `PolicyEngine/oregon-kicker-refund`
- Current host setup: `beforeFiles` base and nested rewrites in `website/next.config.ts`
- Current zone setup: Next `basePath` defaults to `/us/oregon-kicker-refund`
- Target zone setup: path-scoped `basePath`
- Host status: pass; host rewrites cover base and nested paths before the generic `[slug]` route
- Zone status: pass; repo has explicit path-mounted config
- Asset status: pass; live HTML emits `/us/oregon-kicker-refund/_next/static/...`
- Dev setup status: pass; `NEXT_PUBLIC_BASE_PATH=""` disables the base path for local dev
- Metadata status: pass; canonical, Open Graph URL, and sitemap point to `https://policyengine.org/us/oregon-kicker-refund`
- API status: pass; app calls `https://api.policyengine.org` directly
- Blockers: none found
- Follow-ups: use this as the baseline for direct rewrite calculator audits

## Household API Docs

- Recommendation: `multizone-ready`
- Public path: `/us/api`
- Origin: `https://household-api-docs-policy-engine.vercel.app`
- Source repo: `PolicyEngine/household-api-docs`
- Current host setup: `beforeFiles` rewrite plus `/_zones/household-api-docs/:path*` asset proxy
- Current zone setup: static export with production-only `assetPrefix`
- Target zone setup: scoped asset prefix under `/_zones/household-api-docs`
- Host status: pass; website has page and asset rewrites
- Zone status: pass based on merged `PolicyEngine/household-api-docs#11`
- Asset status: pass; production assets use `/_zones/household-api-docs`
- Dev setup status: pass; `assetPrefix` is disabled during `next dev`
- Metadata status: partially audited; terms PR adds canonical metadata for new terms routes
- API status: not applicable for this docs surface
- Blockers: none found for multizone pattern
- Follow-ups: use this as the reference for zones that need a separate asset prefix rather than path-scoped `_next` assets

## Keep Your Pay Act

- Recommendation: `multizone-ready`
- Public path: `/us/keep-your-pay-act`
- Origin: `https://keep-your-pay-act.vercel.app`
- Source repo: `PolicyEngine/keep-your-pay-act`
- Current host setup: `beforeFiles` base and nested rewrites in `website/next.config.ts`
- Current zone setup: Next `basePath` defaults to `/us/keep-your-pay-act`
- Target zone setup: path-scoped `basePath`
- Host status: pass; `https://www.policyengine.org/us/keep-your-pay-act` returns HTTP 200
- Zone status: pass; `frontend/next.config.js` defaults `NEXT_PUBLIC_BASE_PATH` to `/us/keep-your-pay-act`
- Asset status: pass; live HTML emits `/us/keep-your-pay-act/_next/static/...`, `/us/keep-your-pay-act/favicon.svg`, and `/us/keep-your-pay-act/policyengine-logo-teal.png`; representative host CSS asset returned HTTP 200
- Dev setup status: pass; `NEXT_PUBLIC_BASE_PATH=""` disables the base path for local dev
- Metadata status: pass; canonical, Open Graph URL, and sitemap point to `https://policyengine.org/us/keep-your-pay-act`
- API status: pass; app calls `https://api.policyengine.org` directly
- Blockers: none found
- Follow-ups: none for multizone readiness

## Working Parents Tax Relief Act

- Recommendation: `multizone-ready`
- Public path: `/us/working-parents-tax-relief-act`
- Origin: `https://wptra.vercel.app`
- Source repo: `PolicyEngine/working-parents-tax-relief-act`
- Current host setup: `beforeFiles` base and nested rewrites in `website/next.config.ts`
- Current zone setup: Next `basePath` defaults to `/us/working-parents-tax-relief-act`
- Target zone setup: path-scoped `basePath`
- Host status: pass; `https://www.policyengine.org/us/working-parents-tax-relief-act` returns HTTP 200
- Zone status: pass; `frontend/next.config.js` defaults `NEXT_PUBLIC_BASE_PATH` to `/us/working-parents-tax-relief-act`
- Asset status: pass for critical assets; live HTML emits `/us/working-parents-tax-relief-act/_next/static/...` and representative host CSS asset returned HTTP 200
- Dev setup status: pass; `NEXT_PUBLIC_BASE_PATH=""` disables the base path for local dev
- Metadata status: pass for canonical and Open Graph URL; sitemap points to `https://policyengine.org/us/working-parents-tax-relief-act`
- API status: pass; app calls `https://api.policyengine.org` directly
- Blockers: none found for multizone routing
- Follow-ups: path-scope the favicon; live HTML currently renders `<link rel="icon" href="/favicon.svg"/>`, which may resolve to the website host favicon under multizone routing

## Working Americans' Tax Cut Act

- Recommendation: `multizone-ready`
- Public path: `/us/watca`
- Origin: `https://working-americans-tax-cut-act-one.vercel.app`
- Source repo: `PolicyEngine/working-Americans-tax-cut-act-`
- Current host setup: `beforeFiles` base and nested rewrites in `website/next.config.ts`
- Current zone setup: Next `basePath` is hardcoded to `/us/watca`
- Target zone setup: path-scoped `basePath`
- Host status: pass; `https://www.policyengine.org/us/watca` returns HTTP 200
- Zone status: pass for routing; `frontend/next.config.ts` sets `basePath: "/us/watca"` and `NEXT_PUBLIC_BASE_PATH: "/us/watca"`
- Asset status: pass; live HTML emits `/us/watca/_next/static/...` and representative host CSS asset returned HTTP 200
- Dev setup status: follow-up; unlike Oregon and Keep Your Pay, the base path is hardcoded and does not provide a `next dev` escape hatch
- Metadata status: follow-up; `frontend/app/layout.tsx` has title and description, but no first-party canonical, Open Graph URL, or sitemap found
- API status: pass; app calls `https://api.policyengine.org` directly
- Blockers: none found for multizone routing
- Follow-ups: add `NEXT_PUBLIC_BASE_PATH=""` local-dev handling and policyengine.org canonical/Open Graph/sitemap metadata

## Rubric Finding: Root Public Assets

Session A found a non-blocking but reusable check: public assets outside
`/_next`, especially favicons, can still leak to root paths even when critical
Next assets are path-scoped. Future audits should check favicons, logos, Open
Graph images, and downloadable assets, not only JS/CSS chunks.
