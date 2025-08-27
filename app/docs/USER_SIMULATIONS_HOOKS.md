# User Simulations Hooks

## Overview

This document covers two hooks for working with user simulations:

1. **`useUserSimulations`** - Full-featured hook with all related data
2. **`useSimulationAssociationsByUser`** - Lightweight hook for just associations

## When to Use Each Hook

| Use Case | Hook to Use |
|----------|-------------|
| Simulation detail pages | `useUserSimulations` |
| Lists with policy/household info | `useUserSimulations` |
| Complex simulation views | `useUserSimulations` |
| Simple simulation count | `useSimulationAssociationsByUser` |
| Navigation menus | `useSimulationAssociationsByUser` |
| Sidebar lists | `useSimulationAssociationsByUser` |

## Primary Hook: useUserSimulations

Provides a complete solution for fetching user simulations with all related data (policies, households, user associations) while leveraging `@normy/react-query` for automatic normalization and caching.

## Key Features

### 1. Automatic Normalization
- All fetched objects with `id` fields are automatically normalized
- Data is shared across all queries and components
- Updates to any object automatically propagate everywhere

### 2. Intelligent Caching
- Checks existing cache before fetching
- Uses `useParallelQueries` utility for efficient batch fetching
- Configurable stale time (default: 5 minutes)

### 3. Complete Relationship Mapping
- Fetches UserSimulation associations
- Fetches underlying Simulation data
- Fetches related Policy and Household (Population) data
- Maps to UserPolicy and UserHousehold associations
- Provides full context for each simulation

## Usage

### Basic Usage

```tsx
import { useUserSimulations } from '@/hooks/useUserSimulations';

const MyComponent = () => {
  const userId = 'current-user-id';
  
  const {
    data,              // Enhanced simulation objects with all relationships
    isLoading,         // Combined loading state
    error,             // Combined error state
    associations,      // Raw association data
    getSimulationWithFullContext,  // Helper function
    getSimulationsByPolicy,        // Helper function
    getNormalizedPolicy,           // Direct cache access
  } = useUserSimulations(userId);

  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div>
      {data.map(({ userSimulation, simulation, policy, household, userPolicy }) => (
        <div key={userSimulation.id}>
          <h2>{userSimulation.label}</h2>
          <p>Policy: {userPolicy?.label || policy?.id}</p>
          <p>Household: {household?.household_id}</p>
        </div>
      ))}
    </div>
  );
};
```

### Single Simulation Access

```tsx
import { useUserSimulationById } from '@/hooks/useUserSimulations';

const SimulationDetail = ({ simulationId }) => {
  const userId = 'current-user-id';
  
  const {
    simulation,
    policy,
    household,
    userPolicy,
    userHousehold,
    isLoading,
    error,
  } = useUserSimulationById(userId, simulationId);
  
  // All related data is fetched and normalized
};
```

## Data Flow

```mermaid
graph TD
    A[useUserSimulations] --> B[Fetch User Associations]
    B --> B1[UserSimulation]
    B --> B2[UserPolicy]
    B --> B3[UserHousehold]
    
    B1 --> C[Extract Simulation IDs]
    C --> D[Fetch Simulations - Parallel]
    D --> E[Extract Policy & Household IDs]
    
    E --> F[Fetch Policies - Parallel]
    E --> G[Fetch Households - Parallel]
    
    F --> H[@normy/react-query Normalization]
    G --> H
    D --> H
    
    H --> I[Enhanced Results with Full Context]
```

## Benefits

### 1. Performance
- **Cache First**: Always checks cache before fetching
- **Parallel Fetching**: Uses `useQueries` for parallel API calls
- **Deduplication**: Same objects are never fetched twice
- **Automatic Sharing**: Data is shared across all components

### 2. Developer Experience
- **Type Safety**: Full TypeScript support
- **Clean Code**: Follows DRY, CLEAN, SOLID principles
- **Reusable Utilities**: Leverages existing adapters and utilities
- **Helper Functions**: Provides convenient data access methods

### 3. Data Consistency
- **Automatic Updates**: Mutations update all references
- **Single Source of Truth**: Normalized cache ensures consistency
- **Relationship Integrity**: Maintains proper entity relationships

## Return Value

The hook returns an object with:

| Property | Type | Description |
|----------|------|-------------|
| `data` | `EnhancedUserSimulation[]` | Array of simulations with full context |
| `isLoading` | `boolean` | Combined loading state |
| `error` | `Error \| null` | Combined error state |
| `associations` | `object` | Raw association data for simulations, policies, households |
| `getSimulationWithFullContext` | `function` | Get a specific simulation by ID |
| `getSimulationsByPolicy` | `function` | Filter simulations by policy ID |
| `getSimulationsByHousehold` | `function` | Filter simulations by household ID |
| `getNormalizedSimulation` | `function` | Direct access to normalized simulation |
| `getNormalizedPolicy` | `function` | Direct access to normalized policy |
| `getNormalizedHousehold` | `function` | Direct access to normalized household |

## Enhanced User Simulation Type

```typescript
interface EnhancedUserSimulation {
  // Core associations
  userSimulation: UserSimulation;
  simulation?: Simulation;
  
  // Related entities
  policy?: Policy;
  household?: HouseholdMetadata;
  
  // User associations for related entities
  userPolicy?: UserPolicy;
  userHousehold?: any;
  
  // Status
  isLoading: boolean;
  error: Error | null;
}
```

## Implementation Details

### Cache Strategy
1. Check normalized cache via `queryNormalizer.getObjectById()`
2. Check React Query cache via `queryClient.getQueryData()`
3. Fetch from API if not cached
4. Normalize and store in both caches

### Parallel Fetching
- Uses `useParallelQueries` utility for batch operations
- Fetches all simulations, policies, and households in parallel
- Minimizes waterfall requests

### Error Handling
- Combines errors from all queries
- Provides granular error information per entity
- Gracefully handles partial failures

## Best Practices

1. **Use at Page Level**: Best used at the page/container level
2. **Leverage Normalization**: Child components can access normalized data directly
3. **Avoid Redundant Fetches**: Check normalized cache before fetching
4. **Use Helper Functions**: Utilize provided helper functions for common operations

## Lightweight Hook: useSimulationAssociationsByUser

For scenarios where you only need the user-simulation associations without the full data graph.

### Usage

```tsx
import { useSimulationAssociationsByUser } from '@/hooks/useUserSimulationAssociations';

const SimulationCount = () => {
  const userId = 'current-user-id';
  const { data: associations, isLoading } = useSimulationAssociationsByUser(userId);
  
  return <div>You have {associations?.length || 0} simulations</div>;
};
```

### Benefits

- **Minimal data fetching** - Only gets associations, not full entities
- **Fast loading** - No cascade of related data fetches
- **Small bundle impact** - Doesn't trigger policy/household fetches
- **Perfect for UI chrome** - Sidebars, headers, navigation

## Choosing the Right Hook

```tsx
// ✅ Use associations for simple lists
const SimulationMenu = () => {
  const { data } = useSimulationAssociationsByUser(userId);
  return (
    <ul>
      {data?.map(sim => (
        <li key={sim.id}>{sim.label}</li>
      ))}
    </ul>
  );
};

// ✅ Use full hook for detailed views
const SimulationPage = () => {
  const { data } = useUserSimulations(userId);
  return (
    <div>
      {data.map(({ userSimulation, policy, household }) => (
        // Rich UI with full context
      ))}
    </div>
  );
};
```

## Example: Complete Implementation

See `/app/src/hooks/examples/useEnhancedSimulationsExample.tsx` for complete implementation examples of both hooks.