# Using @normy/react-query for Data Normalization

This project uses `@normy/react-query` to automatically normalize data fetched via TanStack Query, ensuring consistent data across all queries and mutations.

## How It Works

`@normy/react-query` automatically normalizes any objects with an `id` field. When data is fetched:
1. Objects with `id` fields are stored in a normalized cache by their ID
2. If the same object (same ID) is fetched by another query, it's automatically merged
3. Updates to an object in one query automatically update all references to that object

## Setup

The setup is already configured in `app/src/App.tsx`:

```tsx
import { QueryNormalizerProvider } from '@normy/react-query';

const queryClient = new QueryClient();

<QueryNormalizerProvider queryClient={queryClient}>
  <QueryClientProvider client={queryClient}>
    {/* Your app */}
  </QueryClientProvider>
</QueryNormalizerProvider>
```

## Usage Examples

### Basic Query with Automatic Normalization

```tsx
// Any objects with 'id' fields will be automatically normalized
const { data } = useQuery({
  queryKey: ['users', userId],
  queryFn: () => fetchUserData(userId),
});
```

### Accessing Normalized Data

```tsx
import { useQueryNormalizer } from '@normy/react-query';

const MyComponent = () => {
  const queryNormalizer = useQueryNormalizer();
  
  // Get a specific object by ID
  const user = queryNormalizer.getObjectById('user-123');
  
  // Get all objects of a type
  const allUsers = queryNormalizer.getNormalizedData('users');
};
```

### Using Helper Hooks

The project provides helper hooks in `app/src/hooks/utils/normalizedUtils.ts`:

```tsx
// Get a specific entity by ID
const user = useNormalizedData<User>('users', userId);

// Get all entities of a type
const allUsers = useAllEntities<User>('users');

// Search entities
const results = useSearchEntities<User>('users', 'name', searchTerm);

// Manual normalization updates
const { updateEntity, updateEntities } = useManualNormalization();
```

### Mutations with Automatic Normalization

```tsx
const mutation = useMutation({
  mutationFn: updateUser,
  // The response is automatically normalized
  // All queries referencing this user will be updated
});
```

## Benefits

1. **Automatic Consistency**: Updates to an object in one place update it everywhere
2. **Reduced API Calls**: Shared data across queries reduces redundant fetches
3. **Simplified State Management**: No need to manually sync data across queries
4. **Better Performance**: Normalized cache reduces memory usage

## Configuration

You can configure the normalization behavior:

```tsx
<QueryNormalizerProvider 
  queryClient={queryClient}
  normalizerConfig={{
    // Custom ID extraction (default uses 'id' field)
    getNormalizationObjectKey: obj => obj._id,
    // Enable dev logging
    devLogging: true,
  }}
  // Disable normalization globally (default: true)
  normalize={true}
>
```

## Disabling Normalization for Specific Queries

```tsx
useQuery({
  queryKey: ['special-data'],
  queryFn: fetchData,
  meta: {
    normalize: false, // Disable normalization for this query
  },
});
```

## Example: User Ingredients

See `app/src/hooks/useUserIngredient.ts` for a complete example of using @normy/react-query with user ingredients, including:
- Fetching and automatic normalization
- Accessing normalized data
- Searching normalized entities
- Manual normalization updates