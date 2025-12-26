# Monorepo Restructure Summary

This document summarizes all changes made to restructure the PolicyEngine app into a proper Turborepo monorepo with separate apps and shared packages.

## Table of Contents
1. [Structural Changes](#structural-changes)
2. [New Files Created](#new-files-created)
3. [Non-Trivial Code Changes](#non-trivial-code-changes)
4. [Import Path Changes Summary](#import-path-changes-summary)
5. [Verification Commands](#verification-commands)
6. [Known Issues / Future Improvements](#known-issues--future-improvements)

---

## Structural Changes

### New Directory Structure
```
policyengine-app-v2/
├── apps/
│   ├── website/           # NEW - policyengine.org (no Redux/React Query)
│   │   ├── src/
│   │   ├── public/
│   │   ├── index.html
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts
│   │   └── vercel.json
│   └── calculator/        # NEW - app.policyengine.org (full Redux/React Query)
│       ├── src/
│       ├── public/
│       ├── index.html
│       ├── package.json
│       ├── tsconfig.json
│       ├── vite.config.ts
│       └── vercel.json
├── packages/
│   ├── design-system/     # EXISTING - expanded with HomeHeader
│   │   └── src/components/HomeHeader/  # NEW
│   └── shared/            # NEW - common utilities
│       └── src/
│           ├── countries.ts
│           ├── hooks/useCurrentCountry.ts
│           ├── routing/RedirectToCountry.tsx
│           └── services/geolocation.ts
└── app/                   # DELETED - old monolithic app
```

### Deleted
- `app/` - Entire old monolithic app directory

### Modified Root Files
- `package.json` - Updated workspaces, removed `app`, added new scripts
- `CLAUDE.md` - Updated to reflect new structure

---

## New Files Created

### packages/shared/

| File | Purpose |
|------|---------|
| `package.json` | Package config with peer dependencies |
| `tsconfig.json` | TypeScript config |
| `src/index.ts` | Public exports |
| `src/countries.ts` | Country IDs constant (`us`, `uk`, `ca`, `ng`, `il`) and types |
| `src/hooks/useCurrentCountry.ts` | Hook to get current country from URL params |
| `src/hooks/index.ts` | Hook exports |
| `src/routing/RedirectToCountry.tsx` | Geolocation-based country redirect component |
| `src/routing/index.ts` | Routing exports |
| `src/services/geolocation.ts` | Geolocation service for country detection |
| `src/services/index.ts` | Service exports |

### packages/design-system/src/components/HomeHeader/

| File | Purpose |
|------|---------|
| `index.ts` | Public exports |
| `types.ts` | TypeScript interfaces for HomeHeader props |
| `HomeHeader.tsx` | Main component (refactored to accept props) |
| `HeaderLogo.tsx` | Logo component |
| `HeaderContent.tsx` | Content wrapper |
| `NavItem.tsx` | Navigation item component |
| `DesktopNavigation.tsx` | Desktop nav component |
| `MobileMenu.tsx` | Mobile menu component |
| `CountrySelector.tsx` | Country dropdown component |

### apps/website/

| File | Purpose |
|------|---------|
| `package.json` | NO Redux, NO React Query dependencies |
| `tsconfig.json` | TypeScript config |
| `tsconfig.node.json` | Node TypeScript config |
| `vite.config.ts` | Vite config (port 3000) |
| `index.html` | Entry HTML (renamed from website.html) |
| `vercel.json` | Vercel deployment config |
| `public/assets/` | Static assets (logos, images) - copied from calculator |
| `src/App.tsx` | App component (MantineProvider only, no Redux) |
| `src/Router.tsx` | Website router |
| `src/main.tsx` | Entry point |
| `src/constants.ts` | Website constants |
| `src/theme.ts` | Mantine theme |
| `src/components/shared/HeaderNavigation.tsx` | **NEW WRAPPER** - see below |

### apps/calculator/

| File | Purpose |
|------|---------|
| `package.json` | Full Redux + React Query dependencies |
| `tsconfig.json` | TypeScript config |
| `tsconfig.node.json` | Node TypeScript config |
| `vite.config.ts` | Vite config (port 3001) |
| `index.html` | Entry HTML (renamed from calculator.html) |
| `vercel.json` | Vercel deployment config |
| `src/App.tsx` | App with Redux Provider, QueryClient, etc. |
| `src/Router.tsx` | Calculator router |
| `src/main.tsx` | Entry point |

---

## Non-Trivial Code Changes

These are changes beyond simple file moves and import path updates.

### 1. HeaderNavigation Wrapper Component (Website)

**File:** `apps/website/src/components/shared/HeaderNavigation.tsx`

**Why:** The design-system's `HomeHeader` was refactored to be a "dumb" component that accepts props instead of using hooks directly. The website app needs a wrapper to provide the navigation logic.

**Change:** Created new wrapper component that:
- Uses `useCurrentCountry` from `@policyengine/shared`
- Uses `useNavigate` and `useLocation` from React Router
- Passes navigation callbacks and country data as props to `HomeHeader`

```tsx
// NEW FILE - apps/website/src/components/shared/HeaderNavigation.tsx
import { useNavigate, useLocation } from 'react-router-dom';
import { HomeHeader, NavItemSetup, Country } from '@policyengine/design-system';
import { useCurrentCountry } from '@policyengine/shared';

export default function HeaderNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const countryId = useCurrentCountry();

  const handleNavClick = (path?: string) => {
    if (path) navigate(path);
  };

  const handleCountryChange = (newCountryId: string) => {
    const pathParts = location.pathname.split('/').filter(Boolean);
    if (pathParts.length > 0) {
      pathParts[0] = newCountryId;
      navigate(`/${pathParts.join('/')}`);
    } else {
      navigate(`/${newCountryId}`);
    }
  };

  // ... navItems setup ...

  return (
    <HomeHeader
      countryId={countryId}
      websiteUrl={WEBSITE_URL}
      navItems={navItems}
      countries={countries}
      onCountryChange={handleCountryChange}
    />
  );
}
```

### 2. HomeHeader Refactoring (Design System)

**Files:** `packages/design-system/src/components/HomeHeader/*.tsx`

**Why:** Original HomeHeader used hooks directly (`useCurrentCountry`, `useNavigate`), making it tightly coupled to app routing. Refactored to accept props for reusability.

**Change:**
- Removed all hook usage from HomeHeader
- Added TypeScript interfaces for all props
- Components now receive callbacks and data as props

```tsx
// BEFORE (in app/src/components/shared/HomeHeader.tsx)
export default function HomeHeader() {
  const countryId = useCurrentCountry();  // Hook usage
  const navigate = useNavigate();          // Hook usage
  // ...
}

// AFTER (in packages/design-system/src/components/HomeHeader/HomeHeader.tsx)
export interface HomeHeaderProps {
  countryId: string;
  websiteUrl: string;
  navItems: NavItemSetup[];
  countries: Country[];
  onCountryChange: (countryId: string) => void;
}

export default function HomeHeader({
  countryId,
  websiteUrl,
  navItems,
  countries,
  onCountryChange,
}: HomeHeaderProps) {
  // No hooks - all data/callbacks from props
}
```

### 3. OrgLogos CountryId Type Handling (Website)

**File:** `apps/website/src/components/home/OrgLogos.tsx`

**Why:** `@policyengine/shared` exports `CountryId` as `'us' | 'uk' | 'ca' | 'ng' | 'il'`, but `organizations.ts` only has data for `'us' | 'uk'`. Type mismatch needed handling.

**Change:** Added null check and type narrowing:

```tsx
// BEFORE
const countryId = useCurrentCountry() as CountryId;
const shuffledOrgs = useMemo(() => {
  const orgs = getOrgsForCountry(countryId);
  // ...
}, [countryId]);

// AFTER
const currentCountry = useCurrentCountry();
// Only show org logos for countries that have organizations defined
const countryId: CountryId | null =
  currentCountry === 'uk' || currentCountry === 'us' ? currentCountry : null;

const shuffledOrgs = useMemo(() => {
  if (!countryId) return [];
  const orgs = getOrgsForCountry(countryId);
  // ...
}, [countryId]);
```

### 4. HTML Entry Points Renamed

**Change:**
- `app/website.html` → `apps/website/index.html`
- `app/calculator.html` → `apps/calculator/index.html`

**Script src updated:**
```html
<!-- BEFORE -->
<script type="module" src="/src/main.website.tsx"></script>

<!-- AFTER -->
<script type="module" src="/src/main.tsx"></script>
```

### 5. App Entry Points Renamed

**Change:**
- `app/src/main.website.tsx` → `apps/website/src/main.tsx`
- `app/src/main.calculator.tsx` → `apps/calculator/src/main.tsx`
- `app/src/WebsiteApp.tsx` → `apps/website/src/App.tsx`
- `app/src/CalculatorApp.tsx` → `apps/calculator/src/App.tsx`
- `app/src/WebsiteRouter.tsx` → `apps/website/src/Router.tsx`
- `app/src/CalculatorRouter.tsx` → `apps/calculator/src/Router.tsx`

**Import updates in main.tsx:**
```tsx
// BEFORE (main.calculator.tsx)
import CalculatorApp from './CalculatorApp';

// AFTER (main.tsx)
import App from './App';
```

### 6. mailchimpSubscription Types Added (Website)

**File:** `apps/website/src/utils/mailchimpSubscription.ts`

**Why:** Original file had implicit `any` types for jsonp callback parameters.

**Change:** Added explicit types:

```tsx
// BEFORE
jsonp(`${MAILCHIMP_URL}&EMAIL=${encodedEmail}`, { param: 'c' }, (error, data) => {

// AFTER
interface MailchimpResponse {
  result: string;
  msg: string;
}

jsonp(`${MAILCHIMP_URL}&EMAIL=${encodedEmail}`, { param: 'c' }, (error: Error | null, data: MailchimpResponse) => {
```

### 7. Unused Variables Fixed (Calculator)

**Files:**
- `apps/calculator/src/hooks/examples/useEnhancedSimulationsExample.tsx`
- `apps/calculator/src/libs/calculations/household/HouseholdProgressCoordinator.ts`
- `apps/calculator/src/pages/report-output/HouseholdReportViewModel.ts`

**Why:** Strict TypeScript config (`noUnusedLocals`, `noUnusedParameters`) flagged unused variables.

**Change:** Prefixed with underscore or removed:

```tsx
// Example from useEnhancedSimulationsExample.tsx
// BEFORE
const { getSimulationWithFullContext, getSimulationsByPolicy, getNormalizedPolicy } = useUserSimulations(userId);
{simulations.map(({ userSimulation, simulation, policy, household, userPolicy }) => (

// AFTER
const {
  getSimulationWithFullContext: _getSimulationWithFullContext,
  getSimulationsByPolicy: _getSimulationsByPolicy,
  getNormalizedPolicy: _getNormalizedPolicy
} = useUserSimulations(userId);
{simulations.map(({ userSimulation, simulation: _simulation, policy, household, userPolicy }) => (
```

### 8. Deleted Calculator-Specific Files from Website

**File deleted:** `apps/website/src/api/report.ts`

**Why:** This file imported calculator-specific dependencies (`@/adapters/ReportAdapter`, Redux types, etc.) that don't exist in the website app.

### 9. Website App.tsx Simplified

**File:** `apps/website/src/App.tsx`

**Why:** Website doesn't need Redux or React Query.

**Change:**
```tsx
// BEFORE (WebsiteApp.tsx had Redux Provider, etc.)

// AFTER (simplified)
import '@mantine/core/styles.css';
import { MantineProvider } from '@mantine/core';
import { policyEngineTheme } from './theme';
import { WebsiteRouter } from './Router';

export default function App() {
  return (
    <MantineProvider theme={policyEngineTheme}>
      <WebsiteRouter />
    </MantineProvider>
  );
}
```

### 10. Package.json Dependency Differences

**Website (`apps/website/package.json`):**
- NO `@reduxjs/toolkit`
- NO `@tanstack/react-query`
- NO `react-redux`
- Added `jsonp` for mailchimp subscription

**Calculator (`apps/calculator/package.json`):**
- HAS `@reduxjs/toolkit`
- HAS `@tanstack/react-query`
- HAS `@tanstack/react-query-devtools`
- HAS `react-redux`
- HAS `@normy/react-query`

### 11. Root package.json Scripts Updated

**Changes:**
```json
{
  "scripts": {
    "dev": "npm run packages:build && turbo run dev --filter=@policyengine/website --filter=@policyengine/calculator",
    "build:apps": "npm run packages:build && turbo run build --filter=@policyengine/website --filter=@policyengine/calculator",
    "packages:build": "turbo run build --filter=@policyengine/design-system --filter=@policyengine/shared",
    "calculator:dev": "npm run packages:build && npm run dev --workspace=@policyengine/calculator",
    "calculator:build": "npm run packages:build && npm run build --workspace=@policyengine/calculator",
    "website:dev": "npm run packages:build && npm run dev --workspace=@policyengine/website",
    "website:build": "npm run packages:build && npm run build --workspace=@policyengine/website"
  }
}
```

### 12. LegacyBanner Removed from Calculator

**Files modified:**
- `apps/calculator/src/components/Layout.tsx`
- `apps/calculator/src/components/StandardLayout.tsx`
- `apps/calculator/src/components/StaticLayout.tsx`
- `apps/calculator/src/pathways/report/views/policy/PolicyParameterSelectorView.tsx`

**File deleted:**
- `apps/calculator/src/components/shared/LegacyBanner.tsx`

**Change:** Removed all LegacyBanner imports and usage from calculator layouts as part of the restructure cleanup.

---

## Import Path Changes Summary

All files in `apps/website/` and `apps/calculator/` had their imports updated:

| Old Import | New Import |
|------------|------------|
| `@/hooks/useCurrentCountry` | `@policyengine/shared` |
| `@/routing/RedirectToCountry` | `@policyengine/shared` |
| `@/libs/countries` | `@policyengine/shared` |
| `@/components/shared/HomeHeader` | Uses new `HeaderNavigation` wrapper |

---

## Verification Commands

```bash
# Type check all packages
npm run typecheck

# Build packages
npm run packages:build

# Build website
npm run website:build

# Build calculator (may OOM due to size)
npm run calculator:build

# Run individual apps
npm run website:dev    # Port 3000
npm run calculator:dev # Port 3001
```

---

## Known Issues / Future Improvements

### 1. Dev Mode Cross-App URLs

**Issue:** "Enter PolicyEngine" button on website navigates to production calculator URL (`https://app.policyengine.org`) instead of dev URL (`http://localhost:3001`).

**Root Cause:** `CALCULATOR_URL` constant in `apps/website/src/constants.ts` defaults to production URL. The old setup used `VITE_CALCULATOR_URL` env var which was set in the dev script.

**Potential Fix:** Update vite.config.ts for each app to set env vars:
```ts
// apps/website/vite.config.ts
export default defineConfig({
  define: {
    'import.meta.env.VITE_CALCULATOR_URL': JSON.stringify(
      process.env.VITE_CALCULATOR_URL || 'http://localhost:3001'
    ),
  },
  // ...
});
```

Or update package.json scripts:
```json
"website:dev": "VITE_CALCULATOR_URL=http://localhost:3001 npm run packages:build && npm run dev --workspace=@policyengine/website"
```

**Status:** Not implemented - low priority for initial restructure.
