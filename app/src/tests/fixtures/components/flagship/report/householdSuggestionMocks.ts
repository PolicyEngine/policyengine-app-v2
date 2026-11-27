import type { VariableInfo } from '@/utils/VariableResolver';

/** Universal Credit's child element: a UK reform's parameter. */
export const UK_CHILD_ELEMENT_PATH = 'gov.dwp.universal_credit.elements.child.amount';

/** The Child Tax Credit's base amount: a US reform's parameter. */
export const US_CTC_BASE_PATH = 'gov.irs.credits.ctc.amount.base';

function ukInput(name: string, entity: string, documentation?: string): VariableInfo {
  return {
    name,
    label: name.replaceAll('_', ' '),
    entity,
    valueType: 'float',
    defaultValue: 0,
    isInputVariable: true,
    hiddenInput: false,
    // The UK model files no input under a module.
    moduleName: '',
    documentation,
  };
}

/**
 * UK inputs as the model's metadata lists them: some a reader describes a
 * household with, and one only the microdata sets (a public-spending
 * imputation), which the household section never suggests.
 */
export const UK_INPUT_VARIABLES: VariableInfo[] = [
  ukInput('age', 'person'),
  ukInput('employment_income', 'person'),
  ukInput('childcare_expenses', 'person'),
  ukInput('is_disabled_for_benefits', 'person'),
  ukInput('rent', 'household'),
  ukInput('region', 'household'),
  ukInput('dfe_education_spending', 'person'),
];

export const UK_HOUSEHOLD_INPUT_NAMES = new Set(
  UK_INPUT_VARIABLES.filter((variable) => variable.name !== 'dfe_education_spending').map(
    (variable) => variable.name
  )
);

/** An input only the microdata sets, which the UK map reaches from the child element. */
export const UK_MICRODATA_ONLY_INPUT = 'dfe_education_spending';
