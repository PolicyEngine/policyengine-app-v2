# Country ID Architecture

## Overview

This document describes the architecture for country ID management throughout the application, implementing the principle that **the URL parameter is the single source of truth** for the current country.

## Core Principles

1. **URL as Single Source of Truth**: The `/:countryId` URL parameter is the authoritative source for the current country
2. **Session-Scoped State**: All ingredient state (policies, simulations, populations, reports) is tied to the current country session
3. **No Cross-Country Contamination**: Changing countries clears all state to prevent mixing data from different countries
4. **Simple, Idiomatic React**: Uses standard React Router patterns with `useParams()`

## Architecture Components

### 1. URL Structure

```
/:countryId/*
```

All country-specific routes are nested under the country ID parameter:
- `/us/reports` - US reports page
- `/uk/policies` - UK policies page
- `/ca/simulations` - Canada simulations page

### 2. CountryGuard

**Location**: `src/routing/guards/CountryGuard.tsx`

The entry point for all country routes. Validates the country parameter and manages session-scoped state.

**Responsibilities**:
1. Validates `countryId` parameter against allowed countries
2. Redirects to `/` if country is invalid
3. Syncs valid country to `metadata.currentCountry` in Redux
4. Clears all ingredient state when country changes (session-scoped behavior)
5. Renders child routes via `<Outlet />` if valid

**Flow**:
```
User navigates to /uk/reports
  ↓
CountryGuard validates 'uk'
  ↓
Dispatches setCurrentCountry('uk')
  ↓
Dispatches clear actions for all ingredients:
  - clearReport()
  - clearAllPolicies()
  - clearAllSimulations()
  - clearAllPopulations()
  ↓
Renders child routes
```

### 3. useCurrentCountry Hook

**Location**: `src/hooks/useCurrentCountry.ts`

A simple hook that reads the country ID directly from URL parameters.

**Usage**:
```tsx
function MyComponent() {
  const country = useCurrentCountry(); // Returns 'us', 'uk', etc.
  const { data } = useUserReports(userId, country);
  // ...
}
```

**Implementation**:
```tsx
export function useCurrentCountry() {
  const { countryId } = useParams<{ countryId: string }>();
  // Validation and type casting...
  return countryId;
}
```

**Key Points**:
- Must be used within routes protected by CountryGuard
- Reads directly from URL via `useParams()` - no Redux dependency
- Throws error if used outside country routes

### 4. Redux State Synchronization

While the URL is the source of truth for components, Redux stores a copy for specific internal uses:

**metadata.currentCountry**:
- Set by CountryGuard via `setCurrentCountry()`
- Used by:
  - `useFetchMetadata` to determine which country's metadata to load
  - `clearReport` thunk to set report.countryId

**report.countryId**:
- Set by `clearReport` thunk (reads from `metadata.currentCountry`)
- Used for validation when submitting reports
- Ensures reports are always tied to the correct country

**Why not read from Redux?**
- Components should read from URL for simplicity and reliability
- Redux copy is for internal coordination only
- Avoids sync issues and makes data flow clearer

## State Management

### Session-Scoped State

All ingredient state is **session-scoped** to the current country. When the user navigates between countries, all state is cleared:

**Cleared on Country Change**:
- Reports (`report` reducer)
- Policies (`policy` reducer)
- Simulations (`simulations` reducer)
- Populations (`population` reducer)

**Example**:
```
User at /us/reports with US policy + simulation
  ↓
User navigates to /uk/reports
  ↓
CountryGuard detects country change
  ↓
All ingredient state cleared
  ↓
UK routes render with clean state
```

### State Preservation

State is preserved when navigating **within** the same country:

```
User at /us/reports with report data
  ↓
User navigates to /us/policies
  ↓
CountryGuard runs but country is still 'us'
  ↓
useEffect dependency doesn't change
  ↓
No state clearing occurs
  ↓
Report data preserved
```

### Clear Actions

Each reducer provides a clear action:

```typescript
// Report
clearReport() // Async thunk - also sets countryId

// Policy
clearAllPolicies()

// Simulations
clearAllSimulations()

// Populations
clearAllPopulations()
```

## Metadata Loading

### MetadataGuard & MetadataLazyLoader

Two guards handle metadata loading:

**MetadataGuard** (Blocking):
- Blocks rendering until metadata loads
- Shows loading/error pages
- Used for routes that require metadata immediately (e.g., report-output)

**MetadataLazyLoader** (Non-blocking):
- Triggers metadata fetch but doesn't block rendering
- Used for routes that benefit from metadata but can render without it (e.g., reports, policies)

**Both guards**:
- Use `useCurrentCountry()` to read country from URL
- Call `useFetchMetadata(countryId)` to trigger fetch
- Smart caching prevents duplicate fetches

**Flow**:
```
User navigates to /uk/reports
  ↓
CountryGuard validates 'uk' and sets metadata.currentCountry = 'uk'
  ↓
MetadataLazyLoader renders
  ↓
Calls useCurrentCountry() → returns 'uk' from URL
  ↓
Calls useFetchMetadata('uk')
  ↓
useFetchMetadata checks if metadata.currentCountry === 'uk' and metadata.version exists
  ↓
If not, dispatches fetchMetadataThunk('uk')
  ↓
Metadata loads for UK
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                         URL                              │
│                    /:countryId                          │
│              (Single Source of Truth)                    │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
          ┌───────────────┐
          │ CountryGuard  │
          │               │
          │ - Validates   │
          │ - Syncs Redux │
          │ - Clears State│
          └───────┬───────┘
                  │
         ┌────────┴─────────┐
         │                  │
         ▼                  ▼
┌─────────────────┐  ┌──────────────┐
│ Components      │  │ Redux State  │
│                 │  │              │
│ useCurrentCountry()│  │ metadata.   │
│ ↓               │  │ currentCountry│
│ Read from URL   │  │              │
│ directly        │  │ (internal use)│
└─────────────────┘  └──────────────┘
```

## Implementation Checklist

When adding new country-dependent features:

- [ ] **Read country from URL**: Use `useCurrentCountry()` hook, not Redux
- [ ] **Pass country to API calls**: Don't hardcode 'us' or use `|| 'us'` fallbacks
- [ ] **Clear state on country change**: Add clear action to CountryGuard if storing country-specific data
- [ ] **Validate in guards**: Let CountryGuard handle validation, don't validate in components
- [ ] **Test cross-country navigation**: Ensure state clears properly when country changes

## Common Patterns

### ✅ Correct: Read from URL

```tsx
function MyComponent() {
  const country = useCurrentCountry();
  const { data } = useQuery(['reports', country], () =>
    fetchReports(country)
  );
}
```

### ❌ Incorrect: Read from Redux

```tsx
function MyComponent() {
  // DON'T DO THIS - URL is source of truth
  const country = useSelector(state => state.metadata.currentCountry);
  const { data } = useQuery(['reports', country], () =>
    fetchReports(country)
  );
}
```

### ✅ Correct: Pass country to API

```tsx
const { data } = useUserReports(userId, country);

// Hook implementation
function useUserReports(userId: string, country: string) {
  return useQuery(['user-reports', userId, country], () =>
    api.get(`/${country}/api/users/${userId}/reports`)
  );
}
```

### ❌ Incorrect: Hardcode or fallback

```tsx
// DON'T DO THIS
const { data } = useUserReports(userId, country || 'us');

// OR THIS
function useUserReports(userId: string, country?: string) {
  const countryId = country || 'us'; // ❌ Hardcoded fallback
  // ...
}
```

### ✅ Correct: Session-scoped state

```tsx
// In CountryGuard useEffect:
dispatch(clearReport());
dispatch(clearAllPolicies());
dispatch(clearAllSimulations());
dispatch(clearAllPopulations());
```

## Benefits

1. **Clarity**: URL is the obvious source of truth - no confusion about where country comes from
2. **Reliability**: URL can't get out of sync with itself
3. **Shareability**: URLs are fully self-contained - `/uk/reports` always shows UK reports
4. **Testability**: Easy to test by changing URL in tests
5. **No Cross-Country Bugs**: Session-scoped state prevents data contamination
6. **Standard React Patterns**: Uses idiomatic React Router patterns

## Testing

### Unit Tests

Test components with different country parameters:

```tsx
test('given UK country then fetches UK reports', () => {
  renderWithRouter('/uk/reports');
  expect(mockFetchReports).toHaveBeenCalledWith('uk');
});
```

### Integration Tests

Test cross-country navigation:

```tsx
test('given country change then clears all state', async () => {
  const { user } = renderWithRouter('/us/test');

  // Populate state
  store.dispatch(updateLabel('US Report'));

  // Navigate to different country
  await user.click(screen.getByRole('button', { name: 'Go to UK' }));

  // Verify state cleared
  expect(store.getState().report.label).toBeNull();
  expect(store.getState().report.countryId).toBe('uk');
});
```

## Migration Notes

Previous implementations may have:
- Hardcoded `'us'` as default country
- Used `country || 'us'` fallbacks throughout
- Stored country in multiple Redux slices inconsistently
- Not cleared state on country changes

All of these patterns have been replaced with the URL-as-source-of-truth architecture described here.

## Related Files

### Core Implementation
- `src/routing/guards/CountryGuard.tsx` - Entry point and state management
- `src/hooks/useCurrentCountry.ts` - Hook to read country from URL
- `src/reducers/reportReducer.ts` - Report state with clearReport thunk
- `src/reducers/metadataReducer.ts` - Metadata state with setCurrentCountry
- `src/routing/guards/MetadataGuard.tsx` - Blocking metadata loader
- `src/routing/guards/MetadataLazyLoader.tsx` - Non-blocking metadata loader

### Tests
- `src/tests/unit/routing/guards/CountryGuard.test.tsx` - CountryGuard validation tests
- `src/tests/integration/countryNavigation.test.tsx` - Cross-country navigation tests
- `src/tests/unit/hooks/useCurrentCountry.test.tsx` - Hook tests (if exists)

### API Layer
- All hooks in `src/hooks/` that make API calls should accept country parameter
- No hardcoded country IDs in API calls
