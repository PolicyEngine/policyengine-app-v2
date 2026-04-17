# Multizone Routing Audit

This audit determines what work is needed to serve PolicyEngine interactives as
multi-zone apps. The organization currently prefers multizone routing for
interactives by default, because most are independent product surfaces with
their own pages, components, and app chrome.

Use `iframe` or `simple-rewrite` only when there is a concrete reason the app
should not be promoted to a multizone surface.

Use this file as the shared rubric for parallel audits. If an app reveals a
new routing pattern that applies beyond that single app, add a "Rubric Finding"
to the audit result so the criteria can be updated deliberately.

## Inputs

Record these fields before evaluating an app:

- App title
- Slug
- Country
- Public path, such as `/us/oregon-kicker-refund`
- Current source/origin URL
- Source repository, if known
- Current `apps.json` entry
- Current host routing entry in `website/next.config.ts`, if any
- Assigned audit session
- Audit status

## Classification

Use one of these recommendations. Prefer a multizone classification unless the
audit finds a concrete blocker or a durable reason to keep the app embedded.

- `multizone-ready`: The host and zone already satisfy the required checks.
- `multizone-host-work`: The zone is path-aware, but the host rewrite is
  missing, incomplete, or in the wrong rewrite phase.
- `multizone-zone-work`: The host can route the app, but the zone needs changes
  such as `basePath`, asset prefixing, metadata, or API path fixes.
- `simple-rewrite`: A direct rewrite is enough for a limited surface, and the
  team explicitly does not want to treat it as a durable first-party app.
- `iframe`: The app is a true embed, static artifact, legacy tool, or otherwise
  has a concrete reason not to become a first-party route.
- `needs-investigation`: The source repo, framework, or deployed behavior is not
  clear enough to classify.

## Parallel Session Plan

Use these sessions to split work without duplicating effort. Each session should
update the relevant row in `website/src/data/multizoneRoutingReview.json` with
its `auditSession`, `auditStatus`, and summary comment.

### Session A - Direct Rewrite Calculators

Start here because these are closest to Oregon Kicker and are likely the first
conversion batch.

- `app:us:oregon-kicker-refund`
- `app:us:watca`
- `app:us:keep-your-pay-act`
- `app:us:working-parents-tax-relief-act`

### Session B - Vercel Research Interactives

These are public research/product surfaces that currently appear mostly as
generic iframe apps. Audit them as multizone targets by default.

- `app:uk:scotland-income-tax-reform`
- `app:us:pe84`
- `app:uk:student-loan-visualisation`
- `app:uk:energy-price-shock`
- `app:uk:uk-land-value-tax`
- `app:uk:spring-statement-2026`
- `app:us:cliff-watch`
- `app:us:marriage`
- `app:us:salternative`
- `app:uk:two-child-limit-comparison`

### Session C - Static, GitHub Pages, And Legacy Embeds

These may still become first-party routes, but the likely work is different:
static hosting migration, path ownership, or deciding that iframe is the right
exception.

- `app:us:2025-year-in-review`
- `app:uk:2025-year-in-review`
- `app:us:tanf-calculator`
- `app:uk:uk-salary-sacrifice-tool`
- `app:us:encode-policy-multi-agent-ai`
- `app:us:obbba-household-explorer`
- `app:us:obbba-household-by-household`
- `app:us:obbba-scatter`
- `app:us:snap-district-map`

### Session D - Special Routes Outside apps.json

These routes have bespoke host behavior and should be audited separately from
the generic app inventory.

- `route:api`
- `route:taxsim`
- `route:model`
- `route:slides`
- `route:plugin-blog`
- `route:ads-dashboard`
- `route:ai-inequality`
- `app:us:state-legislative-tracker`
- `app:us:california-wealth-tax`

### Session E - Lower-Priority Or Unlisted Interactives

These are not currently shown in the research listing or need ownership
confirmation before prioritizing conversion.

- `app:us:taxation-of-benefits-reforms`
- `app:us:aca-reforms-calculator`
- `app:us:aca-calc`
- `app:us:child-tax-credit-calculator`
- `app:us:child-tax-credit-2024-election-calculator`
- `app:us:givecalc`
- `app:uk:2024-manifestos`
- `app:us:state-eitcs-ctcs`
- `app:us:2024-election-calculator`
- `app:us:rhode-island-ctc-calculator`
- Any additional `apps.json` rows not listed above

## Host Checks

These checks apply to `policyengine-app-v2`, mainly under `website/`.

1. The host has a rewrite for the public base path:

   ```ts
   {
     source: "/us/example-app",
     destination: "https://example-app.vercel.app/us/example-app"
   }
   ```

2. The host has a rewrite for nested paths and path-scoped assets:

   ```ts
   {
     source: "/us/example-app/:path*",
     destination: "https://example-app.vercel.app/us/example-app/:path*"
   }
   ```

3. The rewrite is in the correct phase. App zones that must beat
   `website/src/app/[countryId]/[slug]/page.tsx` should be in `beforeFiles`.

4. If the zone emits assets under a separate prefix, such as
   `/_zones/example-app`, the host has a matching asset rewrite.

5. The website does not define another page that should own the same public
   path.

6. Research/app links use hard navigation for cross-zone surfaces. In the
   current website this is handled by `isApp` links using plain `<a>` tags.

7. Sitemap and metadata ownership is coherent. The public app URL should be
   discoverable, and canonical URLs should not point users to a Vercel origin.

## Zone Checks

These checks apply to the app being routed to.

1. The deployed origin serves the public path:

   ```txt
   https://example-app.vercel.app/us/example-app
   ```

2. The app is path-aware. For a Next app, this usually means `basePath` is set
   to the public path, or the deployed HTML clearly emits path-prefixed assets.

3. Critical assets are path-scoped or separately prefixed. Prefer:

   ```txt
   /us/example-app/_next/static/...
   ```

   or:

   ```txt
   /_zones/example-app/_next/static/...
   ```

   Treat root `/_next/static/...` assets as a risk unless the host has an
   explicit zone asset rewrite and no collision risk.

4. The app hydrates through the host URL. There should be no failed critical
   JavaScript or CSS requests.

5. Refresh works on the public path. If the app has nested routes, refresh those
   paths through the host as well.

6. Internal links and client navigation do not leak users to the zone origin,
   unless the link is intentionally external.

7. Canonical, Open Graph, sitemap, and robots metadata use the first-party
   PolicyEngine URL when the app is meant to appear first-party.

8. API calls are intentional. Absolute external APIs are usually fine. Root
   relative calls like `/api/...` need scrutiny because they may hit the website
   host instead of the zone.

9. Local development behavior is understood. A local-only override for
   `basePath` is useful, but not required for production multizone readiness.

10. Dev-only asset/base path behavior is documented if needed. A useful pattern
    is to disable `assetPrefix` or `basePath` during `next dev`, while keeping
    production and preview builds path-scoped.

## Required Pass Criteria

An app can be considered `multizone-ready` only if these pass:

- Host has base and nested rewrites for the public path.
- Host rewrite priority beats conflicting website routes.
- Zone origin returns HTTP 200 for the public path.
- Host URL returns HTTP 200 for the public path.
- Critical JS/CSS assets load through the host URL.
- Zone assets do not collide with another app's `/_next` assets.
- Refreshing the public path returns the app, not a website 404 or iframe
  wrapper.

## Recommended Checks

These should pass before promoting more apps in the same pattern:

- Canonical URL points to `policyengine.org`.
- Open Graph URL points to `policyengine.org`.
- Sitemap/robots behavior is coherent.
- Known nested routes refresh through the host.
- Internal app links stay on the first-party path.
- API calls do not accidentally target the website host.
- Dev server behavior is ergonomic enough for app owners. For example, the app
  can run at localhost root during `next dev` while production assets stay
  path-scoped.

## Dev Environment Pattern

The merged household API docs PR
`PolicyEngine/household-api-docs#11` provides a useful pattern for multizone
dev ergonomics. It makes the zone asset prefix production-only:

```js
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants.js';

export default function nextConfig(phase) {
  const isDev = phase === PHASE_DEVELOPMENT_SERVER;

  return {
    output: 'export',
    assetPrefix: isDev ? undefined : '/_zones/household-api-docs',
    images: {
      unoptimized: true,
    },
    trailingSlash: true,
  };
}
```

Use this pattern when a zone needs scoped production assets but app developers
should still be able to run the zone directly during local development. This is
similar in spirit to Oregon Kicker's local override:

```js
const basePath = process.env.NEXT_PUBLIC_BASE_PATH === ""
  ? undefined
  : process.env.NEXT_PUBLIC_BASE_PATH || "/us/oregon-kicker-refund";
```

For audits, record whether the app already has a local-dev escape hatch for
`basePath` or `assetPrefix`. Missing dev ergonomics should usually be a
follow-up, not a blocker, unless it prevents the app team from developing the
zone independently.

## Static SPA Path Pattern

Vite, SvelteKit static export, and GitHub Pages apps usually do not use Next
`basePath` or `assetPrefix`, but they still need equivalent path-scoped assets
before promotion to a first-party route.

For Vite apps, inspect `base` in `vite.config.*`. A GitHub Pages project base
such as:

```js
export default defineConfig({
  base: "/example-project/",
});
```

is not sufficient for a PolicyEngine country route such as
`/us/example-project` unless the host also proxies `/example-project` assets.
Prefer adding a PolicyEngine build mode:

```sh
vite build --base /us/example-project/
```

For SvelteKit static exports, inspect `kit.paths.base` in `svelte.config.*`.
An environment-driven base path is useful:

```js
paths: {
  base: process.env.BASE_PATH || "/example-project",
}
```

Then the production PolicyEngine build can set:

```sh
BASE_PATH=/us/example-project npm run build
```

For both patterns, verify live HTML emits assets under the intended public path
or under a separately proxied prefix. Root or GitHub Pages project-path assets
should be treated as zone work until the host rewrites and deployment mode are
explicit.

## Useful Commands

Find the app in the website host:

```sh
rg -n "example-app|rewrites|beforeFiles" website/next.config.ts website/src/data/apps.json
```

Find the source repo:

```sh
gh api 'search/repositories?q=org:PolicyEngine+example-app' --jq '.items[] | {name,full_name,html_url,description}'
```

Search source code in the org:

```sh
gh api 'search/code?q=org:PolicyEngine+example-app' --jq '.items[] | {name,path,repository:.repository.full_name,html_url}'
```

Read a Next config from GitHub:

```sh
gh api 'repos/PolicyEngine/example-app/contents/frontend/next.config.js?ref=main' --jq '.content' | base64 -d
```

Check deployed response headers:

```sh
curl -sI https://example-app.vercel.app/us/example-app
```

Fetch deployed HTML for asset and metadata inspection:

```sh
curl -s https://example-app.vercel.app/us/example-app
```

## Audit Result Template

Use this format for each audited app:

```md
## App Title

- Recommendation: multizone-ready | multizone-host-work | multizone-zone-work | simple-rewrite | iframe | needs-investigation
- Public path: /us/example-app
- Origin: https://example-app.vercel.app
- Source repo: PolicyEngine/example-app
- Current host setup: beforeFiles rewrite | afterFiles rewrite | iframe route | dedicated page | none
- Current zone setup: basePath | assetPrefix | root app | static site | unknown
- Target zone setup: basePath | assetPrefix | path-scoped assets | unknown
- Host status: pass/fail summary
- Zone status: pass/fail summary
- Asset status: pass/fail summary
- Dev setup status: pass/fail summary
- Metadata status: pass/fail summary
- API status: pass/fail summary
- Blockers: none | list concrete blockers
- Follow-ups: concrete next actions
- Rubric Finding: only include if this app reveals a reusable pattern not covered by the rubric
```

## Baseline Example: Oregon Kicker Refund

- Recommendation: `multizone-ready`
- Public path: `/us/oregon-kicker-refund`
- Origin: `https://oregon-kicker-refund.vercel.app`
- Source repo: `PolicyEngine/oregon-kicker-refund`
- Current host setup: `beforeFiles` base and nested rewrites in
  `website/next.config.ts`
- Current zone setup: Next `basePath` defaults to
  `/us/oregon-kicker-refund`
- Asset status: emits assets under
  `/us/oregon-kicker-refund/_next/static/...`
- Metadata status: canonical, Open Graph URL, and sitemap point to
  `https://policyengine.org/us/oregon-kicker-refund`
- API status: calls `https://api.policyengine.org` directly
- Blockers: none found
- Follow-ups: use as the baseline for future multizone candidates
