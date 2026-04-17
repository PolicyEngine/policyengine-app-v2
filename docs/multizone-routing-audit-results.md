# Multizone Routing Audit Results

Use this file for summarized findings from parallel audit sessions. Keep the
row status in `website/src/data/multizoneRoutingReview.json` in sync with these
findings so the preview page remains useful to the team.

## Session Status

| Session | Scope | Status | Notes |
| --- | --- | --- | --- |
| Session A - direct rewrite calculators | Oregon Kicker, WATCA, Keep Your Pay Act, Working Parents | In progress | Oregon is the baseline audited case. |
| Session B - Vercel research interactives | Public Vercel-backed research apps | Not started | Audit as multizone targets by default. |
| Session C - static/GitHub Pages/legacy embeds | Static or GitHub Pages interactives | Not started | Determine whether to migrate hosting or keep iframe by exception. |
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
