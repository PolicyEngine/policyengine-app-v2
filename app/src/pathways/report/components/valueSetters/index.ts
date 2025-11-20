import { DateValueSelector } from './DateValueSelector';
import { DefaultValueSelector } from './DefaultValueSelector';
import { ValueSetterMode } from './ModeSelectorButton';
import { MultiYearValueSelector } from './MultiYearValueSelector';
import { YearlyValueSelector } from './YearlyValueSelector';

export { ModeSelectorButton, ValueSetterMode } from './ModeSelectorButton';
export { getDefaultValueForParam } from './getDefaultValueForParam';
export { ValueInputBox } from './ValueInputBox';
export { DefaultValueSelector } from './DefaultValueSelector';
export { YearlyValueSelector } from './YearlyValueSelector';
export { DateValueSelector } from './DateValueSelector';
export { MultiYearValueSelector } from './MultiYearValueSelector';
export type { ValueSetterProps } from './ValueSetterProps';

export const ValueSetterComponents = {
  [ValueSetterMode.DEFAULT]: DefaultValueSelector,
  [ValueSetterMode.YEARLY]: YearlyValueSelector,
  [ValueSetterMode.DATE]: DateValueSelector,
  [ValueSetterMode.MULTI_YEAR]: MultiYearValueSelector,
} as const;
