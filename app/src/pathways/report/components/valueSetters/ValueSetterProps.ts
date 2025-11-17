import { Dispatch, SetStateAction } from 'react';
import { PolicyStateProps } from '@/types/pathwayState';
import { ParameterMetadata } from '@/types/metadata/parameterMetadata';
import { ValueInterval } from '@/types/subIngredients/valueInterval';

export interface ValueSetterProps {
  minDate: string;
  maxDate: string;
  param: ParameterMetadata;
  policy: PolicyStateProps;
  intervals: ValueInterval[];
  setIntervals: Dispatch<SetStateAction<ValueInterval[]>>;
  startDate: string;
  setStartDate: Dispatch<SetStateAction<string>>;
  endDate: string;
  setEndDate: Dispatch<SetStateAction<string>>;
}
