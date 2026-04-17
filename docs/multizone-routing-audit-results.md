# Multizone Routing Audit Results

Use this file for summarized findings from parallel audit sessions. Keep the
row status in `website/src/data/multizoneRoutingReview.json` in sync with these
findings so the preview page remains useful to the team.

## Session Status

| Session | Scope | Status | Notes |
| --- | --- | --- | --- |
| Session A - direct rewrite calculators | Oregon Kicker, WATCA, Keep Your Pay Act, Working Parents | Audited | All four are multizone-ready for routing; WATCA and Working Parents have polish follow-ups. |
| Session B - Vercel research interactives | Public Vercel-backed research apps | Audited | Most zones need path-scoped asset/base path work before host rewrites; Marriage and student loan decisions are deferred. |
| Session C - static/GitHub Pages/legacy embeds | Static or GitHub Pages interactives | Audited | Most durable static apps need zone rebuilds with PolicyEngine base paths plus host rewrites; local article/static artifacts can remain iframe/static exceptions. |
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

## PolicyEngine 2025 Year in Review - US

- Recommendation: `multizone-zone-work`
- Public path: `/us/2025-year-in-review`
- Origin: `https://policyengine.github.io/2025-year-in-review`
- Source repo: `PolicyEngine/2025-year-in-review`
- Current host setup: dedicated website page at `website/src/app/[countryId]/2025-year-in-review/page.tsx` that embeds GitHub Pages; no host rewrite
- Current zone setup: Vite/React static site with `base: "/2025-year-in-review/"`; `/2025-year-in-review/us?embed=true` currently returns a GitHub Pages SPA fallback with HTTP 404 before client redirect
- Target zone setup: static zone built for `/us/2025-year-in-review` or a scoped asset prefix with host rewrites for the country path and assets
- Host status: fail for multizone; host currently serves an iframe page, not a zone rewrite
- Zone status: fail for multizone; zone is built for the GitHub Pages project path, not the PolicyEngine country path
- Asset status: fail for multizone; live HTML emits `/2025-year-in-review/assets/...`
- Dev setup status: partial; Vite base is explicit, but no PolicyEngine base-path build mode was found
- Metadata status: partial; live root HTML uses PolicyEngine OG URLs but hardcodes the US public URL
- API status: pass; no API calls found in the static app audit
- Blockers: rebuild zone for `/us/2025-year-in-review` or add a static asset-prefix strategy; replace dedicated iframe page with beforeFiles base and nested rewrites
- Follow-ups: decide whether this remains one shared country-aware zone or splits into country-specific builds

## PolicyEngine 2025 Year in Review - UK

- Recommendation: `multizone-zone-work`
- Public path: `/uk/2025-year-in-review`
- Origin: `https://policyengine.github.io/2025-year-in-review`
- Source repo: `PolicyEngine/2025-year-in-review`
- Current host setup: dedicated website iframe page shared with the US route
- Current zone setup: Vite/React static site with `base: "/2025-year-in-review/"`; `/2025-year-in-review/uk?embed=true` returns the GitHub Pages SPA fallback with HTTP 404 before client redirect
- Target zone setup: static zone built for `/uk/2025-year-in-review` or a country-aware zone with a scoped asset prefix
- Host status: fail for multizone; host currently serves an iframe page
- Zone status: fail for multizone; zone is not mounted at the PolicyEngine country path
- Asset status: fail for multizone; assets are under `/2025-year-in-review/assets/...`
- Dev setup status: partial; explicit Vite base exists, but no PolicyEngine build mode was found
- Metadata status: fail for UK; source metadata/OG URL points to `https://policyengine.org/us/2025-year-in-review`
- API status: pass; no API calls found in the static app audit
- Blockers: same zone and host rewrite work as the US route, plus country-correct metadata
- Follow-ups: make metadata derive from the country route before promoting the UK route to first-party multizone

## TANF Calculator

- Recommendation: `multizone-zone-work`
- Public path: `/us/tanf-calculator`
- Origin: `https://policyengine.github.io/tanf-calculator/`
- Source repo: `PolicyEngine/tanf-calculator`
- Current host setup: generic `/[countryId]/[slug]` iframe wrapper from `apps.json`; no host rewrite
- Current zone setup: Vite/React static build from `frontend/` with `base: "/tanf-calculator/"` and output to `docs`
- Target zone setup: static zone built for `/us/tanf-calculator` or a separate scoped asset prefix
- Host status: fail for multizone; host URL returns the website iframe wrapper
- Zone status: fail for multizone; zone is built for GitHub Pages project path only
- Asset status: fail for multizone; live HTML emits `/tanf-calculator/assets/...`, and favicon is a relative `policyengine-logo.png` asset that must remain path-scoped after any public-path rebuild
- Dev setup status: partial; Vite base is explicit, but no PolicyEngine base-path build mode was found
- Metadata status: fail; only a basic `<title>` was found, with no canonical/OG ownership
- API status: pass in audit scope; no direct `api.policyengine.org` calls were found by code search
- Blockers: add PolicyEngine path-aware build config and host beforeFiles base/nested rewrites
- Follow-ups: add first-party metadata if promoted to multizone

## Salary Sacrifice Cap Analysis Tool

- Recommendation: `multizone-zone-work`
- Public path: `/uk/uk-salary-sacrifice-tool`
- Origin: `https://policyengine.github.io/uk-salary-sacrifice-analysis/`
- Source repo: `PolicyEngine/uk-salary-sacrifice-analysis`
- Current host setup: generic `/[countryId]/[slug]` iframe wrapper from `apps.json`; no host rewrite
- Current zone setup: Vite/React app under `app/`; GitHub Pages build uses `base: "/uk-salary-sacrifice-analysis/"`, while `app/vercel.json` builds Vercel output with `--base /`
- Target zone setup: build with `/uk/uk-salary-sacrifice-tool` or a scoped asset prefix, then add host rewrites
- Host status: fail for multizone; host currently serves the generic iframe wrapper
- Zone status: fail for multizone; neither current GitHub Pages base nor Vercel root base matches the public path
- Asset status: fail for multizone; GitHub Pages HTML emits `/uk-salary-sacrifice-analysis/assets/...`
- Dev setup status: partial; build modes exist, but not a PolicyEngine public-path mode
- Metadata status: fail; only a basic title was found, with no canonical/OG ownership
- API status: pass in audit scope; no direct `api.policyengine.org` calls were found by code search
- Blockers: align app slug/path with deployed base path and add host rewrites
- Follow-ups: decide whether to keep source origin on GitHub Pages or use the existing Vercel build path for the zone

## Automating Tax And Benefit Policy Modeling With Multi-Agent AI

- Recommendation: `iframe`
- Public path: `/us/encode-policy-multi-agent-ai`
- Origin: `PolicyEngine website static asset`
- Source repo: not found as a standalone PolicyEngine repo; bundled in `website/public/assets/posts/encode-policy-multi-agent-ai`
- Current host setup: generic iframe wrapper to local static asset `/assets/posts/encode-policy-multi-agent-ai/index.html`
- Current zone setup: bundled static SPA artifact with relative `./assets/...` JS/CSS
- Target zone setup: keep as local static iframe unless the article interactive gets an owning source repo and durable app lifecycle
- Host status: pass for current iframe/static pattern
- Zone status: not applicable for multizone; this is a bundled article artifact, not a separately hosted zone
- Asset status: partial for current static artifact; JS/CSS are colocated relative `./assets/...`, but the artifact still references root `/vite.svg` for the favicon
- Dev setup status: not audited; no source repo found
- Metadata status: partial; static HTML has title but no canonical/OG metadata in the artifact
- API status: pass; local artifact audit did not find API calls
- Blockers: no standalone source repo or deployment surface to promote
- Follow-ups: keep iframe/static, or reconstruct source ownership before considering multizone

## OBBBA Household Impact Explorer

- Recommendation: `iframe`
- Public path: `/us/obbba-household-explorer`
- Origin: `https://policyengine.github.io/obbba-household-by-household`
- Source repo: `PolicyEngine/obbba-household-by-household`
- Current host setup: generic iframe wrapper from `apps.json`; this row points at the same origin as `obbba-household-by-household`
- Current zone setup: SvelteKit static export configured for `/obbba-household-by-household`
- Target zone setup: keep as a legacy/alias iframe unless the team wants this slug as a canonical first-party route
- Host status: pass for current iframe; fail for multizone because there is no rewrite
- Zone status: fail for this slug; source app is not built for `/us/obbba-household-explorer`
- Asset status: fail for multizone; live assets are under `/obbba-household-by-household/_app/...`
- Dev setup status: partial; repo supports `BASE_PATH`, but not for this alias slug by default
- Metadata status: not found in source audit
- API status: pass in audit scope; no direct `api.policyengine.org` calls were found by code search
- Blockers: duplicate/legacy slug ownership is unclear
- Follow-ups: canonicalize this row to the household-by-household route or remove it from app inventory if it is no longer needed

## The One Big Beautiful Bill Act, Household By Household

- Recommendation: `multizone-zone-work`
- Public path: `/us/obbba-household-by-household`
- Origin: `https://policyengine.github.io/obbba-household-by-household/`
- Source repo: `PolicyEngine/obbba-household-by-household`
- Current host setup: generic `/[countryId]/[slug]` iframe wrapper from `apps.json`; no host rewrite
- Current zone setup: SvelteKit static export with `paths.base = process.env.BASE_PATH || "/obbba-household-by-household"`
- Target zone setup: build with `BASE_PATH=/us/obbba-household-by-household` or adopt a scoped asset prefix, then add host rewrites
- Host status: fail for multizone; host currently serves iframe wrapper
- Zone status: partial; repo already documents the PolicyEngine base path mismatch and supports `BASE_PATH`, but the live GitHub Pages build is still project-path scoped
- Asset status: fail for current multizone; live HTML emits `/obbba-household-by-household/_app/...` and `/obbba-household-by-household/favicon.png`, which are project-path scoped rather than PolicyEngine-path scoped
- Dev setup status: pass/partial; environment-driven base path exists
- Metadata status: not found in source audit
- API status: pass in audit scope; no direct `api.policyengine.org` calls were found by code search
- Blockers: rebuild/deploy for PolicyEngine public path and add beforeFiles base/nested host rewrites
- Follow-ups: use this as the reference pattern for SvelteKit static exports that can be rebuilt with a PolicyEngine `BASE_PATH`
- Rubric Finding: static Vite/SvelteKit zones need the same path-scoped asset checks as Next zones, but the implementation knobs are `base` and SvelteKit `kit.paths.base` rather than `basePath`/`assetPrefix`.

## OBBBA Scatter Plot Explorer

- Recommendation: `needs-investigation`
- Public path: `/us/obbba-scatter`
- Origin: `https://policyengine.github.io/obbba-scatter`
- Source repo: not found as a standalone PolicyEngine repo; code search found older `PolicyEngine/policyengine-app` applet references and related OBBBA code in `PolicyEngine/obbba-household-by-household`
- Current host setup: specialized `obbba-iframe` app row; no host rewrite
- Current zone setup: unknown; deployed origin returns HTTP 404
- Target zone setup: unknown until source/deployment ownership is identified
- Host status: pass for current wrapper route; fail for multizone because no rewrite exists
- Zone status: fail/blocked; origin currently returns 404
- Asset status: blocked; no live app HTML/assets available
- Dev setup status: blocked; source repo unknown
- Metadata status: blocked
- API status: blocked
- Blockers: deployed source URL is 404 and owning repo is unclear
- Follow-ups: identify whether this should point to `PolicyEngine/obbba-household-by-household`, an old `policyengine-app` applet, or be removed from inventory

## SNAP District Map

- Recommendation: `multizone-zone-work`
- Public path: `/us/snap-district-map`
- Origin: `https://policyengine.github.io/snap-district-map/`
- Source repo: `PolicyEngine/snap-district-map`
- Current host setup: generic `/[countryId]/[slug]` iframe wrapper from `apps.json`; no host rewrite
- Current zone setup: Vite/React repo with `base: "/snap-district-map/"`, but the live GitHub Pages HTML references `/src/main.jsx` instead of built `/snap-district-map/assets/...`
- Target zone setup: first fix static build/deploy, then build for `/us/snap-district-map` or use a scoped asset prefix with host rewrites
- Host status: fail for multizone; host serves iframe wrapper
- Zone status: fail; live deployment appears to serve unbuilt Vite source
- Asset status: fail; critical JS is `/src/main.jsx` with bare React imports, which is not a production static bundle
- Dev setup status: partial; Vite base exists, but production deployment does not appear to use it
- Metadata status: fail; only title was found, with no canonical/OG ownership
- API status: pass in audit scope; no direct `api.policyengine.org` calls were found by code search
- Blockers: repair GitHub Pages production build before multizone migration work
- Follow-ups: after deployment is fixed, add PolicyEngine base-path build and beforeFiles host rewrites

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
