import { Dispatch, SetStateAction } from 'react';
import { ParameterMetadata } from '@/types/metadata/parameterMetadata';
import { Parameter } from '@/types/subIngredients/parameter';
import { ValueInterval } from '@/types/subIngredients/valueInterval';

export enum ValueSetterMode {
  DEFAULT = 'default',
  YEARLY = 'yearly',
  DATE = 'date',
  MULTI_YEAR = 'multi-year',
}

export interface ValueSetterContainerProps {
  param: ParameterMetadata;
  currentParameters: Parameter[];
  onParameterAdd: (name: string, valueInterval: ValueInterval) => void;
}

export interface ValueSetterProps {
  minDate: string;
  maxDate: string;
  param: ParameterMetadata;
  currentParameters: Parameter[];
  intervals: ValueInterval[];
  setIntervals: Dispatch<SetStateAction<ValueInterval[]>>;
  startDate: string;
  setStartDate: Dispatch<SetStateAction<string>>;
  endDate: string;
  setEndDate: Dispatch<SetStateAction<string>>;
}

export interface ValueInputBoxProps {
  label?: string;
  param: ParameterMetadata;
  value?: any;
  onChange?: (value: any) => void;
}
