# TanStack Query Integration Summary for View Component

## Here's what I did

### ✅ Query Setup in `app.tsx`

* Integrated `QueryClient` and `QueryClientProvider` at the root of the app:

  ```tsx
  const queryClient = new QueryClient();

  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
  ```
* This enables query and mutation hooks (`useQuery`, `useMutation`) across the app.


### How Query Keys Work

TanStack Query uses **query keys** (e.g., `['policies']`) to uniquely identify each piece of cached data. When you run `useQuery({ queryKey: ['policies'], ... })`, the data returned from the server is stored in an internal cache under that key. Later, any component using the same key will automatically use the cached data and only refetch if it's stale or invalidated. When mutations (e.g., `createPolicy`) succeed, we call `queryClient.invalidateQueries(['policies'])`, which marks that key as stale and triggers a refetch — ensuring the UI reflects the latest data without manually syncing state.



### ✅ View List Setup with `useQuery`

* Created a query hook for listing policies:

  ```ts
  const { data: policies, isLoading, error } = useQuery({
    queryKey: ['policies'],
    queryFn: fetchPoliciesFn,
  });
  ```
* Which -

  * Fetches on mount
  * Manages loading and error states
  * Caches data with reactivity via `queryKey`
  * Refetches automatically when invalidated

### ✅ Creation Hook with `useMutation` for use in the creation flow

* Wrote `useCreatePolicy` using TanStack’s mutation hook:

  ```ts
  const mutation = useMutation({
    mutationFn: createPolicy,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policies'] });
    }
  });
  ```
* On successful POST:

  * Triggers `invalidateQueries`
  * The policies list gets auto-refetched


## Here's what you need to do for Component Integration

### Create or Update a Policy

* Call the `mutate` function from the existing `useCreatePolicy` hook:

  ```ts
  const { mutate } = useCreatePolicy();

  mutate(newPolicyData);
  ```
* Why:

  * This will send the POST request
  * On success, it invalidates the `['policies']` query
  * TanStack will automatically refresh the list (via refetch or background revalidation)

### No Redux Update Required

* Redux syncing isn’t needed unless another view relies on the updated data before the refetch completes.
* The query will be refetched:

  * Immediately if the list is mounted and `staleTime` allows
  * On next window focus
  * On remount

---

## Benefits of using TanStack Query

*Handles caching, refetching, and syncing data automatically.
*Reduces the need to manually manage UI state or Redux for most read/write cases.
*Avoids stale data issues by invalidating and refetching from the backend when needed.
*Provides out-of-the-box devtools and loading/error states.
*Keeps components clean and focused on rendering logic, not side effects.