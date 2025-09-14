export interface ReportOutputSocietyWideByConstituency {
  [constituencyName: string]: {
    average_household_income_change: number;
    relative_household_income_change: number;
    x: number;
    y: number;
  };
}
