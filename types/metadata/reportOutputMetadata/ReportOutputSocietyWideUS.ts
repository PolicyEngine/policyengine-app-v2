export interface ReportOutputSocietyWideUS {
  budget: {
    baseline_net_income: number;
    benefit_spending_impact: number;
    budgetary_impact: number;
    households: number;
    state_tax_revenue_impact: number;
    tax_revenue_impact: number;
  };
  cliff_impact: Record<string, any> | null;
  constituency_impact: null;
  data_version: string;
  decile: {
    average: Record<string, number>;
    relative: Record<string, number>;
  };
  detailed_budget: Record<string, unknown>;
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
      "Gain less than 5%": number;
      "Gain more than 5%": number;
      "Lose less than 5%": number;
      "Lose more than 5%": number;
      "No change": number;
    };
    deciles: {
      "Gain less than 5%": number[];
      "Gain more than 5%": number[];
      "Lose less than 5%": number[];
      "Lose more than 5%": number[];
      "No change": number[];
    };
  };
  intra_wealth_decile: null;
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
  poverty_by_race: {
    poverty: {
      black: {
        baseline: number;
        reform: number;
      };
      hispanic: {
        baseline: number;
        reform: number;
      };
      other: {
        baseline: number;
        reform: number;
      };
      white: {
        baseline: number;
        reform: number;
      };
    };
  };
  wealth_decile: null;
}