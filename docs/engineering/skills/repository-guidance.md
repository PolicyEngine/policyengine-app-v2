# Repository guidance

## app/ directory — what goes where

The `app/` directory holds the calculator code. `calculator-app/` (Next.js) compiles it through `externalDir`, with `@/*` mapped to `app/src/*`; `app/` has no build of its own, and Vite there only runs Storybook and Vitest. The website lives only in `website/`: the Vite copies of its pages were deleted after the Next.js cutover (#817), and the Vite calculator build after it.

- Calculator components and pages (report builder, household, charts, sidebar, report output, pathways, etc.) live in `app/src/`.
- `homeHeader/` and `shared/HomeHeader.tsx` are the calculator's header, rendered by `StandardLayout`. The website's header is `website/src/components/Header.tsx`; keep the calculator header in sync when the website one changes.
- `app/src/data/` holds data the website shares (posts.json and the article files, authors.json, citations.json, apps.json, events.json); `website/src/data/` links to these files.
- `app/public/assets/` holds static assets that the website build copies in. `calculator-app/public` is a symlink to `app/public`, so everything in `app/public` is served on app.policyengine.org.
- Website pages and components go in `website/src/`. New website rewrites go in `website/next.config.ts`, not `website/vercel.json`.

## Visual standards

Detailed visual standards are documented in `docs/engineering/skills/`. Read the relevant document before changing interface code:

- `docs/engineering/skills/design-tokens.md` - Color, spacing, typography tokens
- `docs/engineering/skills/chart-standards.md` - Recharts + Plotly chart patterns
- `docs/engineering/skills/ingredient-patterns.md` - CRUD page patterns

### Critical rules

1. **Sentence case everywhere** — All interface text must use sentence case (capitalize only the first word and proper nouns). Do not use title case.
   - Correct: "Your saved policies", "Date created", "New simulation"
   - Wrong: "Your Saved Policies", "Date Created", "New Simulation"
   - Exceptions: Proper nouns (PolicyEngine, California), acronyms (IRS, UK), official program names (Child Tax Credit)

2. **Use design tokens** — Never hardcode colors, spacing, or typography values.

   ```tsx
   // WRONG
   style={{ color: '#319795', marginBottom: '16px' }}

   // CORRECT
   import { colors, spacing } from '@/designTokens';
   style={{ color: colors.primary[500], marginBottom: spacing.lg }}
   ```

3. **Chart colors** — Use semantic colors for data:
   - Positive/gains: `colors.primary[500]` (teal)
   - Negative/losses: `colors.gray[600]`
   - Always wrap charts in `<ChartContainer>`

4. **Ingredient pages** — Follow the standard pattern in `ingredient-patterns.md`:
   - Use `IngredientReadView` component
   - Use `RenameIngredientModal` for rename
   - Transform data to `IngredientRecord[]`

## Branding and logos

### Color palette

- **Teal** is the current brand color (not blue)
- Old blue assets from `policyengine-app` should be updated to teal

### Logo asset locations

All logos are in `app/public/assets/logos/policyengine/`:

| File               | Type   | Description                       |
| ------------------ | ------ | --------------------------------- |
| `teal.png`         | Wide   | Teal "POLICY ENGINE" logo         |
| `teal.svg`         | Wide   | SVG version                       |
| `teal-square.png`  | Square | Teal PE icon (trimmed)            |
| `teal-square.svg`  | Square | SVG version                       |
| `white.png`        | Wide   | White logo (for dark backgrounds) |
| `white.svg`        | Wide   | SVG version                       |
| `white-square.svg` | Square | White PE icon SVG                 |

### Favicon

- Located at `app/src/favicon.svg`
- Uses the teal-square logo

### Chart watermarks in research posts

- Posts reference logos via URL path (e.g., `/assets/logos/policyengine/teal-square.png`)
- Chart watermarks need public URLs, so logos must be in `public/`
- Legacy posts may use `/logo512.png` or GitHub raw URLs - these should be updated to the standard path

### Component logo usage

Components reference logos from public path:

```tsx
const PolicyEngineLogo = "/assets/logos/policyengine/white.svg";
```

## Project structure

- `website/` - the Next.js website, deployed to policyengine.org (Vercel project `policyengine-website`)
- `calculator-app/` - the Next.js calculator, deployed to app.policyengine.org (Vercel project `policyengine-calculator-next`)
- `app/src/` - calculator source shared by `calculator-app/`, plus the data files the website reads
- `app/public/` - static files; served on app.policyengine.org through the `calculator-app/public` symlink, and `app/public/assets/` is copied into the website build
- Run both apps locally with `bun run dev` (the website on the first free port from 3000, the calculator on the next free port after it)

## Embedded sites

### The shell rule

**Everything served on policyengine.org carries the PolicyEngine site shell — header/nav and footer — and zone children must render it themselves** (the aca-calc / snap-qc-sim pattern: global nav with the wordmark, Research, Model, API, Donate, plus the site footer links). There is no shelled fallthrough for zone paths: the website proxies each tool's path straight to the child, and an apps.json entry alone has **no production route** (removing a zone rewrite 404s the path — see #1143/#1144). The `app-zone-shell-audit` enforces the header on zone routes; `SHELL_BRAND_EXEMPT_SOURCES` is empty and stays that way — the last nine bare legacy children shipped their shells in August 2026, and new zone embeds must render the shell from day one.

### Next.js multizones (default for all new tools)

External PolicyEngine Next.js apps are stitched into `policyengine.org` as **Next.js multizones**. The website host (`website/next.config.ts`) proxies a public path to the zone's standalone Vercel deployment via `rewrites()`; the zone itself sets a matching `basePath` (or `assetPrefix` for root-served zones) so its `_next/*` assets resolve through the same proxy.

**To add a new zone embed, edit two files — and _not_ `website/vercel.json`:**

1. `website/src/data/appZoneRoutes.ts` — add a `{ source, destination }` entry. `appZoneRewrites` flattens this into the deep-path rewrite pair and feeds `beforeFiles` in `website/next.config.ts`.
2. The zone repo — set `basePath: '/us/<slug>'` (path-mounted) or `assetPrefix: '/_zones/<slug>'` (root-served). The zone's route configuration must match the host rewrite.

Why not `website/vercel.json`? It retains a few legacy zone rewrites and host-only routes, but multizone is the source of truth going forward — new entries will collide with the website's own `beforeFiles` ordering and bypass the multizone audit CI. Adding to `appZoneRoutes.ts` is the only path that gets validated by `app-zone-shell-audit` and `multizone-tracking-audit`. The `guard-vercel-zone-rewrites` workflow fails the PR if a new country-prefixed `*.vercel.app` rewrite slips into `website/vercel.json`.

Reference PRs to copy from: [#1047 South Carolina 2026](https://github.com/PolicyEngine/policyengine-app-v2/pull/1047), [#1027 multizone apps registry](https://github.com/PolicyEngine/policyengine-app-v2/pull/1027).

Once the route is live, the zone adds the direct-host redirect below.

### The direct-host redirect

**Every zone 308s a direct visit to its production Vercel host to the same page on policyengine.org, and leaves requests that policyengine.org proxies alone.** The website proxies each route to `<project>.vercel.app`, so that host serves the same page outside the site, and its links leak into newsletters, posts and READMEs. Public text links to policyengine.org only; this redirect catches the links that slipped through. The 29 October 2026 US newsletter, for one, linked `ballot-measures-2026.vercel.app` seven times.

**How a zone tells the two apart.** Both requests reach the zone with the same `host`. Vercel sets `x-forwarded-host` to the host the visitor asked for, and overwrites any value the visitor sends:

- on a direct visit, it holds the zone's own host;
- on a request the website proxies, it holds the website's host: `www.policyengine.org` in production, and a preview's own `*.vercel.app` host on a preview.

Vercel's [rewrites docs](https://vercel.com/docs/rewrites) describe `x-forwarded-host` as the host the visitor requested ("Identifying the visitor at your origin"). They don't say that Vercel overwrites a value the visitor sends. A header-echo origin behind a copy of this website's rewrite and middleware showed both on 2026-10-29, for direct and proxied requests alike.

So the rule matches the zone's production host, never "anything but policyengine.org": that form would redirect this website's previews, which proxy to the same production host, and the zone's own previews.

A Next.js zone adds three rules to `next.config.js`. If it already returns redirects, add these after its own. In a `next.config.ts` typed `NextConfig`, write `type: "header" as const`: without it TypeScript widens the condition's `type` to `string`, which Next 16's `NextConfig` type rejects (TS2322, checked on Next 16.2.6).

```js
const PUBLIC_URL = "https://www.policyengine.org/us/<slug>";
// The value is a regex that has to match the whole header, so escape the dots.
const directVisit = [
  {
    type: "header",
    key: "x-forwarded-host",
    value: "<project>\\.vercel\\.app",
  },
];

const nextConfig = {
  basePath: "/us/<slug>",
  async redirects() {
    return [
      // The host's root, outside the basePath.
      {
        source: "/",
        basePath: false,
        has: directVisit,
        destination: PUBLIC_URL,
        permanent: true,
      },
      // The bare basePath. Without this rule Vercel sends it to PUBLIC_URL + "/", a second hop.
      {
        source: "/",
        has: directVisit,
        destination: PUBLIC_URL,
        permanent: true,
      },
      {
        source: "/:path*",
        has: directVisit,
        destination: `${PUBLIC_URL}/:path*`,
        permanent: true,
      },
    ];
  },
};
```

A zone built with another framework, or a Next.js zone built as a static export (`output: "export"`), adds two rules to `vercel.json` instead. Next documents `redirects()` as unsupported for static exports; Vercel applies `vercel.json` redirects to such a project, Next.js preset and all (tested on a Next 16.2 export, 2026-10-29). Use `/(.*)` rather than `/:path*`, which misses URLs that end in a slash, and put the `/` rule first, since `/(.*)` would send the root to the site's home page. If the file already has redirects, add these after them: Vercel uses the first rule that matches, and a zone's own rules, such as one that sends `/` to its basePath, have to run first:

```json
{
  "redirects": [
    {
      "source": "/",
      "has": [
        {
          "type": "header",
          "key": "x-forwarded-host",
          "value": "<project>\\.vercel\\.app"
        }
      ],
      "destination": "https://www.policyengine.org/us/<slug>",
      "permanent": true
    },
    {
      "source": "/(.*)",
      "has": [
        {
          "type": "header",
          "key": "x-forwarded-host",
          "value": "<project>\\.vercel\\.app"
        }
      ],
      "destination": "https://www.policyengine.org/$1",
      "permanent": true
    }
  ]
}
```

Both forms keep the query. Redirect to `www.policyengine.org`, not the apex: the apex 307s to www, which costs readers a hop.

In the same change, make sure the page's `<link rel="canonical">` and `og:url` name its policyengine.org URL (`https://policyengine.org/...`), not its Vercel host. Once the host redirects, a page that names its Vercel URL there names a URL that redirects back to it, and the audit fails a redirecting zone whose page does. Keep the zone's sitemap on `https://policyengine.org/...` too: `app-zone-shell-audit` maps sitemap entries on that origin and on the zone's own host, and drops entries on www.

**Order matters.** Add the redirect only after the route goes live: the website has merged and deployed the `appZoneRoutes.ts` entry, and its policyengine.org URL serves the page. Before then, the redirect sends readers to a 404. It also breaks the shell audit on the route's PR: with the route not live yet, the audit loads the zone's host directly and follows the redirect to that 404. So a new zone ships without the redirect and adds it in a follow-up. A zone that deploys from the CLI, not from git, ships whatever its main holds at the next routine deploy, so hold the merge, not just the deploy.

**Check it.** After the zone deploys, run `node .github/scripts/audit-zone-direct-hosts.mjs`. For each zone it requests the zone's host directly, at the route's root and at a path under it, the way a reader with an old link would. It then checks that the redirect:

- is permanent;
- names an https policyengine.org URL that the website's rewrites (its icon rewrites in `policyEngineIconRewrites.ts`, then `appZoneRewrites`, in that order) proxy back to the same path and query;
- if it first redirects on the zone's own host to another path, sends a reader of the page's policyengine.org URL to the same place. A rule conditioned on the host can redirect direct visits only, so the audit requests that URL too. Dropping a trailing slash needs no check: policyengine.org drops it as well;
- isn't sent on to another page by policyengine.org's own redirects, never loops, and at the root ends on a page that answers 200;
- lands on a page whose canonical link and `og:url` name no `*.vercel.app` URL. The audit parses the page with jsdom, as a browser would: it resolves them against the page's URL and any `<base>`, and ignores markup inside comments, scripts, templates and attribute values.

It also warns when policyengine.org adds hops on the way, such as the apex's or a trailing slash's. When it passes, add the source to `DIRECT_HOST_REDIRECTS` in that script. The `zone-direct-host-audit` workflow runs it daily and on route changes. It fails if a listed zone stops redirecting at either path, or if any zone's redirect goes wrong, including a temporary redirect to anywhere but vercel.com. It retries a request that fails or answers 408, 425, 429 or 5xx. It reports a zone without failing it when the audit still can't reach the zone after retries, or the zone answers 401 or 403 or a temporary redirect to vercel.com. A protected preview deployment answers 302 to `https://vercel.com/sso-api` (2026-10-29). No request or retry runs past 12 minutes: each request's timeout is cut to the time left, and the audit reports the zones it didn't finish the same way, so an outage ends the run before the job's 20-minute limit. It reports zones without the redirect, and their statuses, without failing them either.

`website/src/__tests__/config/zone-direct-host-model.test.ts` compares the audit's model of the website's rewrites with Next's testing helper (`next/experimental/testing/server`) on `website/next.config.ts`, over about 2,000 seeded URLs: suffixes, icon paths, trailing slashes, other letter case and queries. It follows the website's trailing-slash redirect first, as Next does. It matches letter case like the helper and the deployed site, which serves `/US/GIVECALC` its own 404 (2026-10-29), though Next's server matcher ignores case.

Pitfalls:

- **Hosts that something iframes.** policyengine.org sends no `X-Frame-Options` or `Content-Security-Policy` header, so an iframe of a redirecting host still loads the tool, through policyengine.org and one hop later, with its query kept. Point iframes at the policyengine.org route anyway. The audit lists research articles and notebooks that iframe a zone host. It can't see embeds on other sites.
- **Hosts that serve paths unlike the website's.** CliffWatch (`/us/cliffwatch`) and the student loan visualisation serve from their host's root, `/us/pe84` rewrites to `/us/pe84/calculator`, and the 2025 year in review's pages reach its host through `/2025-year-in-review/...`. Map each host path to the public path that serves it: `"destination": "https://www.policyengine.org/us/cliffwatch/$1"` for a root-served zone. The audit maps every redirect back through the website's zone rewrites and fails one that lands on another page.
- **Hosts that two routes share.** `/uk/marriage` and `/uk/ai-inequality` rewrite to the US path with `?country=uk`. The plain rules send a UK reader to `/us/marriage?country=uk`, which serves the UK view at a US address. To send them to `/uk/marriage`, add copies of the bare-basePath and `/:path*` rules ahead of the others, each with a second `has` condition, `{ type: "query", key: "country", value: "uk" }`, and with `https://www.policyengine.org/uk/<slug>` (and `/uk/<slug>/:path*`) as the destination. Both public URLs serve the page, so the audit passes either form; it warns when a redirect lands on the US path while the UK route serves the page by name.
- **Assets and APIs.** On Vercel these rules also redirect direct requests for `_next` assets (observed on Next 16.2), although Next's own router skips `/_next` for redirects. Pages served through policyengine.org load their assets through policyengine.org, so readers there never meet the redirect. Browser code that calls the zone's own host by absolute URL would, though: a browser blocks a cross-origin call whose redirect carries no CORS headers. So would outside clients of an API on the host, such as CliffWatch's Python `/api/*` functions. CliffWatch's frontend calls relative paths, or the Modal backend that `NEXT_PUBLIC_CLIFF_WATCH_API_ORIGIN` names; check a zone's own before adding the redirect.
- **Frameworks.** The Next.js form ran on Next 16.2. The `vercel.json` form ran on a static site and on a Next 16.2 static export built with Vercel's Next.js preset. The six zones that build as static exports take the `vercel.json` form: CliffWatch, UK CliffWatch, the SPM calculator, AI inequality, taxation of benefits and the UK spring statement 2026. So do Vite, Create React App and SvelteKit zones. Run the audit after deploying either form.

### GitHub Pages iframes (legacy)

No route embeds a GitHub Pages site as a whole page any more: the 2025 year in review is now a zone (`website/src/data/appZoneRoutes.ts`). Do not add page-level iframe embeds — use multizones. Research articles can still embed `policyengine.github.io` charts in their markdown. The `check-embeds` job in `pr.yaml` and `push.yaml` doesn't scan articles; it checks that `policyengine.github.io` URLs under `app/src/pages/` and `website/src/app/` return 200.

### Host-only `website/vercel.json` rewrites

`website/vercel.json` is still used for host-internal rewrites and a handful of pre-multizone external proxies. Treat any `/us/*` → `*.vercel.app` shape there as legacy — do not add to it.

## Before committing

1. Run `make format` to format `app/`, `website/` and `calculator-app/` with Prettier. `app/` has its own Prettier config; `website/` and `calculator-app/` use Prettier's defaults.
2. Run `make lint` to run ESLint (and Stylelint in `app/`) in all three.
3. Run `make typecheck` to type-check all three, and `make test` to run the `app/` and `website/` tests (`calculator-app/` has none). These match CI's type checking and tests jobs. They don't match CI's Node version, though. vitest's launcher starts with `#!/usr/bin/env node`, so `bun run test` runs the tests on the `node` first on your PATH, not on Bun. CI's Tests job pins Node 26 (in `pr.yaml` and `push.yaml`) because `Intl` number formatting differs between Node versions. `make test` uses your local Node, and `app/.nvmrc` says v24.22.1, so a test that checks formatted numbers can pass locally and fail in CI, or the reverse. Run the tests on Node 26 to match CI.
4. CI fails on ESLint warnings as well as errors (`--max-warnings 0`), and on files Prettier would reformat, so fix all of them.
