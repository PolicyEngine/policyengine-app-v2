# How @normy/react-query Works with Existing Hooks

## Automatic Normalization in Action

With `@normy/react-query` installed and configured, your existing hooks (`useUserHousehold`, `useUserSimulation`, `useUserPolicy`) automatically benefit from data normalization **without any code changes**.

## How It Works

### 1. Data is Automatically Normalized

When your existing hooks fetch data with `id` fields, `@normy/react-query` automatically:
- Stores each object by its ID in a normalized cache
- Merges updates across all queries
- Ensures data consistency

Example with `useUserSimulations`:
```tsx
// When this hook fetches simulations...
const { data } = useUserSimulations(userId);

// Each simulation object with an 'id' is automatically normalized
// If simulation id:123 is fetched, it's stored in the normalized cache
```

### 2. Cross-Query Data Sharing

If multiple queries fetch the same object (by ID), they automatically share the same data:

```tsx
// Component A
const { data: userSims } = useUserSimulations('user-1');
// Fetches simulation id:123

// Component B
const { data: simDetail } = useQuery({
  queryKey: ['simulation', '123'],
  queryFn: () => fetchSimulation('123')
});
// If this also returns simulation id:123, it uses/updates the same normalized object
```

### 3. Automatic Updates on Mutations

When a mutation updates an object, all queries referencing that object are automatically updated:

```tsx
const updateSim = useMutation({
  mutationFn: (data) => updateSimulation(data),
  // Response: { id: '123', label: 'Updated Simulation' }
});

// After mutation succeeds:
// - All queries with simulation id:123 automatically reflect the new label
// - No manual cache updates needed!
```

## Benefits for Existing Hooks

Your existing hooks now have these benefits automatically:

### useUserHousehold
- Household objects are normalized by ID
- Updates to a household in one place update it everywhere
- Duplicate fetches are eliminated

### useUserSimulation  
- Simulations are normalized by ID
- Related policies and populations are also normalized
- Updates cascade through relationships

### useUserPolicy
- Policies are normalized by ID
- Shared between simulations that reference the same policy
- Consistent policy data across the app

## Accessing Normalized Data

You can now access the normalized data directly:

```tsx
import { useQueryNormalizer } from '@normy/react-query';
import { useNormalizedData, useAllEntities } from '@/hooks/utils/normalizedUtils';

function MyComponent() {
  // Get a specific simulation from normalized store
  const simulation = useNormalizedData('simulations', '123');
  
  // Get all policies from normalized store
  const allPolicies = useAllEntities('policies');
  
  // Direct access via queryNormalizer
  const queryNormalizer = useQueryNormalizer();
  const household = queryNormalizer.getObjectById('household-456');
}
```

## Example: How useUserSimulations Benefits

```tsx
// Before @normy/react-query:
// - Each component fetching simulation 123 makes a separate API call
// - Updates require manual cache invalidation
// - Data can be inconsistent across components

// After @normy/react-query:
// - Simulation 123 is fetched once and shared
// - Updates automatically propagate
// - Data is always consistent

const SimulationList = () => {
  const { data } = useUserSimulations('user-1');
  // Fetches simulations, each automatically normalized
};

const SimulationDetail = ({ simId }) => {
  // This will use the normalized simulation if already fetched!
  const simulation = useNormalizedData('simulations', simId);
  
  // Or fetch if needed (will be normalized)
  const { data } = useQuery({
    queryKey: ['simulation', simId],
    queryFn: () => fetchSimulation(simId),
    enabled: !simulation, // Skip if already in cache
  });
};
```

## Manual Updates

If you need to manually update normalized data:

```tsx
import { useManualNormalization } from '@/hooks/utils/normalizedUtils';

function MyComponent() {
  const { updateEntity } = useManualNormalization();
  
  // Manually update a simulation
  const handleWebSocketUpdate = (updatedSim) => {
    updateEntity('simulations', updatedSim);
    // All components using this simulation will re-render with new data
  };
}
```

## Key Points

1. **No Hook Changes Required** - Your existing hooks work as-is
2. **Automatic Normalization** - Objects with `id` fields are normalized automatically
3. **Shared Cache** - Same objects share data across queries
4. **Automatic Updates** - Mutations update all references
5. **Better Performance** - Reduced API calls and memory usage
6. **Type Safety** - Full TypeScript support maintained

## Debugging

To see normalization in action:

```tsx
// In App.tsx, enable dev logging
<QueryNormalizerProvider 
  queryClient={queryClient}
  normalizerConfig={{
    devLogging: true, // See normalization logs in console
  }}
>
```

This will log when objects are normalized and updated.