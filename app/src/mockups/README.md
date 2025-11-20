# Household Builder Mockups

This directory contains mockup components for visual demos without requiring full Redux/API wiring.

## Architecture

### Separation of Concerns

```
┌─────────────────────────────────┐
│  Mock Data Layer                │
│  (householdBuilderMockData.ts)  │
│  - Sample households            │
│  - Mock metadata                │
│  - Form state                   │
└─────────────────┬───────────────┘
                  │
                  ▼
┌─────────────────────────────────┐
│  View Layer                     │
│  (HouseholdBuilderView.tsx)     │
│  - Pure presentation component  │
│  - Accepts data as props        │
│  - Calls callbacks              │
└─────────────────┬───────────────┘
                  │
                  ▼
┌─────────────────────────────────┐
│  Mockup Components              │
│  - Mockup1: Current design      │
│  - Mockup2: Inline variables    │
│  - Uses mock data + view        │
└─────────────────────────────────┘
```

## Files

### Data Layer
- `data/householdBuilderMockData.ts` - Sample data for mockups
  - `mockHouseholdMarriedWithChild` - Married couple with 1 child
  - `mockHouseholdSingle` - Single person
  - `mockMetadata` - Variable and entity metadata
  - `mockAvailableVariables` - Variables for search

### View Layer
- `../components/household/HouseholdBuilderView.tsx` - Pure presentation component
  - No Redux, no hooks (except `useState` within mockups)
  - All data passed as props
  - Reusable across mockups and production

### Mockups
- `HouseholdBuilderMockup1.tsx` - Current design
  - Advanced settings collapsed at bottom
  - Shows existing UX pattern

- `HouseholdBuilderMockup2.tsx` - New inline design
  - Variables grouped by entity (Individuals, Tax Unit, etc.)
  - X buttons to remove per person
  - Search with dropdown
  - Note: Side panel/modal for variable details not fully implemented (noted in UI)

- `index.tsx` - Navigation between mockups

## Usage

To view mockups:

1. Add a route in your routing config:
   ```tsx
   import MockupsIndex from '@/mockups';

   // In routes:
   { path: '/mockups', element: <MockupsIndex /> }
   ```

2. Navigate to `/mockups` to see the list

3. Click buttons to view individual mockups

## Benefits of This Architecture

1. **Fast Iteration**: Change designs without touching Redux/API logic
2. **Easy Demos**: Show stakeholders different designs with realistic data
3. **Reusable Components**: View layer can be used in production
4. **Testable**: Mock data makes it easy to test edge cases
5. **Maintainable**: Clear separation between data, view, and business logic

## Future Production Integration

When ready to use in production:

1. Keep `HouseholdBuilderView` as-is (pure presentation)
2. Create `HouseholdBuilderContainer` that:
   - Connects to Redux
   - Uses hooks (useCreateHousehold, etc.)
   - Passes data to HouseholdBuilderView
3. Mock data can be reused for tests

## Mockup Details

### Mockup 1: Current Design
- Structural controls at top
- Location fields
- Adults section (You, Your Partner)
- Children section
- Advanced Settings (collapsed) with custom variables

### Mockup 2: Inline Variables by Entity

**Layout:**
- Structural controls (Year, Marital Status, Children)
- **Individuals / Members** (boxed section)
  - You, Your Spouse, Children
  - Each shows their variables with [X] buttons
  - Employment Income, Heating cost, etc.
- **Divider**
- **Your Tax Unit** (boxed section)
  - Tax unit level variables with [X] buttons
  - Expenditures on heat pumps, etc.
- **Divider**
- **Search bar** (opens dropdown list)
  - Note: Clicking a variable should open side panel/modal
  - Side panel shows: description, input field, "Add Variable to Household" button

**Key Differences:**
- Variables are inline per entity, not collapsed
- Visual grouping with boxes/borders
- X button removes variable for that person (sets to 0)
- Search opens dropdown, selecting opens side panel (to be implemented)
