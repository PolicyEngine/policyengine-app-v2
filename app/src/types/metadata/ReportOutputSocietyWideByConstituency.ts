export interface ReportOutputSocietyWideByConstituency {
  [constituencyName: string]: {
    average_household_income_change: number;
    relative_household_income_change: number;
    x: number;
    y: number;
    /** The ONS code (e.g. W07000081), when the API's list shape gave one. */
    code?: string;
  };
}
