export interface HouseholdChild {
  age: string;
  income: string;
}

export interface Household {
  taxYear: string;
  maritalStatus: 'married' | 'single';
  numChildren: number;
  children: HouseholdChild[];
}
