import { Parameter } from '@/types/subIngredients/parameter';

export enum PolicyDisplayMode {
  CREATE = 'create',
  SELECT_PARAMETERS = 'select_parameters',
  SUBMIT = 'submit',
}

export interface PolicyPathwayState {
  label: string;
  parameters: Parameter[];
  countryId: string;
  position: number;
}
