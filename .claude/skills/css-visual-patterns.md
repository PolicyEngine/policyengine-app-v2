# CSS Visual Patterns

How to create decorative CSS visual components for the tools page and research listings. CSS visuals are lightweight, token-aware illustrations registered in a visual registry and referenced from `apps.json` or `posts.json` via the `css:` prefix in the `image` field.

## When to use CSS visuals vs regular images

### Use CSS visuals when:
- The visual is decorative/illustrative, not photographic
- It can be composed from simple shapes (dots, bars, lines, grids)
- It should be theme-aware (uses design tokens, supports dark/light variants)
- Zero loading delay and no broken-image risk is important

### Use regular images when:
- The visual is a photograph or screenshot
- It contains complex illustrations impractical in CSS
- It's externally sourced (press images, partner logos)

## File structure

```
app/src/components/tools/visuals/
  registry.ts          — Registry utilities
  index.ts             — Barrel export + registration
  StateMapDotGrid.tsx  — Example: US map dot grid (51 visible squares)
  AppVisual.tsx        — Unified wrapper (handles css:, images, placeholders)
```

## CSSVisualProps interface

Every CSS visual component must accept this interface:

```tsx
interface CSSVisualProps {
  /** 'dark' for teal/gradient backgrounds, 'light' for white/gray backgrounds */
  variant?: 'dark' | 'light';
  /** Optional max width constraint */
  maxWidth?: string;
}
```

### Variant behavior

- **`'dark'`** — rendered inside FeaturedToolCard's teal gradient panel. Use light colors: `colors.primary[200]`, `colors.primary[300]`, `rgba(255,255,255,0.06)`.
- **`'light'`** — rendered inside a regular ToolCard on a white/gray background. Use saturated colors: `colors.primary[400]`, `colors.primary[300]`, `colors.gray[200]`.

## Creating a new CSS visual

### Step 1: Create the component

File: `app/src/components/tools/visuals/MyVisual.tsx`

```tsx
import { Box } from '@mantine/core';
import { colors, spacing } from '@/designTokens';
import type { CSSVisualProps } from './registry';

export function MyVisual({ variant = 'dark', maxWidth = '280px' }: CSSVisualProps) {
  const primary = variant === 'dark' ? colors.primary[300] : colors.primary[400];
  const secondary = variant === 'dark' ? colors.primary[200] : colors.primary[300];
  const dim = variant === 'dark' ? 'rgba(255,255,255,0.06)' : colors.gray[200];
  const border = variant === 'dark' ? 'rgba(255,255,255,0.15)' : colors.gray[300];

  return (
    <Box style={{ position: 'relative', width: '100%', maxWidth }}>
      {/* Your CSS composition here — use design tokens only */}
    </Box>
  );
}
```

### Step 2: Register in the barrel file

Edit `app/src/components/tools/visuals/index.ts`:

```tsx
import { registerCSSVisual } from './registry';
import { MyVisual } from './MyVisual';

registerCSSVisual('my-visual', MyVisual);

export { MyVisual } from './MyVisual';
```

### Step 3: Reference in apps.json or posts.json

```json
{
  "image": "css:my-visual"
}
```

That's it. `AppVisual` detects the `css:` prefix and renders the registered component.

## Design rules

### Token usage (mandatory)
- **NEVER** hardcode colors. Use `colors.*` from `@/designTokens`.
- **NEVER** hardcode spacing. Use `spacing.*` tokens.
- **NEVER** hardcode border radius. Use `spacing.radius.*`.
- Exception: `rgba()` overlay values for subtle depth effects on dark backgrounds.

### Sizing
- Set `width: '100%'` and constrain with the `maxWidth` prop.
- Use `aspectRatio` for consistent proportions (e.g., `'1.6 / 1'`).
- Default `maxWidth` should be `'280px'` to `'320px'`.

### Grid-based patterns

Use CSS Grid for dot/tile layouts:

```tsx
style={{
  display: 'grid',
  gridTemplateColumns: 'repeat(COLS, 1fr)',
  gridTemplateRows: 'repeat(ROWS, 1fr)',
  gap: '6px',
  padding: spacing.lg,
}}
```

### Data arrays

Define visual data as typed arrays:

```tsx
type CellState = 'active' | 'highlight' | 'dim' | 'hidden';
const CELLS: CellState[] = [/* ... */];
```

## Registry API

```tsx
import {
  registerCSSVisual,  // registerCSSVisual('name', Component)
  getCSSVisual,       // getCSSVisual('name') => Component | undefined
  isCSSVisual,        // isCSSVisual('css:foo') => true
  getCSSVisualName,   // getCSSVisualName('css:foo') => 'foo'
} from '@/components/tools/visuals';
```

## Reference: StateMapDotGrid

The canonical example at `app/src/components/tools/visuals/StateMapDotGrid.tsx`:

1. **66-cell grid** (11 columns x 6 rows) with exactly 51 visible cells for US states + DC
2. **Three visible states**: `active` (standard), `highlight` (emphasized), `dim` (subtle)
3. **One invisible state**: `hidden` (transparent, maintains grid position)
4. **Variant-aware**: different opacity/color values for `'dark'` vs `'light'` backgrounds
5. **Bordered container**: `borderRadius: spacing.radius.xl`, `aspectRatio: '1.6 / 1'`

## AppVisual wrapper

`AppVisual` at `app/src/components/tools/visuals/AppVisual.tsx` is the unified entry point used by `ToolCard` and `FeaturedToolCard`. It handles:

1. **CSS visuals** — detected via `css:` prefix, looked up in registry
2. **Regular images** — URLs or filenames from `/assets/posts/`
3. **Fallback placeholder** — decorative bar chart when no image is set

You generally don't need to use the registry directly. Set `"image": "css:name"` in the JSON and the components handle the rest.
