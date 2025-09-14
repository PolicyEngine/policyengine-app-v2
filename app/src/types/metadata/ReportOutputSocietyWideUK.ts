import { ReportOutputSocietyWideByConstituency } from './ReportOutputSocietyWideByConstituency';

export interface ReportOutputSocietyWideUK {
  budget: {
    baseline_net_income: number;
    benefit_spending_impact: number;
    budgetary_impact: number;
    households: number;
    state_tax_revenue_impact: number;
    tax_revenue_impact: number;
  };
  cliff_impact: Record<string, any> | null;
  constituency_impact: {
    by_constituency: ReportOutputSocietyWideByConstituency;
    outcomes_by_region: {
      england: {
        'Gain less than 5%': number;
        'Gain more than 5%': number;
        'Lose less than 5%': number;
        'Lose more than 5%': number;
        'No change': number;
      };
      northern_ireland: {
        'Gain less than 5%': number;
        'Gain more than 5%': number;
        'Lose less than 5%': number;
        'Lose more than 5%': number;
        'No change': number;
      };
      scotland: {
        'Gain less than 5%': number;
        'Gain more than 5%': number;
        'Lose less than 5%': number;
        'Lose more than 5%': number;
        'No change': number;
      };
      uk: {
        'Gain less than 5%': number;
        'Gain more than 5%': number;
        'Lose less than 5%': number;
        'Lose more than 5%': number;
        'No change': number;
      };
      wales: {
        'Gain less than 5%': number;
        'Gain more than 5%': number;
        'Lose less than 5%': number;
        'Lose more than 5%': number;
        'No change': number;
      };
    };
  };
  data_version: string;
  decile: {
    average: Record<string, number>;
    relative: Record<string, number>;
  };
  detailed_budget: {
    child_benefit: {
      baseline: number;
      difference: number;
      reform: number;
    };
    council_tax: {
      baseline: number;
      difference: number;
      reform: number;
    };
    fuel_duty: {
      baseline: number;
      difference: number;
      reform: number;
    };
    income_tax: {
      baseline: number;
      difference: number;
      reform: number;
    };
    national_insurance: {
      baseline: number;
      difference: number;
      reform: number;
    };
    ni_employer: {
      baseline: number;
      difference: number;
      reform: number;
    };
    pension_credit: {
      baseline: number;
      difference: number;
      reform: number;
    };
    state_pension: {
      baseline: number;
      difference: number;
      reform: number;
    };
    tax_credits: {
      baseline: number;
      difference: number;
      reform: number;
    };
    universal_credit: {
      baseline: number;
      difference: number;
      reform: number;
    };
    vat: {
      baseline: number;
      difference: number;
      reform: number;
    };
  };
  inequality: {
    gini: {
      baseline: number;
      reform: number;
    };
    top_10_pct_share: {
      baseline: number;
      reform: number;
    };
    top_1_pct_share: {
      baseline: number;
      reform: number;
    };
  };
  intra_decile: {
    all: {
      'Gain less than 5%': number;
      'Gain more than 5%': number;
      'Lose less than 5%': number;
      'Lose more than 5%': number;
      'No change': number;
    };
    deciles: {
      'Gain less than 5%': number[];
      'Gain more than 5%': number[];
      'Lose less than 5%': number[];
      'Lose more than 5%': number[];
      'No change': number[];
    };
  };
  intra_wealth_decile: {
    all: {
      'Gain less than 5%': number;
      'Gain more than 5%': number;
      'Lose less than 5%': number;
      'Lose more than 5%': number;
      'No change': number;
    };
    deciles: {
      'Gain less than 5%': number[];
      'Gain more than 5%': number[];
      'Lose less than 5%': number[];
      'Lose more than 5%': number[];
      'No change': number[];
    };
  };
  labor_supply_response: {
    decile: {
      average: {
        income: Record<string, number>;
        substitution: Record<string, number>;
      };
      relative: {
        income: Record<string, number>;
        substitution: Record<string, number>;
      };
    };
    hours: {
      baseline: number;
      change: number;
      income_effect: number;
      reform: number;
      substitution_effect: number;
    };
    income_lsr: number;
    relative_lsr: {
      income: number;
      substitution: number;
    };
    revenue_change: number;
    substitution_lsr: number;
    total_change: number;
  };
  model_version: string;
  poverty: {
    deep_poverty: {
      adult: {
        baseline: number;
        reform: number;
      };
      all: {
        baseline: number;
        reform: number;
      };
      child: {
        baseline: number;
        reform: number;
      };
      senior: {
        baseline: number;
        reform: number;
      };
    };
    poverty: {
      adult: {
        baseline: number;
        reform: number;
      };
      all: {
        baseline: number;
        reform: number;
      };
      child: {
        baseline: number;
        reform: number;
      };
      senior: {
        baseline: number;
        reform: number;
      };
    };
  };
  poverty_by_gender: {
    deep_poverty: {
      female: {
        baseline: number;
        reform: number;
      };
      male: {
        baseline: number;
        reform: number;
      };
    };
    poverty: {
      female: {
        baseline: number;
        reform: number;
      };
      male: {
        baseline: number;
        reform: number;
      };
    };
  };
  poverty_by_race: null;
  wealth_decile: {
    average: Record<string, number>;
    relative: Record<string, number>;
  };
}
