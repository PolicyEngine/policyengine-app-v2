# Country ID architecture

## Overview

The `/:countryId` URL segment is the single source of truth for the current country. The calculator (`calculator-app/`, Next.js) reads it from the route and hands it to the shared code in `app/src/` through React context.

## URL structure

```
/:countryId/*
```

Every country-specific calculator route sits under the country segment, for example `/us/reports` or `/uk/policies`. The supported countries are `countryIds` in `src/libs/countries.ts`.

## Country layout

**Location**: `calculator-app/src/app/[countryId]/layout.tsx`

The entry point for every country route. It:

1. Checks `countryId` against `countryIds`, and replaces the route with `/` when it is not supported.
2. Provides the country through `CountryProvider` (`src/contexts/CountryContext.tsx`).
3. Provides `NavigationProvider` and `LocationProvider`, which expose Next.js navigation and the current location to shared components through `NavigationContext` and `LocationContext`.
4. Renders the calculator's provider tree, `CalculatorProviders` (`calculator-app/src/app/[countryId]/providers.tsx`).

## useCurrentCountry

**Location**: `src/hooks/useCurrentCountry.ts`

Returns the country from `CountryContext`. It throws when it is used outside a `CountryProvider` or when the value is not a supported country.

```tsx
function MyComponent() {
  const country = useCurrentCountry(); // 'us', 'uk', ...
  const { data } = useUserReports(userId, country);
}
```

Components read the country from this hook, not from Redux.

## Redux copy and metadata loading

`MetadataBootstrap` in `providers.tsx` copies the country into Redux with `setCurrentCountry(countryId)` and calls `useFetchMetadata(countryId)`. Loading is non-blocking: pages render while metadata loads.

`useFetchMetadata` (`src/hooks/useMetadata.ts`) dispatches `fetchMetadataThunk(countryId)` only when there is no metadata yet or it belongs to another country, so moving between pages of one country does not refetch. Hooks that need metadata for the current country compare `metadata.currentCountry` with the country they were given.

## Implementation checklist

When adding a country-dependent feature:

- Read the country with `useCurrentCountry()`, not from Redux.
- Pass the country to API calls; never hardcode `'us'` or fall back with `country || 'us'`.
- Leave validation to the country layout instead of validating in components.

## Related files

- `calculator-app/src/app/[countryId]/layout.tsx`: validation and context providers
- `calculator-app/src/app/[countryId]/providers.tsx`: provider tree and `MetadataBootstrap`
- `src/contexts/CountryContext.tsx`: `CountryProvider` and `useCountryContext`
- `src/hooks/useCurrentCountry.ts`: hook that reads the country
- `src/hooks/useMetadata.ts`: `useFetchMetadata`
- `src/reducers/metadataReducer.ts`: metadata state and `setCurrentCountry`
