import type { HouseholdScalar } from './appTypes';

export interface PythonPackageHouseholdData {
  people: Record<string, PythonPackageHouseholdPersonData>;
  families?: Record<string, PythonPackageHouseholdGroupData>;
  tax_units?: Record<string, PythonPackageHouseholdGroupData>;
  spm_units?: Record<string, PythonPackageHouseholdGroupData>;
  households?: Record<string, PythonPackageHouseholdGroupData>;
  marital_units?: Record<string, PythonPackageHouseholdGroupData>;
  benunits?: Record<string, PythonPackageHouseholdGroupData>;
}

export interface PythonPackageHouseholdPersonData {
  [key: string]: Record<string, HouseholdScalar> | undefined;
}

export interface PythonPackageHouseholdMemberGroup {
  members: string[];
}

export interface PythonPackageHouseholdGroupProperties {
  [key: string]: Record<string, HouseholdScalar> | undefined;
}

export type PythonPackageHouseholdGroupData = PythonPackageHouseholdMemberGroup & {
  [key: string]: Record<string, HouseholdScalar> | string[] | undefined;
};

export interface PythonPackageHouseholdVariationAxis {
  name: string;
  period: string;
  min: number;
  max: number;
  count: number;
}

export type PythonPackageHouseholdWithAxes = PythonPackageHouseholdData & {
  axes: PythonPackageHouseholdVariationAxis[][];
};

export type PythonPackageHouseholdSituation = PythonPackageHouseholdData & {
  axes?: PythonPackageHouseholdVariationAxis[][];
};
