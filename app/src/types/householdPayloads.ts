import { Household } from './household';
import { HouseholdData } from './householdMetadata';

// Models the POST household api payload
export interface HouseholdCreationPayload {
  data: HouseholdData;
}

/**
 * Convert simple domain Household into full nested API payload
 */
export function serializeHouseholdCreationPayload(household: Household): HouseholdCreationPayload {
  const { taxYear, maritalStatus, children } = household;

  // Helper to wrap a value in { [taxYear]: value }
  const wrapValue = <T>(value: T): Record<string, T> => ({ [taxYear]: value });

  // Build people object:
  // Hardcoded "you" with example data (adjust or extend if you capture these)
  const people: HouseholdData['people'] = {
    you: {
      age: wrapValue(40), // Replace with actual if available
      employment_income: wrapValue(5000), // Replace with actual if available
    },
  };

  // Add partner if married
  if (maritalStatus === 'married') {
    people['your partner'] = {
      age: wrapValue(40), // Replace or extend domain to support editing
    };
  }

  // Add children as dependents
  children.forEach((child, idx) => {
    people[`your ${ordinal(idx + 1)} dependent`] = {
      age: wrapValue(parseInt(child.age, 10) || 0),
      employment_income: wrapValue(parseFloat(child.income) || 0),
      is_tax_unit_dependent: wrapValue(true),
    };
  });

  // Families grouping everyone
  const allMemberKeys = Object.keys(people);
  const families: HouseholdData['families'] = {
    'your family': {
      members: allMemberKeys,
    },
  };

  // Marital units grouping
  const marital_units: HouseholdData['marital_units'] = {
    'your marital unit': {
      members: maritalStatus === 'married' ? ['you', 'your partner'] : ['you'],
    },
  };

  // Each child has own marital unit
  children.forEach((_, idx) => {
    marital_units[`your ${ordinal(idx + 1)} dependent's marital unit`] = {
      members: [`your ${ordinal(idx + 1)} dependent`],
      marital_unit_id: wrapValue(1),
    };
  });

  // tax_units grouping all members
  const tax_units: HouseholdData['tax_units'] = {
    'your tax unit': {
      members: allMemberKeys,
    },
  };

  // spm_units grouping all members
  const spm_units: HouseholdData['spm_units'] = {
    'your household': {
      members: allMemberKeys,
    },
  };

  // households grouping all members and state_name
  const households: HouseholdData['households'] = {
    'your household': {
      members: allMemberKeys,
      state_name: wrapValue('CA'), // TODO: pull from domain if available
    },
  };

  const payload: HouseholdData = {
    people,
    families,
    marital_units,
    tax_units,
    spm_units,
    households,
  };

  return { data: payload };
}

// Helper: converts numbers to ordinals like first, second, third, etc.
function ordinal(n: number): string {
  const ordinals = ['first', 'second', 'third'];
  if (n <= ordinals.length) {
    return ordinals[n - 1];
  }
  return `${n}th`;
}
