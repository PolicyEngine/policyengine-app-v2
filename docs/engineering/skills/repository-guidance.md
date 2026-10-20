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

### GitHub Pages iframes (legacy)

No route embeds a GitHub Pages site as a whole page any more: the 2025 year in review is now a zone (`website/src/data/appZoneRoutes.ts`). Do not add page-level iframe embeds — use multizones. Research articles can still embed `policyengine.github.io` charts in their markdown. The `check-embeds` job in `pr.yaml` and `push.yaml` doesn't scan articles; it checks that `policyengine.github.io` URLs under `app/src/pages/` and `website/src/app/` return 200.

### Host-only `website/vercel.json` rewrites

`website/vercel.json` is still used for host-internal rewrites and a handful of pre-multizone external proxies. Treat any `/us/*` → `*.vercel.app` shape there as legacy — do not add to it.

## Before committing

1. Run `cd app && bun run prettier -- --write .` to format
2. Run `bun run lint` to check for errors
3. CI uses `--max-warnings 0` so fix all warnings
