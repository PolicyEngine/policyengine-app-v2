import { Parameter } from './parameter';

export interface Policy {
  label?: string;
  params: Parameter[];
}
