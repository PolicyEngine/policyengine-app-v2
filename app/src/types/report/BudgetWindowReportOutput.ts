export interface BudgetWindowAnnualImpact {
  year: string;
  taxRevenueImpact: number;
  federalTaxRevenueImpact: number;
  stateTaxRevenueImpact: number;
  benefitSpendingImpact: number;
  budgetaryImpact: number;
}

export interface BudgetWindowReportOutput {
  kind: 'budgetWindow';
  startYear: string;
  endYear: string;
  windowSize: number;
  annualImpacts: BudgetWindowAnnualImpact[];
  totals: BudgetWindowAnnualImpact;
}
