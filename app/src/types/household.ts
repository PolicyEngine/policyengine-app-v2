// Legacy interface for backward compatibility
export interface HouseholdChild {
  age: string;
  income: string;
}

// Legacy interface for backward compatibility
export interface Household {
  taxYear: string;
  maritalStatus: 'married' | 'single';
  numChildren: number;
  children: HouseholdChild[];
}

// New interfaces that match our updated structure
export interface PersonInfo {
  age: string;
  employment_income: string;
}

export interface HouseholdInfo {
  [key: string]: string; // Dynamic fields based on basicInputs
}

// Updated household interface that matches the Redux state
export interface ModernHousehold {
  id?: string;
  label?: string;
  isCreated?: boolean;

  // Core household info
  taxYear: string;
  maritalStatus: 'single' | 'married';
  numChildren: number;

  // Dynamic household-level fields (state_name, brma, region, etc.)
  householdInfo: HouseholdInfo;

  // Person-level data
  adults: {
    primary: PersonInfo;
    spouse?: PersonInfo; // Only exists if married
  };
  children: PersonInfo[];

  // Geographic info (for backward compatibility)
  geographicScope?: 'national' | 'state' | 'household' | '';
  region?: string;
  geographicAssociationId?: string;
}
