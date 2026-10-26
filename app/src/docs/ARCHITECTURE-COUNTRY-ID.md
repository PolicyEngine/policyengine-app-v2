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

The entry point for every country route. It is a server component that checks `countryId` with `isCountryId` (`src/libs/countries.ts`) and calls `notFound()` when it is not a supported country. Any other first path segment, such as `/llms.txt` or `/US`, is therefore an HTTP 404 rendered by `calculator-app/src/app/not-found.tsx`, not a 200 calculator page.

For a supported country it renders `CountryShell` (`calculator-app/src/app/[countryId]/CountryShell.tsx`), a client component that:

1. Provides the country through `CountryProvider` (`src/contexts/CountryContext.tsx`).
2. Provides `NavigationProvider` and `LocationProvider`, which expose Next.js navigation and the current location to shared components through `NavigationContext` and `LocationContext`.
3. Renders the calculator's provider tree, `CalculatorProviders` (`calculator-app/src/app/[countryId]/providers.tsx`).

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

`MetadataBootstrap` in `providers.tsx` copies the country into Redux with `setCurrentCountry(countryId)` and calls `useFetchMetadata(countryId, routes)`. Loading is non-blocking: pages render while metadata loads.

`routes` comes from `metadataRoutesForPage(useSelectedLayoutSegments())` (`src/libs/flagship/v3ApiRoutes.ts`): `'v1'` (`GET /{country}/metadata`, the whole model) for the older report builder, the routes `V3_API_ROUTES` names for the v3 workspace (`'v2'` loads only the small `GET /v2/model-catalog`, and v3 loads parameters on demand), and, once `V3_API_ROUTES` is `'v2'`, `null` (load nothing) for pages that only redirect into v3 (the country index and the tracker's old address).

`useFetchMetadata` (`src/hooks/useMetadata.ts`) dispatches `fetchMetadataThunk(metadataRequest(countryId, routes))` only when there is no metadata yet, it belongs to another country, or it came from other routes, so moving between pages of one country does not refetch. Hooks that need metadata for the current country compare `metadata.currentCountry` with the country they were given.

## Implementation checklist

When adding a country-dependent feature:

- Read the country with `useCurrentCountry()`, not from Redux.
- Pass the country to API calls; never hardcode `'us'` or fall back with `country || 'us'`.
- Leave validation to the country layout instead of validating in components.

## Related files

- `calculator-app/src/app/[countryId]/layout.tsx`: validation (404 for unsupported countries)
- `calculator-app/src/app/[countryId]/CountryShell.tsx`: context providers
- `calculator-app/src/app/not-found.tsx`: the 404 page
- `calculator-app/src/app/[countryId]/providers.tsx`: provider tree and `MetadataBootstrap`
- `src/contexts/CountryContext.tsx`: `CountryProvider` and `useCountryContext`
- `src/hooks/useCurrentCountry.ts`: hook that reads the country
- `src/hooks/useMetadata.ts`: `useFetchMetadata`
- `src/libs/flagship/v3ApiRoutes.ts`: `V3_API_ROUTES` and which routes a page loads metadata from
- `src/reducers/metadataReducer.ts`: metadata state and `setCurrentCountry`
