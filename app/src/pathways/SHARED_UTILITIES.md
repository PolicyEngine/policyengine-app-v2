# Shared Pathway Utilities

This document describes the shared utilities created to enable code reuse across Report, Simulation, Policy, and Population pathways.

## Overview

The pathway system uses a component-based architecture where pathways orchestrate state management and navigation, while views handle presentation and user interaction. These utilities eliminate duplication by providing reusable building blocks.

## 📁 Directory Structure

```
app/src/
├── hooks/
│   └── usePathwayNavigation.ts          # Navigation state management
├── types/pathwayModes/
│   ├── SharedViewModes.ts               # Shared view mode enums
│   └── ReportViewMode.ts                # Composes shared modes
├── utils/
│   ├── pathwayCallbacks/                # Callback factories
│   │   ├── index.ts
│   │   ├── policyCallbacks.ts
│   │   ├── populationCallbacks.ts
│   │   ├── simulationCallbacks.ts
│   │   └── reportCallbacks.ts
│   ├── ingredientReconstruction/        # API data reconstruction
│   │   ├── index.ts
│   │   ├── reconstructSimulation.ts
│   │   ├── reconstructPolicy.ts
│   │   └── reconstructPopulation.ts
│   └── validation/                      # Ingredient validation utilities
│       └── ingredientValidation.ts      # Configuration state validation
└── pathways/
    └── report/
        └── views/                        # Fully reusable view components
            ├── simulation/
            ├── policy/
            └── population/
```

## 🎯 1. Shared View Components

**Location**: `app/src/pathways/report/views/`

All view components are already fully reusable across pathways:

### Simulation Views

- `SimulationLabelView` - Label entry
- `SimulationSetupView` - Policy/population setup coordination
- `SimulationSubmitView` - API submission
- `SimulationPolicySetupView` - Policy selection coordinator
- `SimulationPopulationSetupView` - Population selection coordinator

### Policy Views

- `PolicyLabelView` - Label entry
- `PolicyParameterSelectorView` - Parameter modification
- `PolicySubmitView` - API submission
- `PolicyExistingView` - Load existing policy

### Population Views

- `PopulationScopeView` - Household vs geography selection
- `PopulationLabelView` - Label entry
- `HouseholdBuilderView` - Custom household creation
- `GeographicConfirmationView` - Geography confirmation
- `PopulationExistingView` - Load existing population

**Usage**: Import directly into any pathway wrapper.

## ✅ 2. Ingredient Validation Utilities

**Location**: `app/src/utils/validation/ingredientValidation.ts`

**Purpose**: Provides validation functions to determine if ingredients are fully configured and ready for use. Replaces the deprecated `isCreated` flag pattern with ID-based validation.

### Key Functions

#### `isPolicyConfigured(policy: PolicyStateProps | null | undefined): boolean`

Checks if a policy is configured by verifying it has an ID. A policy gets an ID when:

- User creates custom policy and submits to API
- User selects current law (ID = currentLawId)
- User loads existing policy from database

```typescript
import { isPolicyConfigured } from '@/utils/validation/ingredientValidation';

if (isPolicyConfigured(policy)) {
  // Policy is ready to use
}
```

#### `isPopulationConfigured(population: PopulationStateProps | null | undefined): boolean`

Checks if a population is configured by verifying it has either a household ID or geography ID.

```typescript
import { isPopulationConfigured } from '@/utils/validation/ingredientValidation';

if (isPopulationConfigured(population)) {
  // Population is ready to use
}
```

#### `isSimulationConfigured(simulation: SimulationStateProps | null | undefined): boolean`

Checks if a simulation is configured by checking:

1. If simulation has an ID (fully persisted), OR
2. If both policy and population are configured (ready to submit)

```typescript
import { isSimulationConfigured } from '@/utils/validation/ingredientValidation';

if (isSimulationConfigured(simulation)) {
  // Simulation is either persisted or ready to submit
}
```

#### Additional Utilities

- `isSimulationReadyToSubmit(simulation)` - Specifically checks if ingredients are ready for submission
- `isSimulationPersisted(simulation)` - Specifically checks if simulation has database ID

### Benefits

- **Single Source of Truth**: Configuration state is determined by ID presence, not a separate flag
- **No Stale State**: Copy/prefill operations automatically work correctly (IDs are copied with data)
- **Clear Semantics**: Function names explicitly state what they check
- **Type Safe**: Handles null/undefined gracefully

**Note**: The `isCreated` flag has been removed from all StateProps interfaces. Use these validation functions instead.

## 🔧 3. Callback Factories

**Location**: `app/src/utils/pathwayCallbacks/`

Factory functions that generate reusable callbacks for state management.

### `createPolicyCallbacks<TState, TMode>`

**Parameters**:

- `setState`: State setter function
- `policySelector`: Extract policy from state
- `policyUpdater`: Update policy in state
- `navigateToMode`: Navigation function
- `returnMode`: Mode to return to after completion

**Returns**:

```typescript
{
  updateLabel: (label: string) => void
  updatePolicy: (policy: PolicyStateProps) => void
  handleSelectCurrentLaw: (lawId: number, label?: string) => void
  handleSelectExisting: (id: string, label: string, params: Parameter[]) => void
  handleSubmitSuccess: (policyId: string) => void
}
```

**Example**:

```typescript
const policyCallbacks = createPolicyCallbacks(
  setState,
  (state) => state.policy,
  (state, policy) => ({ ...state, policy }),
  navigateToMode,
  SimulationViewMode.SIMULATION_SETUP
);
```

### `createPopulationCallbacks<TState, TMode>`

**Parameters**:

- `setState`: State setter function
- `populationSelector`: Extract population from state
- `populationUpdater`: Update population in state
- `navigateToMode`: Navigation function
- `returnMode`: Mode to return to after completion
- `labelMode`: Mode to navigate to for labeling

**Returns**:

```typescript
{
  updateLabel: (label: string) => void
  handleScopeSelected: (geography: Geography | null, scopeType: string) => void
  handleSelectExistingHousehold: (id: string, household: Household, label: string) => void
  handleSelectExistingGeography: (id: string, geography: Geography, label: string) => void
  handleHouseholdSubmitSuccess: (id: string, household: Household) => void
  handleGeographicSubmitSuccess: (id: string, label: string) => void
}
```

### `createSimulationCallbacks<TState, TMode>`

**Parameters**:

- `setState`: State setter function
- `simulationSelector`: Extract simulation from state
- `simulationUpdater`: Update simulation in state
- `navigateToMode`: Navigation function
- `returnMode`: Mode to return to after completion

**Returns**:

```typescript
{
  updateLabel: (label: string) => void
  handleSubmitSuccess: (simulationId: string) => void
  handleSelectExisting: (enhancedSimulation: EnhancedUserSimulation) => void
}
```

### `createReportCallbacks<TMode>`

**Parameters**:

- `setState`: State setter function for report state
- `navigateToMode`: Navigation function
- `activeSimulationIndex`: Currently active simulation (0 or 1)
- `simulationSelectionMode`: Mode to navigate to for simulation selection
- `setupMode`: Mode to return to after operations (typically REPORT_SETUP)

**Returns**:

```typescript
{
  updateLabel: (label: string) => void
  navigateToSimulationSelection: (simulationIndex: 0 | 1) => void
  handleSelectExistingSimulation: (enhancedSimulation: EnhancedUserSimulation) => void
  copyPopulationFromOtherSimulation: () => void
  prefillPopulation2FromSimulation1: () => void
}
```

**Example**:

```typescript
const reportCallbacks = createReportCallbacks(
  setReportState,
  navigateToMode,
  activeSimulationIndex,
  ReportViewMode.REPORT_SELECT_SIMULATION,
  ReportViewMode.REPORT_SETUP
);
```

## 🧭 3. Navigation Hook

**Location**: `app/src/hooks/usePathwayNavigation.ts`

**Purpose**: Manages pathway navigation state with history tracking.

**Type Parameters**: `<TMode>` - The enum type for view modes

**Returns**:

```typescript
{
  currentMode: TMode
  setCurrentMode: (mode: TMode) => void
  navigateToMode: (mode: TMode) => void
  goBack: () => void
  resetNavigation: (mode: TMode) => void
  history: TMode[]
  canGoBack: boolean
}
```

**Example**:

```typescript
const { currentMode, navigateToMode, goBack } = usePathwayNavigation(
  SimulationViewMode.SIMULATION_LABEL
);
```

## 🔄 4. Ingredient Reconstruction

**Location**: `app/src/utils/ingredientReconstruction/`

Utilities to convert API/enhanced data into StateProps format.

### `reconstructSimulationFromEnhanced(enhancedSimulation)`

Converts `EnhancedUserSimulation` → `SimulationStateProps`

**Features**:

- Reconstructs nested policy from `enhancedSimulation.policy`
- Reconstructs nested population from household or geography
- Handles populationType detection
- Sets `isCreated: true` for all nested ingredients

### `reconstructPolicyFromJson(policyId, label, policyJson)`

Converts `policy_json` format → `PolicyStateProps`

**Features**:

- Converts object notation to `Parameter[]` array
- Handles value interval formatting
- Normalizes date fields (start/startDate, end/endDate)

### `reconstructPolicyFromParameters(policyId, label, parameters)`

Direct conversion when parameters are already in correct format.

### `reconstructPopulationFromHousehold(id, household, label)`

Converts household data → `PopulationStateProps`

### `reconstructPopulationFromGeography(id, geography, label)`

Converts geography data → `PopulationStateProps`

## 🎨 5. Shared View Modes

**Location**: `app/src/types/pathwayModes/SharedViewModes.ts`

Defines common view modes used across multiple pathways.

### Enums

```typescript
enum PolicyViewMode {
  POLICY_LABEL
  POLICY_PARAMETER_SELECTOR
  POLICY_SUBMIT
  SELECT_EXISTING_POLICY
  SETUP_POLICY
}

enum PopulationViewMode {
  POPULATION_SCOPE
  POPULATION_LABEL
  POPULATION_HOUSEHOLD_BUILDER
  POPULATION_GEOGRAPHIC_CONFIRM
  SELECT_EXISTING_POPULATION
  SETUP_POPULATION
}

enum SimulationViewMode {
  SIMULATION_LABEL
  SIMULATION_SETUP
  SIMULATION_SUBMIT
}
```

### Type Guards

- `isPolicyMode(mode: string): mode is PolicyViewMode`
- `isPopulationMode(mode: string): mode is PopulationViewMode`
- `isSimulationMode(mode: string): mode is SimulationViewMode`

### Usage in Pathway Modes

Compose pathway-specific enums using shared modes:

```typescript
export enum SimulationViewMode {
  // Simulation-specific
  SIMULATION_LABEL = SharedViewMode.SIMULATION_LABEL,
  SIMULATION_SETUP = SharedViewMode.SIMULATION_SETUP,
  SIMULATION_SUBMIT = SharedViewMode.SIMULATION_SUBMIT,

  // Compose policy modes
  POLICY_LABEL = PolicyViewMode.POLICY_LABEL,
  // ... etc

  // Compose population modes
  POPULATION_SCOPE = PopulationViewMode.POPULATION_SCOPE,
  // ... etc
}
```

## 📋 Creating a New Pathway

To create a new pathway (e.g., `SimulationPathwayWrapper`):

### 1. Import Shared Utilities

```typescript
import { usePathwayNavigation } from '@/hooks/usePathwayNavigation';
// Import reusable views
import SimulationLabelView from '@/pathways/report/views/simulation/SimulationLabelView';
import SimulationSetupView from '@/pathways/report/views/simulation/SimulationSetupView';
import {
  PolicyViewMode,
  PopulationViewMode,
  SimulationViewMode,
} from '@/types/pathwayModes/SharedViewModes';
import {
  createPolicyCallbacks,
  createPopulationCallbacks,
  createReportCallbacks, // Only for report pathways
  createSimulationCallbacks,
} from '@/utils/pathwayCallbacks';

// ... etc
```

### 2. Define State Management

```typescript
const [simulationState, setSimulationState] = useState<SimulationStateProps>(() =>
  initializeSimulationState(countryId)
);

const { currentMode, navigateToMode } = usePathwayNavigation(SimulationViewMode.SIMULATION_LABEL);
```

### 3. Create Callbacks Using Factories

```typescript
const policyCallbacks = createPolicyCallbacks(
  setSimulationState,
  (state) => state.policy,
  (state, policy) => ({ ...state, policy }),
  navigateToMode,
  SimulationViewMode.SIMULATION_SETUP
);

const populationCallbacks = createPopulationCallbacks(
  setSimulationState,
  (state) => state.population,
  (state, population) => ({ ...state, population }),
  navigateToMode,
  SimulationViewMode.SIMULATION_SETUP,
  SimulationViewMode.POPULATION_LABEL
);
```

### 4. Implement Switch Statement

```typescript
switch (currentMode) {
  case SimulationViewMode.SIMULATION_LABEL:
    return <SimulationLabelView
      label={simulationState.label}
      onUpdateLabel={(label) => setSimulationState(prev => ({ ...prev, label }))}
      onNext={() => navigateToMode(SimulationViewMode.SIMULATION_SETUP)}
    />;

  case SimulationViewMode.POLICY_LABEL:
    return <PolicyLabelView
      label={simulationState.policy.label}
      onUpdateLabel={policyCallbacks.updateLabel}
      onNext={() => navigateToMode(SimulationViewMode.POLICY_PARAMETER_SELECTOR)}
    />;

  // ... etc
}
```

## 💡 Benefits

1. **~70-80% Code Reduction**: Eliminate duplication across pathways
2. **Type Safety**: Generic type parameters ensure correctness
3. **Maintainability**: Update once, benefit everywhere
4. **Consistency**: Same UX patterns across all pathways
5. **Testability**: Test utilities once, reuse everywhere
6. **Flexibility**: Each pathway maintains independent state management

## 🔍 Best Practices

1. **Use Callback Factories**: Don't duplicate state update logic
2. **Compose View Modes**: Use shared enums where possible
3. **Use Reconstruction Utilities**: Don't manually map API data
4. **Leverage Navigation Hook**: Don't manually manage mode state
5. **Import Views Directly**: Views are already reusable, no need to wrap them

## 🚀 Next Steps

With these utilities in place, creating new pathways becomes straightforward:

1. Define pathway-specific state type (or use existing)
2. Compose view mode enum using shared modes
3. Initialize state with appropriate initializer
4. Create callbacks using factories
5. Wire up views in switch statement
6. Handle pathway-specific logic only

The heavy lifting is done by shared utilities.
