# Frontend Conventions - Value Formatting

This document describes the standard conventions for formatting values throughout the PolicyEngine frontend application.

## Core Formatting Utilities

All value formatting utilities are located in `app/src/utils/formatters.ts`. This is the **single source of truth** for all formatting logic.

### Key Principles

1. **Always use centralized utilities** - Never write inline formatting logic
2. **Look up metadata when available** - Use parameter/variable metadata to determine the correct unit
3. **Prefer higher-level utilities** - Use the most specific utility for your use case

## Available Utilities

### 1. `formatValueByUnit()` - The Canonical Formatter

The lowest-level formatter that handles all unit types. Use this when you already know the unit.

```typescript
import { formatValueByUnit } from '@/utils/formatters';

// Currency
formatValueByUnit(1000, 'currency-USD', 'us'); // "$1,000"
formatValueByUnit(1500, 'currency-GBP', 'uk'); // "£1,500"

// Percentage
formatValueByUnit(0.15, '/1', 'us'); // "15%"

// Boolean
formatValueByUnit(true, 'bool', 'us'); // "True"
formatValueByUnit(false, 'bool', 'us'); // "False"

// Options
formatValueByUnit(1234.56, 'currency-USD', 'us', {
  decimalPlaces: 2,      // Force specific precision
  includeSymbol: false,  // Omit currency symbol
});
```

### 2. `formatParameterValueFromMetadata()` - For Parameters

**Use this when formatting parameter values** - it automatically looks up the parameter's unit from metadata.

```typescript
import { formatParameterValueFromMetadata } from '@/utils/formatters';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

function MyComponent() {
  const parameters = useSelector((state: RootState) => state.metadata.parameters);
  const countryId = useCurrentCountry();

  // Automatically determines the correct unit from metadata
  const formatted = formatParameterValueFromMetadata(
    'gov.irs.credits.eitc.max[0]',  // parameter name
    1000,                             // value
    parameters,                       // metadata from Redux
    countryId                         // country for locale
  );

  return <div>{formatted}</div>;
}
```

**When to use:**
- PolicySubmitFrame (when displaying parameter values)
- Any component that displays parameter values and has access to Redux metadata
- Report pages that show parameter comparisons

### 3. `formatVariableValueSigned()` / `formatVariableValueAbsolute()` - For Variables

For household/individual variables, use these functions from `app/src/utils/householdValues.ts`:

```typescript
import { formatVariableValueSigned, formatVariableValueAbsolute } from '@/utils/householdValues';

// When you need to show positive/negative values (e.g., income changes)
formatVariableValueSigned(variable, -500, 'us', 0); // "-$500"

// When you want magnitude only (e.g., household totals)
formatVariableValueAbsolute(variable, -500, 'us', 0); // "$500"
```

**Note:** The `Math.abs()` behavior in `formatVariableValueAbsolute` is intentional - household displays traditionally show magnitude only.

## Unit Type Helpers

The following helper functions check unit types:

```typescript
import {
  isCurrencyUnit,
  isPercentageUnit,
  isBooleanUnit,
  getCurrencySymbolFromUnit,
  getCountryFromUnit
} from '@/utils/formatters';

isCurrencyUnit('currency-USD');        // true
isPercentageUnit('/1');                // true
isBooleanUnit('bool');                 // true
getCurrencySymbolFromUnit('currency-GBP'); // "£"
getCountryFromUnit('currency-USD');    // "us"
```

**Use these instead of hardcoding unit checks!**

### Bad (Don't Do This)
```typescript
// ❌ Hardcoded arrays
const USD_UNITS = ['currency-USD', 'currency_USD', 'USD'];
if (USD_UNITS.includes(param.unit)) { ... }

// ❌ Inline formatting logic
const formatted = `$${value.toLocaleString()}`;

// ❌ Multiple implementations
function formatMoney(val) { return '$' + val; }
```

### Good (Do This)
```typescript
// ✅ Use centralized utilities
if (isCurrencyUnit(param.unit)) { ... }

// ✅ Use canonical formatter
const formatted = formatValueByUnit(value, unit, countryId);

// ✅ Use metadata lookup for parameters
const formatted = formatParameterValueFromMetadata(paramName, value, parameters, countryId);
```

## Unit Constants

All unit type constants are centralized in `formatters.ts`:

```typescript
import { CURRENCY_UNITS, PERCENTAGE_UNITS, BOOLEAN_UNITS } from '@/utils/formatters';

// Available currencies
CURRENCY_UNITS.USD  // ['currency-USD', 'currency_USD', 'USD']
CURRENCY_UNITS.GBP  // ['currency-GBP', 'currency_GBP', 'GBP']
CURRENCY_UNITS.EUR  // ['currency-EUR', 'currency_EUR', 'EUR']
CURRENCY_UNITS.CAD  // ['currency-CAD', 'currency_CAD', 'CAD']
CURRENCY_UNITS.ILS  // ['currency-ILS', 'currency_ILS', 'ILS']
CURRENCY_UNITS.NGN  // ['currency-NGN', 'currency_NGN', 'NGN']

// Percentage unit
PERCENTAGE_UNITS    // ['/1']

// Boolean units
BOOLEAN_UNITS       // ['bool', 'abolition']
```

## Decision Tree: Which Formatter Should I Use?

```
Are you formatting a parameter value?
├─ YES: Do you have access to parameter metadata?
│  ├─ YES: Use formatParameterValueFromMetadata()
│  └─ NO: Use formatValueByUnit() with known/assumed unit
│
└─ NO: Are you formatting a variable value?
   ├─ YES: Do you need to preserve sign?
   │  ├─ YES: Use formatVariableValueSigned()
   │  └─ NO: Use formatVariableValueAbsolute()
   │
   └─ NO: Use formatValueByUnit() with the appropriate unit
```

## Common Patterns

### Pattern 1: Formatting in PolicySubmitFrame
```typescript
import { formatParameterValueFromMetadata } from '@/utils/formatters';
import { useSelector } from 'react-redux';

const parameters = useSelector((state: RootState) => state.metadata.parameters);
const formatValue = (paramName: string, value: any) =>
  formatParameterValueFromMetadata(paramName, value, parameters, countryId);
```

### Pattern 2: Formatting in Report Tables
```typescript
import { formatValueByUnit, getCountryFromUnit } from '@/utils/formatters';

const countryId = getCountryFromUnit(param.unit) || 'us';
const formatted = formatValueByUnit(value, param.unit, countryId, { decimalPlaces: 2 });
```

### Pattern 3: Formatting Household Variables
```typescript
import { formatVariableValueSigned } from '@/utils/householdValues';

const variable = metadata.variables[variableName];
const formatted = formatVariableValueSigned(variable, value, countryId, precision);
```

## Migration Guide

If you encounter old formatting code, refactor it using these utilities:

### Before
```typescript
const formatValue = (value: any): string => {
  if (typeof value === 'boolean') return value ? 'True' : 'False';
  const numValue = Number(value);
  const currencySymbol = countryId === 'us' ? '$' : '£';
  return `${currencySymbol}${numValue.toLocaleString()}`;
};
```

### After
```typescript
const formatValue = (paramName: string, value: any): string => {
  return formatParameterValueFromMetadata(paramName, value, parameters, countryId);
};
```

## Testing

When writing tests for components that use these formatters, mock the Redux state to include parameter metadata:

```typescript
import { mockParameterMetadata } from '@/tests/fixtures/...';

const store = configureStore({
  reducer: {
    metadata: (state = { parameters: mockParameterMetadata }) => state,
  },
});
```

## Summary

- **Location**: `app/src/utils/formatters.ts` (primary), `app/src/utils/householdValues.ts` (variables)
- **Philosophy**: Single source of truth for all formatting
- **Primary Functions**:
  - `formatParameterValueFromMetadata()` - for parameters with metadata
  - `formatValueByUnit()` - when unit is known
  - `formatVariableValueSigned()` / `formatVariableValueAbsolute()` - for variables
- **Always prefer these utilities over inline formatting logic**
