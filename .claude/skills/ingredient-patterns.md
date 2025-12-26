# Ingredient CRUD Patterns

This skill documents the standard patterns for ingredient list pages (Policies, Reports, Simulations, Populations). All ingredient pages follow the same structure for consistency.

## Page Structure Overview

Every ingredient page has:
1. **Data fetching** via React Query hooks
2. **State management** for search, selection, and rename modal
3. **Column configuration** defining table structure
4. **Data transformation** from API types to `IngredientRecord[]`
5. **`IngredientReadView` component** for rendering
6. **`RenameIngredientModal`** for rename functionality

## Required Imports

```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stack } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { ColumnConfig, IngredientRecord, TextValue, BulletsValue } from '@/components/columns';
import { RenameIngredientModal } from '@/components/common/RenameIngredientModal';
import IngredientReadView from '@/components/IngredientReadView';
import { MOCK_USER_ID } from '@/constants';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { formatDate } from '@/utils/dateUtils';
```

## Standard Page Template

```tsx
export default function [Ingredient]sPage() {
  // 1. HOOKS
  const userId = MOCK_USER_ID.toString();
  const { data, isLoading, isError, error } = use[Ingredient]s(userId);
  const navigate = useNavigate();
  const countryId = useCurrentCountry();

  // 2. STATE
  const [searchValue, setSearchValue] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // 3. RENAME MODAL STATE
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameOpened, { open: openRename, close: closeRename }] = useDisclosure(false);
  const updateAssociation = useUpdate[Ingredient]Association();

  // 4. HANDLERS
  const handleBuild = () => navigate(`/${countryId}/[ingredients]/create`);

  const handleSelectionChange = (recordId: string, selected: boolean) => {
    setSelectedIds((prev) =>
      selected ? [...prev, recordId] : prev.filter((id) => id !== recordId)
    );
  };

  const isSelected = (recordId: string) => selectedIds.includes(recordId);

  const handleOpenRename = (id: string) => {
    setRenamingId(id);
    openRename();
  };

  const handleCloseRename = () => {
    closeRename();
    setRenamingId(null);
  };

  const handleRename = async (newLabel: string) => {
    if (!renamingId) return;
    try {
      await updateAssociation.mutateAsync({
        user[Ingredient]Id: renamingId,
        updates: { label: newLabel },
      });
      handleCloseRename();
    } catch (error) {
      console.error(`[${Ingredient}sPage] Failed to rename:`, error);
    }
  };

  // 5. CURRENT LABEL FOR MODAL
  const renamingItem = data?.find((item) => item.association.id === renamingId);
  const currentLabel = renamingItem?.association.label || `[Ingredient] #${renamingItem?.association.[ingredient]Id}`;

  // 6. COLUMN CONFIG
  const columns: ColumnConfig[] = [
    { key: 'name', header: '[Ingredient] name', type: 'text' },
    { key: 'dateCreated', header: 'Date created', type: 'text' },
    // ... additional columns
    {
      key: 'actions',
      header: '',
      type: 'menu',
      actions: [{ label: 'Rename', action: 'rename' }],
      onAction: (action: string, recordId: string) => {
        if (action === 'rename') handleOpenRename(recordId);
      },
    },
  ];

  // 7. DATA TRANSFORMATION
  const transformedData: IngredientRecord[] = data?.map((item) => ({
    id: item.association.id?.toString() || item.association.[ingredient]Id.toString(),
    name: { text: item.association.label || `[Ingredient] #${item.association.[ingredient]Id}` } as TextValue,
    dateCreated: {
      text: item.association.createdAt
        ? formatDate(item.association.createdAt, 'short-month-day-year', item.association.countryId, true)
        : '',
    } as TextValue,
  })) || [];

  // 8. RENDER
  return (
    <>
      <Stack gap="md">
        <IngredientReadView
          ingredient="[ingredient]"
          title="Your saved [ingredients]"
          subtitle="Description of what this page is for."
          onBuild={handleBuild}
          isLoading={isLoading}
          isError={isError}
          error={error}
          data={transformedData}
          columns={columns}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          enableSelection
          isSelected={isSelected}
          onSelectionChange={handleSelectionChange}
        />
      </Stack>

      <RenameIngredientModal
        opened={renameOpened}
        onClose={handleCloseRename}
        currentLabel={currentLabel}
        onRename={handleRename}
        isLoading={updateAssociation.isPending}
        ingredientType="[ingredient]"
      />
    </>
  );
}
```

## Column Types

### Text Column
```tsx
{
  key: 'fieldName',
  header: 'Column Header',
  type: 'text',
}

// Data format:
{ text: 'Display value' } as TextValue
```

### Link Column
```tsx
{
  key: 'fieldName',
  header: 'Column Header',
  type: 'link',
}

// Data format:
{ text: 'Link text', url: '/path/to/resource' } as LinkValue
```

### Bullets Column
For multi-line details (e.g., simulation info, population details):
```tsx
{
  key: 'details',
  header: 'Details',
  type: 'bullets',
  items: [{ textKey: 'text', badgeKey: 'badge' }],
}

// Data format:
{
  items: [
    { text: '3 persons', badge: '' },
    { text: 'California', badge: '' },
  ]
} as BulletsValue
```

### Menu Column (Actions)
```tsx
{
  key: 'actions',
  header: '',
  type: 'menu',
  actions: [
    { label: 'Rename', action: 'rename' },
    { label: 'Delete', action: 'delete', color: 'red' },
  ],
  onAction: (action: string, recordId: string) => {
    if (action === 'rename') handleOpenRename(recordId);
    if (action === 'delete') handleDelete(recordId);
  },
}
```

## Data Transformation Patterns

### Basic Transformation
```tsx
const transformedData: IngredientRecord[] = data?.map((item) => ({
  id: item.association.id?.toString() || item.association.policyId.toString(),
  policyName: {
    text: item.association.label || `Policy #${item.association.policyId}`,
  } as TextValue,
  dateCreated: {
    text: item.association.createdAt
      ? formatDate(item.association.createdAt, 'short-month-day-year', item.association.countryId, true)
      : '',
  } as TextValue,
})) || [];
```

### With Computed Values
```tsx
const transformedData: IngredientRecord[] = data?.map((item) => {
  const paramCount = countPolicyModifications(item.policy);

  return {
    id: item.association.id?.toString(),
    // ...
    provisions: {
      text: `${paramCount} parameter change${paramCount !== 1 ? 's' : ''}`,
    } as TextValue,
  };
}) || [];
```

### Combining Multiple Data Sources
```tsx
// For pages like Populations that combine households + geographies
const householdRecords: IngredientRecord[] = householdData?.map(/* ... */) || [];
const geographicRecords: IngredientRecord[] = geographicData?.map(/* ... */) || [];
const transformedData = [...householdRecords, ...geographicRecords];
```

## Rename Modal Integration

### Modal State Pattern
```tsx
const [renamingId, setRenamingId] = useState<string | null>(null);
const [renameOpened, { open: openRename, close: closeRename }] = useDisclosure(false);
```

### Opening the Modal
```tsx
const handleOpenRename = (userAssociationId: string) => {
  setRenamingId(userAssociationId);
  openRename();
};
```

### Handling Rename
```tsx
const handleRename = async (newLabel: string) => {
  if (!renamingId) return;

  try {
    await updateAssociation.mutateAsync({
      userPolicyId: renamingId,  // Use correct ID field
      updates: { label: newLabel },
    });
    handleCloseRename();
  } catch (error) {
    console.error('[PoliciesPage] Failed to rename policy:', error);
  }
};
```

### Getting Current Label
```tsx
const renamingItem = data?.find((item) => item.association.id === renamingId);
const currentLabel = renamingItem?.association.label || `Policy #${renamingItem?.association.policyId}`;
```

## IngredientReadView Props

```tsx
interface IngredientReadViewProps {
  ingredient: string;           // Singular name for button text
  title: string;                // Page title
  subtitle?: string;            // Description text
  buttonLabel?: string;         // Custom button label (default: "New {ingredient}")
  onBuild?: () => void;         // Handler for create button
  isLoading: boolean;           // Show loading state
  isError: boolean;             // Show error state
  error?: unknown;              // Error object for message
  data: IngredientRecord[];     // Transformed data
  columns: ColumnConfig[];      // Column definitions
  searchValue?: string;         // Current search value
  onSearchChange?: (value: string) => void;
  enableSelection?: boolean;    // Enable row selection
  isSelected?: (recordId: string) => boolean;
  onSelectionChange?: (recordId: string, selected: boolean) => void;
}
```

## Error Logging Convention

Always prefix console errors with the component name:
```tsx
console.error('[PoliciesPage] Failed to rename policy:', error);
console.error('[ReportsPage] Failed to rename report:', error);
console.error('[SimulationsPage] Failed to rename simulation:', error);
```

## Existing Ingredient Pages

| Page | Ingredients | Special Features |
|------|-------------|------------------|
| `Policies.page.tsx` | Policies | Parameter change count |
| `Reports.page.tsx` | Reports | Status cell, simulations list (bullets), link column |
| `Simulations.page.tsx` | Simulations | Policy + Population text columns |
| `Populations.page.tsx` | Households + Geographies | Combined data sources, bullets for details |

## Anti-Patterns

### Don't
```tsx
// WRONG - Direct mutation without try/catch
const handleRename = async (newLabel: string) => {
  await updateAssociation.mutateAsync({ ... });  // No error handling
};

// WRONG - Hardcoded user ID
const userId = '1';

// WRONG - Missing null check
const currentLabel = data.find(...).association.label;  // May crash

// WRONG - Inconsistent ID usage
id: item.policyId  // Should use association.id when available
```

### Do
```tsx
// CORRECT - Error handling with logging
const handleRename = async (newLabel: string) => {
  try {
    await updateAssociation.mutateAsync({ ... });
    handleCloseRename();
  } catch (error) {
    console.error('[PageName] Failed to rename:', error);
  }
};

// CORRECT - Use mock constant
const userId = MOCK_USER_ID.toString();

// CORRECT - Null-safe access
const currentLabel = renamingItem?.association.label || `Policy #${renamingItem?.association.policyId}`;

// CORRECT - Prefer user association ID, fallback to base ID
id: item.association.id?.toString() || item.association.policyId.toString()
```
