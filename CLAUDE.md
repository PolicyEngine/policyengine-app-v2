# PolicyEngine App v2 Development Guidelines

## Project Structure

This is a Turborepo monorepo with the following structure:

```
├── apps/
│   ├── website/         # policyengine.org - Static pages, research, blog
│   └── calculator/      # app.policyengine.org - Interactive calculator
├── packages/
│   ├── design-system/   # Shared UI components and design tokens
│   └── shared/          # Common utilities, hooks, and routing
```

### Apps

- **`apps/website/`** - Static website (policyengine.org)
  - NO Redux, NO React Query - lightweight static pages
  - Research posts, blog, team, supporters, donate pages
  - Port 3000 in development

- **`apps/calculator/`** - Interactive calculator (app.policyengine.org)
  - Full Redux + React Query stack
  - Household builder, policy simulations, reports
  - Port 3001 in development

### Packages

- **`packages/design-system/`** - Shared UI components
  - Design tokens (colors, spacing, typography)
  - HomeHeader, buttons, cards, etc.

- **`packages/shared/`** - Common utilities
  - Country configuration and hooks (`useCurrentCountry`)
  - Geolocation-based routing (`RedirectToCountry`)
  - Shared types

## Development Commands

```bash
# Run both apps in development
npm run dev

# Run individual apps
npm run website:dev      # Website on :3000
npm run calculator:dev   # Calculator on :3001

# Build
npm run build            # Build all
npm run website:build    # Build website only
npm run calculator:build # Build calculator only

# Quality
npm run typecheck        # Type check all packages
npm run lint             # Lint all packages
npm run test             # Run tests
```

## Branding & Logos

### Color Palette
- **Teal** is the current brand color (not blue)

### Logo Assets Location
Logos are in each app's `public/assets/logos/policyengine/`:

| File | Type | Description |
|------|------|-------------|
| `teal.png` | Wide | Teal "POLICY ENGINE" logo |
| `teal.svg` | Wide | SVG version |
| `teal-square.png` | Square | Teal PE icon |
| `white.png` | Wide | White logo (for dark backgrounds) |
| `white.svg` | Wide | SVG version |

### Component Logo Usage
```tsx
const PolicyEngineLogo = '/assets/logos/policyengine/white.svg';
```

## Before Committing

1. Run `npm run typecheck` to check types
2. Run `npm run lint` to check for errors
3. Run `npm run prettier:write` in the app directory to format
