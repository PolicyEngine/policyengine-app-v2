# PolicyEngine App v2 Development Guidelines

## app/ directory — what goes where

The `app/` directory contains the legacy Vite build. Some parts have been ported to Next.js, others are still active.

**Ported to website/ (do NOT modify in app/):**
- Website components: `home/`, `shared/static/`, `Footer.tsx`, `FooterSubscribe.tsx`, `blog/BlogPostCard.tsx`, `blog/BlogPostGrid.tsx`, `blog/ResearchFilters.tsx`
  - Note: `homeHeader/` and `shared/HomeHeader.tsx` were also ported to `website/src/components/Header.tsx`, but the calculator-app still renders `HomeHeader` via `StandardLayout`, so these remain editable in `app/`. Keep the calculator header in sync with the website header when the website one changes.
- Website pages: `Home`, `Research`, `Blog`, `Team`, `Supporters`, `Donate`, `Privacy`, `Terms`, `Brand*`, `Citations`, `AppPage`
- `vercel.json` (root) — new rewrites go in `website/next.config.ts`

**Still active in app/ (OK to modify):**
- Calculator components (report builder, household, charts, sidebar, etc.) — `calculator-app/` imports these via `externalDir`
- Calculator pages (report output, pathways, etc.)
- `app/src/data/` — shared data files (posts.json, citations.json, apps.json, authors.json)
- `app/public/assets/` — shared static assets

CI will warn if a PR modifies website-specific files in `app/`.

## Visual Standards (MUST READ)

Detailed visual standards are documented in `.claude/skills/`. **These are mandatory for all UI code:**

- `.claude/skills/design-tokens.md` - Color, spacing, typography tokens
- `.claude/skills/chart-standards.md` - Recharts + Plotly chart patterns
- `.claude/skills/ingredient-patterns.md` - CRUD page patterns

### Critical Rules

1. **SENTENCE CASE EVERYWHERE** - All UI text must use sentence case (capitalize only first word and proper nouns). No Title Case.
   - Correct: "Your saved policies", "Date created", "New simulation"
   - Wrong: "Your Saved Policies", "Date Created", "New Simulation"
   - Exceptions: Proper nouns (PolicyEngine, California), acronyms (IRS, UK), official program names (Child Tax Credit)

2. **USE DESIGN TOKENS** - Never hardcode colors, spacing, or typography values.

   ```tsx
   // WRONG
   style={{ color: '#319795', marginBottom: '16px' }}

   // CORRECT
   import { colors, spacing } from '@/designTokens';
   style={{ color: colors.primary[500], marginBottom: spacing.lg }}
   ```

3. **CHART COLORS** - Use semantic colors for data:
   - Positive/gains: `colors.primary[500]` (teal)
   - Negative/losses: `colors.gray[600]`
   - Always wrap charts in `<ChartContainer>`

4. **INGREDIENT PAGES** - Follow the standard pattern in `ingredient-patterns.md`:
   - Use `IngredientReadView` component
   - Use `RenameIngredientModal` for rename
   - Transform data to `IngredientRecord[]`

## Branding & Logos

### Color Palette

- **Teal** is the current brand color (not blue)
- Old blue assets from `policyengine-app` should be updated to teal

### Logo Assets Location

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

### Chart Watermarks in Research Posts

- Posts reference logos via URL path (e.g., `/assets/logos/policyengine/teal-square.png`)
- Chart watermarks need public URLs, so logos must be in `public/`
- Legacy posts may use `/logo512.png` or GitHub raw URLs - these should be updated to the standard path

### Component Logo Usage

Components reference logos from public path:

```tsx
const PolicyEngineLogo = "/assets/logos/policyengine/white.svg";
```

## Project Structure

- `app/` is the Vite project root
- `app/public/` - Static assets served at exact URLs
- `app/src/` - Source code processed by bundler

## Embedded sites

### Next.js multizones (default for all new tools)

External PolicyEngine Next.js apps are stitched into `policyengine.org` as **Next.js multizones**. The website host (`website/next.config.ts`) proxies a public path to the zone's standalone Vercel deployment via `rewrites()`; the zone itself sets a matching `basePath` (or `assetPrefix` for root-served zones) so its `_next/*` assets resolve through the same proxy.

**To add a new zone embed, edit two files — and *not* `vercel.json`:**

1. `website/src/data/appZoneRoutes.ts` — add a `{ source, destination }` entry. `appZoneRewrites` flattens this into the deep-path rewrite pair and feeds `beforeFiles` in `website/next.config.ts`.
2. The zone repo — set `basePath: '/us/<slug>'` (path-mounted) or `assetPrefix: '/_zones/<slug>'` (root-served). See the `policyengine-interactive-tools` skill / `complete:audit-multizone` for the full rule set.

`changelog_entry.yaml` gets the user-facing line.

Why not `vercel.json`? The root `vercel.json` still hosts a few legacy zone rewrites and host-only routes (favicons, SPA catch-all), but multizone is the source of truth going forward — new entries in `vercel.json` will collide with the website's own `beforeFiles` ordering and bypass the multizone audit CI. Adding to `appZoneRoutes.ts` is the only path that gets validated by `app-zone-shell-audit` and `multizone-tracking-audit`. The `guard-vercel-zone-rewrites` workflow fails the PR if a new country-prefixed `*.vercel.app` rewrite slips into `vercel.json`.

Reference PRs to copy from: [#1047 South Carolina 2026](https://github.com/PolicyEngine/policyengine-app-v2/pull/1047), [#1027 multizone apps registry](https://github.com/PolicyEngine/policyengine-app-v2/pull/1027).

### GitHub Pages iframes (legacy)

A few static GitHub Pages sites are still embedded via iframes in `app/src/pages/`. Do not add new ones — use multizones.

| Route                             | Component                   | Embed source                                 |
| --------------------------------- | --------------------------- | -------------------------------------------- |
| `/:countryId/2025-year-in-review` | `YearInReview.page.tsx`     | `policyengine.github.io/2025-year-in-review` |

CI automatically checks these embed URLs on every push and PR (the `check-embeds` job in `pr.yaml` and `push.yaml`).

### Host-only `vercel.json` rewrites

The root `vercel.json` is still used for host-internal rewrites (favicons, the SPA catch-all, a handful of pre-multizone external proxies). Treat any `/us/*` → `*.vercel.app` shape there as legacy — do not add to it.

## Before committing

1. Run `cd app && bun run prettier -- --write .` to format
2. Run `bun run lint` to check for errors
3. CI uses `--max-warnings 0` so fix all warnings
