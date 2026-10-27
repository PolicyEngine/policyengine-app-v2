import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';

/** Three Welsh constituencies and two local authorities, with their ONS codes. */
export const UK_LOCAL_AREAS_OUTPUT = {
  constituency_impact: {
    by_constituency: {
      'Clwyd East': {
        x: 49,
        y: -30,
        average_household_income_change: -355.03,
        relative_household_income_change: -0.0132,
        code: 'W07000094',
      },
      Monmouthshire: {
        x: 50,
        y: -36,
        average_household_income_change: -90.78,
        relative_household_income_change: -0.0059,
        code: 'W07000101',
      },
      Gower: {
        x: 44,
        y: -37,
        average_household_income_change: 237.22,
        relative_household_income_change: 0.0065,
        code: 'W07000097',
      },
    },
  },
  local_authority_impact: {
    by_local_authority: {
      Cardiff: {
        x: 47,
        y: -37,
        average_household_income_change: -197.4,
        relative_household_income_change: -0.007,
        code: 'W06000015',
      },
      Powys: {
        x: 49,
        y: -32,
        average_household_income_change: -137.2,
        relative_household_income_change: -0.0052,
        code: 'W06000023',
      },
    },
  },
} as unknown as SocietyWideReportOutput;

/** Two constituencies in the keyed shape of older results, with no codes. */
export const UK_LOCAL_AREAS_OUTPUT_NO_CODES = {
  constituency_impact: {
    by_constituency: {
      Gower: {
        x: 44,
        y: -37,
        average_household_income_change: 237.22,
        relative_household_income_change: 0.0065,
      },
      Monmouthshire: {
        x: 50,
        y: -36,
        average_household_income_change: -90.78,
        relative_household_income_change: -0.0059,
      },
    },
  },
  local_authority_impact: { by_local_authority: {} },
} as unknown as SocietyWideReportOutput;

export const WALES_REGION = 'country/wales';
export const UK_WIDE_REGION = 'uk';

/**
 * The coded output with every API position at the origin, so the hex map
 * can place its areas only from their codes.
 */
export const UK_LOCAL_AREAS_OUTPUT_WITHOUT_API_POSITIONS = {
  ...UK_LOCAL_AREAS_OUTPUT,
  constituency_impact: {
    by_constituency: Object.fromEntries(
      Object.entries(
        (
          UK_LOCAL_AREAS_OUTPUT as unknown as {
            constituency_impact: { by_constituency: Record<string, object> };
          }
        ).constituency_impact.by_constituency
      ).map(([name, area]) => [name, { ...area, x: 0, y: 0 }])
    ),
  },
} as unknown as SocietyWideReportOutput;

/** The coded output with Gower's code taken away, as from a source with no code for it. */
export const UK_LOCAL_AREAS_OUTPUT_GOWER_UNCODED = (() => {
  const output = UK_LOCAL_AREAS_OUTPUT as unknown as {
    constituency_impact: { by_constituency: Record<string, { code?: string }> };
  };
  const { code: _gowerCode, ...gower } = output.constituency_impact.by_constituency.Gower;
  return {
    ...UK_LOCAL_AREAS_OUTPUT,
    constituency_impact: {
      by_constituency: { ...output.constituency_impact.by_constituency, Gower: gower },
    },
  } as unknown as SocietyWideReportOutput;
})();
