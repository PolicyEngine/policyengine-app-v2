/**
 * V6-styled value selector components
 */

import { ValueSetterMode } from '@/pathways/report/components/valueSetters';
import { DateValueSelectorV6 } from './DateValueSelectorV6';
import { DefaultValueSelectorV6 } from './DefaultValueSelectorV6';
import { MultiYearValueSelectorV6 } from './MultiYearValueSelectorV6';
import { YearlyValueSelectorV6 } from './YearlyValueSelectorV6';

export { DefaultValueSelectorV6 } from './DefaultValueSelectorV6';
export { YearlyValueSelectorV6 } from './YearlyValueSelectorV6';
export { DateValueSelectorV6 } from './DateValueSelectorV6';
export { MultiYearValueSelectorV6 } from './MultiYearValueSelectorV6';

export const ValueSetterComponentsV6 = {
  [ValueSetterMode.DEFAULT]: DefaultValueSelectorV6,
  [ValueSetterMode.YEARLY]: YearlyValueSelectorV6,
  [ValueSetterMode.DATE]: DateValueSelectorV6,
  [ValueSetterMode.MULTI_YEAR]: MultiYearValueSelectorV6,
} as const;
