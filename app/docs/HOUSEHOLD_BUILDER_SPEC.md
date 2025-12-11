# Household Builder Redo - Background & Specification

## Background

### What V2 Currently Shows

The HouseholdBuilderFrame in V2 (`app/src/frames/population/HouseholdBuilderFrame.tsx`) displays a minimal set of fields for creating a household:

**Structural Controls:**

- Tax Year (dropdown: 2020-2035)
- Marital Status (single/married)
- Number of Children (0-5)

**Variable Inputs from basicInputs:**
Currently, US metadata defines `basicInputs = ["state_name", "employment_income", "age"]`. The frame displays:

1. Location & Geographic Information section
   - State Name (dropdown)

2. Adults section (for "you" and optionally "your partner")
   - Age (number input, hardcoded)
   - Employment Income (currency input, hardcoded)

3. Children section (if numChildren > 0)
   - Age per child (number input, hardcoded)
   - Employment Income per child (currency input, hardcoded)

**Key Implementation Detail:** Age and employment_income are hardcoded in the rendering logic (lines 443-565) rather than dynamically rendered from basicInputs. Only state_name is rendered dynamically from basicInputFields.household (lines 380-415).

### What V1 Showed

V1's household builder provided two modes:

**1. Guided Basic Mode:**
Similar to V2 - marital status, children count, age, employment income, and state selection.

**2. Variable Editor Mode:**
V1 included a VariableEditor component (`src/pages/household/input/VariableEditor.jsx`) that allowed users to:

- Edit ANY variable from metadata, not just basicInputs
- Navigate to specific variables via URL search params (e.g., `?focus=householdOutput.snap_gross_income`)
- Automatically detect and render inputs for the correct entity type
- Add values for custom variables like:
  - SNAP income components (snap_gross_income, snap_assets)
  - Disability status (is_disabled, is_blind, ssi)
  - Other income sources (self_employment_income, social_security, pension_income)
  - Tax-related variables (is_tax_unit_dependent, ctc_qualifying_child)

The VariableEditor intelligently resolved which entity a variable belonged to by reading `metadata.entities[variable.entity].plural` and rendered inputs for each applicable entity instance (e.g., for each person, each tax unit, etc.).

### Why We Need to Redo V2's Builder

There are two primary drivers for the household builder redo:

**1. Entity Resolution Bug (Line 389)**

The current V2 implementation has a critical bug in how it handles non-person variables. In `renderHouseholdFields()` at line 389:

```
const fieldValue = household.householdData.households?.['your household']?.[field]?.[taxYear]
```

This line assumes ALL fields in `basicInputFields.household` belong to the "households" entity. This assumption is incorrect.

**How Variables and Entities Work:**

- Each variable in metadata belongs to exactly ONE entity type (person, household, tax_unit, spm_unit, family, marital_unit, benunit)
- Variables are defined with `"entity": "person"` or `"entity": "tax_unit"` etc. in metadata
- The household data structure stores variables under their entity's plural form:
  - Person-level: `householdData.people["you"].age`
  - Household-level: `householdData.households["your household"].state_name`
  - Tax unit-level: `householdData.taxUnits["your tax unit"].eitc`
  - SPM unit-level: `householdData.spmUnits["your household"].snap_gross_income`

**The Bug:**
In metadataUtils.ts (line 53), the code categorizes fields as:

```
const householdFields = inputs.filter(field => !['age', 'employment_income'].includes(field))
```

This hardcodes that age and employment_income are person-level, and assumes EVERYTHING ELSE is household-level. This is wrong.

**Real-World Failure Scenario:**
If basicInputs included `["age", "employment_income", "state_name", "eitc"]`:

- eitc belongs to tax_unit entity (not household)
- Current code would try to read: `householdData.households["your household"].eitc`
- Correct location is: `householdData.taxUnits["your tax unit"].eitc`
- User enters EITC = $1500
- Value gets saved to households entity instead of taxUnits entity
- API receives malformed data with EITC in wrong entity
- PolicyEngine calculation doesn't see EITC value for tax unit
- Report shows EITC = $0 even though user entered $1500
- **Result: Incorrect policy impact calculations with no error message**

**2. Need for Custom Variable Support**

PolicyEngine's accuracy improves significantly when users provide more detailed inputs beyond the basic three variables. Currently, V2 has no mechanism for users to specify these (Income Sources, Benefits & Assistance, etc)

**Why This Matters:**

- With basic inputs only: PolicyEngine **estimates** benefit eligibility and amounts based on income/age/state
- With custom inputs: PolicyEngine **calculates exactly** based on actual income sources, benefit receipt, and eligibility factors
- More accurate custom variables = more accurate policy impact analysis
- Critical for users analyzing specific household situations (e.g., "How does this reform affect households receiving both SNAP and SSI?")

### What We Want to Build

The household builder redo will fix the entity resolution bug by removing hardcoded assumptions and dynamically resolving entity types from metadata. All variables will be correctly read from and written to their appropriate entity locations (person, household, tax_unit, spm_unit, etc.) using entity-aware getters and setters. Beyond fixing the bug, we'll enable custom variable support, allowing users to specify values for any relevant variable through an intuitive "Advanced Settings" section with categorized inputs. The solution will maintain usability with a simple default mode for basic users while providing power users the precision they need, all while ensuring correctness through metadata-driven validation and proper API payload generation.

## Implementation Plan

**1. Create VariableResolver utility** (`app/src/utils/VariableResolver.ts`)

- `resolveEntity(variableName, metadata)` - Get entity info for variable
- `getValue(household, variableName, metadata, year, personName?)` - Read from correct entity location
- `setValue(household, variableName, value, metadata, year, personName?)` - Write to correct entity location
- `getGroupName(entityPlural, personName?)` - Map entity type to group instance name

**2. Fix field categorization** (`app/src/libs/metadataUtils.ts`)

- Remove hardcoded `['age', 'employment_income']` assumptions
- Categorize fields by `metadata.variables[field].entity`
- Return `{ person: [...], household: [...], taxUnit: [...], spmUnit: [...] }`

**3. Update HouseholdBuilderFrame** (`app/src/frames/population/HouseholdBuilderFrame.tsx`)

- Replace line 389 with `VariableResolver.getValue`
- Replace `handleHouseholdFieldChange` to use `VariableResolver.setValue`
- Render fields for all entity types, not just households

**4. Create VariableInput component** (`app/src/components/household/VariableInput.tsx`)

- Render NumberInput, Select, Checkbox, or TextInput based on `variable.valueType`
- Apply formatting from `getInputFormattingProps`
- Use VariableResolver for getting/setting values

**5. Add custom variables UI**

- Collapsible "Advanced Settings" section in HouseholdBuilderFrame
- Search bar + categorized browser for variable selection
- Render selected variables with entity-aware inputs

**6. Testing**

- Test entity resolution with variables from different entities
- Verify payload generation for household creation
- Test UI flow for basic and custom variable entry

## UI Design

**Chosen Design: Inline Search with Stacked Variables**

After evaluating multiple approaches, we chose a simple inline search with variables stacking above the search bar. This design mirrors V1's flat dropdown approach while providing better visual feedback.

**Layout Structure:**

```
▼ Advanced Settings
  ─────────────────────────────────────
  [Selected variables stack here, oldest at top]

  Employment Income ⓘ              [✕]
    You: [$50,000]
    Your partner: [$30,000]

  Utilities Included in Rent ⓘ     [✕]
    Your tax unit: [Yes]

  ─────────────────────────────────────
  ┌─────────────────────────────────────┐
  │ 🔍 Search for a variable...         │
  └─────────────────────────────────────┘
  [Dropdown appears on focus with flat list]
```

**Why This Design:**

We explored several alternatives before settling on this approach:

1. **"Add Variable" button with separate input mode** - Required clicking "Add another variable" after each selection. This created confusion about where the current variable's inputs appeared vs previously added ones, and the UI jumped between search and input modes unpredictably.

2. **Categorized accordion browser** - While good for discoverability, nested accordions added visual complexity. With 3,000+ variables, even categorized lists become unwieldy. Power users prefer direct search.

3. **Modal variable selector** - Added unnecessary friction (extra click to open, context switch away from form). Users can't see existing inputs while selecting new variables.

**The chosen inline approach is simplest because:**

- Single interaction pattern: click search → select variable → input appears above
- Variables stack in order added, newest closest to search (natural reading flow)
- Search bar always visible at bottom as the "add more" action
- No mode switching or "Add another" buttons
- User can see all selected variables and their values at once
- Matches V1's familiar flat dropdown pattern

**Design Elements:**

- Mantine `TextInput` with search icon, dropdown appears on focus
- Flat list of variables filtered as user types (like V1)
- Info icon (ⓘ) on variable labels shows documentation tooltip
- Remove button (✕) to deselect variables
- Entity-aware inputs render per-instance fields (person-level variables show inputs for each person)

**Search Behavior:**

- Show first 50 variables when empty, filter as user types
- Only show `isInputVariable: true` variables (not computed outputs)
- Exclude `hidden_input: true` variables
- Click outside dropdown to close

**Person-Level Custom Variables Placement:**
Custom variables that are person-level (like `self_employment_income`, `is_disabled`) remain in the Advanced Settings section with inputs for each person, NOT merged into the basic inputs Adults section. This keeps a clear separation between essential (basic) and optional (custom) inputs.

## Final Implementation

**Mockup 3 Design (Implemented)**

The household builder now uses Mockup 3's per-person variable assignment pattern:

**Structure:**

- **Household Information Section**: Tax Year, Marital Status, Number of Children
- **Individuals / Members Accordion**:
  - Each person (You, Your Partner, dependents) has their own panel
  - Basic inputs (age, employment_income) shown permanently at top
  - Custom variables added individually per person
  - Inline search with "Add variable to [Person]" link
- **Household Variables Accordion**:
  - Basic household inputs (state_name, etc.) shown permanently at top
  - Custom household-level variables (tax_unit, spm_unit, household, family, marital_unit)
  - Inline search with "Add variable" link

**Key Features:**

1. **Per-Person Variable Assignment**: Custom variables added to specific individuals, not all members
2. **Inline Search Pattern**: Search bar appears on clicking "Add variable" link, disappears after selection
3. **Entity-Aware Resolution**: All variables correctly resolved to their entity (person, tax_unit, spm_unit, household)
4. **Basic Inputs Permanent**: Core inputs like age, employment_income, state_name always visible
5. **Metadata-Driven**: Basic inputs read directly from `metadata.variables` (not filtered by `isInputVariable`)

**Component Architecture:**

- `HouseholdBuilderFrame.tsx`: Redux integration, API calls, flow navigation, household structure management
- `HouseholdBuilderForm.tsx`: Pure presentation component with all UI logic
- `AdvancedSettings.tsx`: Collapsible section for power users (currently unused in Mockup 3)
- `VariableInput.tsx`: Entity-aware input rendering for any variable
- `VariableResolver.ts`: Entity resolution, getValue/setValue utilities

**Mockup History:**
The implementation went through three design iterations:

**Mockup 1: Current Design** - Baseline with Advanced Settings collapsed at bottom

**Mockup 2: Inline Variables (All Members)** - Global search adding variables to all members at once

**Mockup 3: Individual Variable Assignment** - Per-person variable assignment (CHOSEN DESIGN)

Mockup files archived at: `app/src/_archived/household-builder-mockups/`
