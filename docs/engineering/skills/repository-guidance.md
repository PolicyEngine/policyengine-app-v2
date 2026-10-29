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

A header-echo origin behind a copy of this website's rewrite and middleware showed this on 2026-10-29. Vercel's [rewrites docs](https://vercel.com/docs/rewrites) say the same under "Identifying the visitor at your origin".

So the rule matches the zone's production host, never "anything but policyengine.org": that form would redirect this website's previews, which proxy to the same production host, and the zone's own previews.

A Next.js zone adds three rules to `next.config.js`:

```js
const PUBLIC_URL = "https://www.policyengine.org/us/<slug>";
// Escape the dots: Vercel matches the value as a regex against the whole header.
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

A zone built with another framework, or a Next.js zone built as a static export (`output: "export"`, which `redirects()` doesn't support), adds two rules to `vercel.json`. Use `/(.*)` rather than `/:path*`, which misses URLs that end in a slash, and put the `/` rule first, since `/(.*)` would send the root to the site's home page:

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

Both forms keep the query. Redirect to `www.policyengine.org`, not the apex: the apex 307s to www, which costs readers a hop. Keep `<link rel="canonical">`, `og:url` and the zone's sitemap on `https://policyengine.org/...`, as the other zones do. `app-zone-shell-audit` maps a zone's sitemap entries to routes only on that origin.

**Order matters.** Add the redirect only after the route goes live: the website has merged and deployed the `appZoneRoutes.ts` entry, and its policyengine.org URL serves the page. Before then, the redirect sends readers to a 404. It also breaks the shell audit on the route's PR: with the route not live yet, the audit loads the zone's host directly and follows the redirect to that 404. So a new zone ships without the redirect and adds it in a follow-up. A zone that deploys from the CLI, not from git, ships whatever its main holds at the next routine deploy, so hold the merge, not just the deploy.

**Check it.** After the zone deploys, run `node .github/scripts/audit-zone-direct-hosts.mjs`. For each zone it requests the zone's host directly, at the route's root and at a path under it, the way a reader with an old link would. It then checks that the redirect:

- is permanent;
- names a policyengine.org URL that the zone's rewrite in `appZoneRoutes.ts` proxies back to the same path and query;
- ends on a page that answers 200, with no loop.

When it passes, add the source to `DIRECT_HOST_REDIRECTS` in that script. The `zone-direct-host-audit` workflow runs it daily and on route changes. It fails if a listed zone stops redirecting, or if any zone's redirect lands on the wrong page, a 404 or a loop. It reports zones without the redirect but doesn't fail them.

Pitfalls:

- **Hosts that something iframes.** An iframe of a redirecting host loads policyengine.org instead of the tool. The audit fails if a research article iframes a redirecting host. It can't see embeds on other sites, so check those before adding the redirect.
- **Hosts that serve paths unlike the website's.** CliffWatch (`/us/cliffwatch`) and the student loan visualisation serve from their host's root, and `/us/pe84` rewrites to `/us/pe84/calculator`. Map each host path to the public path that serves it: `"destination": "https://www.policyengine.org/us/cliffwatch/$1"` for a root-served zone. The audit maps every redirect back through `appZoneRoutes.ts` and fails one that lands on another page.
- **Hosts that two routes share.** `/uk/marriage` and `/uk/ai-inequality` rewrite to the US path with `?country=uk`. The plain rules send a UK reader to `/us/marriage?country=uk`, which serves the UK view at a US address. To send them to `/uk/marriage`, add a rule ahead of the others that also has `{ "type": "query", "key": "country", "value": "uk" }`, then run the audit.
- **Assets.** Vercel builds each redirect from its `source`, without the `/_next` exclusion Next's own router applies. So on Vercel these rules also redirect direct requests for `_next` assets. Pages served through policyengine.org fetch their assets through policyengine.org too, so they never meet the redirect.
- **Frameworks.** The Next.js form ran on Next 16.2, and the `vercel.json` form on a static site. A static export (CliffWatch, SPM calculator, AI inequality, taxation of benefits) takes the `vercel.json` form: Next warns that `redirects` "will not automatically work" with `output: "export"`, while Vercel applies the `vercel.json` rules to such a project, Next.js preset and all (tested on Next 16.2). Vite, Create React App and SvelteKit zones take it too. Run the audit after deploying either form.

### GitHub Pages iframes (legacy)

No route embeds a GitHub Pages site as a whole page any more: the 2025 year in review is now a zone (`website/src/data/appZoneRoutes.ts`). Do not add page-level iframe embeds — use multizones. Research articles can still embed `policyengine.github.io` charts in their markdown. The `check-embeds` job in `pr.yaml` and `push.yaml` doesn't scan articles; it checks that `policyengine.github.io` URLs under `app/src/pages/` and `website/src/app/` return 200.

### Host-only `website/vercel.json` rewrites

`website/vercel.json` is still used for host-internal rewrites and a handful of pre-multizone external proxies. Treat any `/us/*` → `*.vercel.app` shape there as legacy — do not add to it.

## Before committing

1. Run `make format` to format `app/`, `website/` and `calculator-app/` with Prettier. `app/` has its own Prettier config; `website/` and `calculator-app/` use Prettier's defaults.
2. Run `make lint` to run ESLint (and Stylelint in `app/`) in all three.
3. Run `make typecheck` to type-check all three, and `make test` to run the `app/` and `website/` tests (`calculator-app/` has none). These match CI's type checking and tests jobs. They don't match CI's Node version, though. vitest's launcher starts with `#!/usr/bin/env node`, so `bun run test` runs the tests on the `node` first on your PATH, not on Bun. CI's Tests job pins Node 26 (in `pr.yaml` and `push.yaml`) because `Intl` number formatting differs between Node versions. `make test` uses your local Node, and `app/.nvmrc` says v24.22.1, so a test that checks formatted numbers can pass locally and fail in CI, or the reverse. Run the tests on Node 26 to match CI.
4. CI fails on ESLint warnings as well as errors (`--max-warnings 0`), and on files Prettier would reformat, so fix all of them.
