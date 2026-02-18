# PolicyEngine App v2 Development Guidelines

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

## Embedded sites (GitHub Pages iframes)

Several pages embed external sites from GitHub Pages via iframes in `app/src/pages/`:

| Route                             | Component                   | Embed source                                 |
| --------------------------------- | --------------------------- | -------------------------------------------- |
| `/:countryId/ai-inequality`       | `AIGrowthResearch.page.tsx` | `policyengine.github.io/ai-inequality`       |
| `/:countryId/2025-year-in-review` | `YearInReview.page.tsx`     | `policyengine.github.io/2025-year-in-review` |

When renaming an embedded repo:

1. Update the iframe `src` URL in the page component
2. Update `PUBLIC_URL` in the embedded repo's CI workflow
3. Search the org for other references: `gh api search/code?q=org:PolicyEngine+OLD_NAME`

CI automatically checks these embed URLs on every push and PR (the `check-embeds` job in `pr.yaml` and `push.yaml`).

## Before committing

1. Run `cd app && bun run prettier -- --write .` to format
2. Run `bun run lint` to check for errors
3. CI uses `--max-warnings 0` so fix all warnings
