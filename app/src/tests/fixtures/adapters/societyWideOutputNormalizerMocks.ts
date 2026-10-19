/**
 * UK geography impacts in the society-wide API's list shape, trimmed from a
 * live result (GET /uk/economy/85546/over/1?region=uk&time_period=2026).
 */
export const LIST_SHAPE_CONSTITUENCY_IMPACT = [
  {
    average_household_income_change: 571.146162,
    constituency_code: 'E14001063',
    constituency_name: 'Aldershot',
    population: 156694.120447,
    relative_household_income_change: 0.015443,
    x: 56,
    y: -40,
  },
  {
    average_household_income_change: 730.315911,
    constituency_code: 'E14001064',
    constituency_name: 'Aldridge-Brownhills',
    population: 14399.92392,
    relative_household_income_change: 0.015095,
    x: 56,
    y: -30,
  },
  {
    average_household_income_change: 966.61352,
    constituency_code: 'E14001065',
    constituency_name: 'Altrincham and Sale West',
    population: 34071.650678,
    relative_household_income_change: 0.014919,
    x: 52,
    y: -25,
  },
];

export const LIST_SHAPE_LOCAL_AUTHORITY_IMPACT = [
  {
    average_household_income_change: 503.954362,
    local_authority_code: 'E06000001',
    local_authority_name: 'Hartlepool',
    population: 21937.852934,
    relative_household_income_change: 0.013174,
    x: 8,
    y: 19,
  },
  {
    average_household_income_change: 552.184089,
    local_authority_code: 'E06000002',
    local_authority_name: 'Middlesbrough',
    population: 72900.184956,
    relative_household_income_change: 0.012633,
    x: 9,
    y: 18,
  },
];

/** The same areas keyed by name, as the app's types and maps read them. */
export const EXPECTED_BY_CONSTITUENCY = {
  Aldershot: {
    x: 56,
    y: -40,
    average_household_income_change: 571.146162,
    relative_household_income_change: 0.015443,
  },
  'Aldridge-Brownhills': {
    x: 56,
    y: -30,
    average_household_income_change: 730.315911,
    relative_household_income_change: 0.015095,
  },
  'Altrincham and Sale West': {
    x: 52,
    y: -25,
    average_household_income_change: 966.61352,
    relative_household_income_change: 0.014919,
  },
};

export const EXPECTED_BY_LOCAL_AUTHORITY = {
  Hartlepool: {
    x: 8,
    y: 19,
    average_household_income_change: 503.954362,
    relative_household_income_change: 0.013174,
  },
  Middlesbrough: {
    x: 9,
    y: 18,
    average_household_income_change: 552.184089,
    relative_household_income_change: 0.012633,
  },
};

/** A UK result's other fields, untouched by the normalizer. */
export const UK_RESULT_OTHER_FIELDS = {
  budget: { budgetary_impact: -1e9, households: 30e6 },
  model_version: '2.0.0',
};

export const LIST_SHAPE_UK_RESULT = {
  ...UK_RESULT_OTHER_FIELDS,
  constituency_impact: LIST_SHAPE_CONSTITUENCY_IMPACT,
  local_authority_impact: LIST_SHAPE_LOCAL_AUTHORITY_IMPACT,
};

export const KEYED_SHAPE_UK_RESULT = {
  ...UK_RESULT_OTHER_FIELDS,
  constituency_impact: {
    by_constituency: EXPECTED_BY_CONSTITUENCY,
    outcomes_by_region: {},
  },
  local_authority_impact: { by_local_authority: EXPECTED_BY_LOCAL_AUTHORITY },
};
