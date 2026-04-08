import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import { countryIds } from '@/libs/countries';
import type {
  BudgetWindowAnnualImpact,
  BudgetWindowReportOutput,
} from '@/types/report/BudgetWindowReportOutput';

export const BUDGET_WINDOW_SUBPAGE = 'budget-window';

export function isBudgetWindowReportOutput(output: unknown): output is BudgetWindowReportOutput {
  return (
    typeof output === 'object' &&
    output !== null &&
    'kind' in output &&
    (output as BudgetWindowReportOutput).kind === 'budgetWindow'
  );
}

export function extractBudgetWindowAnnualImpact(
  year: string,
  output: SocietyWideReportOutput
): BudgetWindowAnnualImpact {
  const stateTaxRevenueImpact = output.budget.state_tax_revenue_impact;
  const taxRevenueImpact = output.budget.tax_revenue_impact;

  return {
    year,
    taxRevenueImpact,
    federalTaxRevenueImpact: taxRevenueImpact - stateTaxRevenueImpact,
    stateTaxRevenueImpact,
    benefitSpendingImpact: output.budget.benefit_spending_impact,
    budgetaryImpact: output.budget.budgetary_impact,
  };
}

export function sumBudgetWindowAnnualImpacts(
  annualImpacts: BudgetWindowAnnualImpact[]
): BudgetWindowAnnualImpact {
  return annualImpacts.reduce<BudgetWindowAnnualImpact>(
    (totals, annualImpact) => ({
      year: 'Total',
      taxRevenueImpact: totals.taxRevenueImpact + annualImpact.taxRevenueImpact,
      federalTaxRevenueImpact:
        totals.federalTaxRevenueImpact + annualImpact.federalTaxRevenueImpact,
      stateTaxRevenueImpact: totals.stateTaxRevenueImpact + annualImpact.stateTaxRevenueImpact,
      benefitSpendingImpact: totals.benefitSpendingImpact + annualImpact.benefitSpendingImpact,
      budgetaryImpact: totals.budgetaryImpact + annualImpact.budgetaryImpact,
    }),
    {
      year: 'Total',
      taxRevenueImpact: 0,
      federalTaxRevenueImpact: 0,
      stateTaxRevenueImpact: 0,
      benefitSpendingImpact: 0,
      budgetaryImpact: 0,
    }
  );
}

export function getBudgetWindowMetricLabels(countryId: (typeof countryIds)[number]) {
  return {
    federalTax: countryId === 'us' ? 'Federal tax revenue' : 'Tax revenue',
    stateTax: countryId === 'us' ? 'State and local tax revenue' : 'State tax revenue',
    benefits: 'Benefit spending',
    netBudget: 'Net budget impact',
  };
}
