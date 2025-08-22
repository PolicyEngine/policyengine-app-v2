import { ModernHousehold } from './household';
import { HouseholdData } from './householdMetadata';

// Models the POST household api payload
export interface HouseholdCreationPayload {
  data: HouseholdData;
}

/**
 * Convert new domain structure into full nested API payload
 */
export function serializeHouseholdCreationPayload(
  household: ModernHousehold
): HouseholdCreationPayload {
  const { taxYear, maritalStatus, householdInfo, adults, children } = household;

  // Helper to wrap a value in { [taxYear]: value }
  const wrapValue = <T>(value: T): Record<string, T> => ({ [taxYear]: value });

  // Build people object
  const people: HouseholdData['people'] = {
    you: {
      age: wrapValue(parseInt(adults.primary.age, 10) || 0),
      employment_income: wrapValue(parseFloat(adults.primary.employment_income) || 0),
    },
  };

  // Add spouse if married
  if (maritalStatus === 'married' && adults.spouse) {
    people['your partner'] = {
      age: wrapValue(parseInt(adults.spouse.age, 10) || 0),
      employment_income: wrapValue(parseFloat(adults.spouse.employment_income) || 0),
    };
  }

  // Add children as dependents
  children.forEach((child, idx) => {
    people[`your ${ordinal(idx + 1)} dependent`] = {
      age: wrapValue(parseInt(child.age, 10) || 0),
      employment_income: wrapValue(parseFloat(child.employment_income) || 0),
      is_tax_unit_dependent: wrapValue(true),
    };
  });

  // Get all member keys
  const allMemberKeys = Object.keys(people);
  const adultKeys = maritalStatus === 'married' ? ['you', 'your partner'] : ['you'];

  // Build families
  const families: HouseholdData['families'] = {
    'your family': {
      members: allMemberKeys,
    },
  };

  // Build marital units
  const marital_units: HouseholdData['marital_units'] = {
    'your marital unit': {
      members: adultKeys,
    },
  };

  // Each child has own marital unit
  children.forEach((_, idx) => {
    marital_units[`your ${ordinal(idx + 1)} dependent's marital unit`] = {
      members: [`your ${ordinal(idx + 1)} dependent`],
      marital_unit_id: wrapValue(1),
    };
  });

  // Build tax_units (all members together)
  const tax_units: HouseholdData['tax_units'] = {
    'your tax unit': {
      members: allMemberKeys,
    },
  };

  // Build spm_units (all members together)
  const spm_units: HouseholdData['spm_units'] = {
    'your household': {
      members: allMemberKeys,
    },
  };

  // Build households with dynamic household-level fields
  const householdData: any = {
    members: allMemberKeys,
  };

  // Add all household-level fields from householdInfo
  Object.entries(householdInfo).forEach(([field, value]) => {
    if (value && value.trim()) {
      householdData[field] = wrapValue(value);
    }
  });

  const households: HouseholdData['households'] = {
    'your household': householdData,
  };

  // Build final payload structure
  const payload: HouseholdData = {
    people,
    families,
    marital_units,
    tax_units,
    spm_units,
    households,
  };

  // Add benunits for UK structure (if married)
  if (maritalStatus === 'married') {
    (payload as any).benunits = {
      'your immediate family': {
        members: allMemberKeys,
        is_married: wrapValue(true),
      },
    };
  }

  return { data: payload };
}

// Helper: converts numbers to ordinals like first, second, third, etc.
function ordinal(n: number): string {
  const ordinals = ['first', 'second', 'third', 'fourth', 'fifth'];
  if (n <= ordinals.length) {
    return ordinals[n - 1];
  }
  return `${n}th`;
}
