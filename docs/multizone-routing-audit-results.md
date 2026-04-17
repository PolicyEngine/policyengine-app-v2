# Multizone Routing Audit Results

Use this file for summarized findings from parallel audit sessions. Keep the
row status in `website/src/data/multizoneRoutingReview.json` in sync with these
findings so the preview page remains useful to the team.

## Session Status

| Session | Scope | Status | Notes |
| --- | --- | --- | --- |
| Session A - direct rewrite calculators | Oregon Kicker, WATCA, Keep Your Pay Act, Working Parents | In progress | Oregon is the baseline audited case. |
| Session B - Vercel research interactives | Public Vercel-backed research apps | Not started | Audit as multizone targets by default. |
| Session C - static/GitHub Pages/legacy embeds | Static or GitHub Pages interactives | Audited | Most durable static apps need zone rebuilds with PolicyEngine base paths plus host rewrites; local article/static artifacts can remain iframe/static exceptions. |
| Session D - special routes | API docs, TAXSIM, model docs, slides, bespoke routes | In progress | API docs is the reference asset-prefix zone. |
| Session E - lower-priority/unlisted | Not listed in research or ownership unclear | Not started | Prioritize after main public interactives. |

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
- Asset status: fail for multizone; live HTML emits `/tanf-calculator/assets/...`
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
- Asset status: pass for current static artifact; relative assets are colocated under the website public asset path
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
- Asset status: fail for current multizone; live HTML emits `/obbba-household-by-household/_app/...`
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
