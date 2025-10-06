# User association checklist

When creating any of these resources, you MUST create a corresponding user association entry.

## API files and their user association APIs

| Resource | Create API | User Association API | Status |
|----------|-----------|---------------------|--------|
| Policy | `policiesAPI.create()` | `userPoliciesAPI.create()` | ✅ Fixed in PolicyCreationFlow |
| Simulation | `simulationsAPI.create()` | `userSimulationsAPI.create()` | ✅ Fixed in CreateSimulationModal |
| Report | `reportsAPI.create()` | `userReportsAPI.create()` | ✅ Fixed in Reports.page.tsx |
| Dataset | `datasetsAPI.create()` | `userDatasetsAPI.create()` | ⚠️ Needs checking |
| Dynamic | `dynamicsAPI.create()` | `userDynamicsAPI.create()` | ⚠️ Needs checking |

## Pattern to follow

When creating any resource:

```typescript
// 1. Create the resource
const resource = await resourceAPI.create(data);

// 2. Immediately create user association
await userResourceAPI.create({
  user_id: MOCK_USER_ID,  // or actual user ID when auth is implemented
  resource_id: resource.id,
  custom_name: null,
});
```

## Files already fixed

- `/app/src/components/policy/PolicyCreationFlow.tsx` - Creates user-policy association
- `/app/src/components/simulation/CreateSimulationModal.tsx` - Creates user-simulation association
- `/app/src/pages/Reports.page.tsx` - Creates user-report association

## Files to check

Search for all instances of:
- `datasetsAPI.create()`
- `dynamicsAPI.create()`
- Any other resource creation that might need user associations
