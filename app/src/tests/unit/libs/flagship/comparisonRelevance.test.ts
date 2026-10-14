import { describe, expect, test } from 'vitest';
import { relevantComparisons } from '@/libs/flagship/comparisonRelevance';
import {
  ACTC_CLAIM,
  CDCC_DIRECT_READERS,
  CDCC_ELIGIBILITY_MAX_PATH,
  COLORADO_CTC_CLAIM,
  CTC_BASE_PATH,
  CTC_DIRECT_READERS,
  CTC_PHASE_IN_EITC_PATH,
  DC_SNAP_CLAIM,
  DC_SNAP_MINIMUM_PATH,
  EITC_MAX_PATH,
  JCT_CTC_CLAIM,
  MARYLAND,
  MARYLAND_DISTRICT,
  MARYLAND_FEDERAL_EITC_CLAIM,
  MD_EITC_CLAIM,
  MD_EITC_MATCH_PATH,
  NATIONWIDE,
  NONREFUNDABLE_CTC_CLAIM,
  NYC_EITC_PATH,
  REPORT_4332_CLAIMS,
  REPORT_4332_REFORM,
  SAVERS_CREDIT_CLAIM,
  SC_CDCC_CLAIM,
  SC_EITC_CLAIM,
  SOI_CDCC_CLAIM,
  SOUTH_CAROLINA,
  STANDARD_DEDUCTION_PATH,
  TREASURY_CDCC_CLAIM,
  UK_PARAMETER_CLAIM,
  UNNAMED_PROGRAM_CLAIM,
  US_EITC_CLAIM,
  US_SNAP_CLAIM,
  usReform,
  WA_WFTC_CLAIM,
  WA_WFTC_PATH,
} from '@/tests/fixtures/libs/flagship/comparisonRelevanceMocks';

const names = (claims: Array<{ name: string }>) => claims.map((claim) => claim.name);

describe('relevantComparisons', () => {
  test('given report 4332 then only the national CDCC comparisons remain', () => {
    expect(names(relevantComparisons(REPORT_4332_CLAIMS, REPORT_4332_REFORM))).toEqual([
      TREASURY_CDCC_CLAIM.name,
      SOI_CDCC_CLAIM.name,
    ]);
  });

  test('given a federal CTC reform nationwide then only the national CTC comparisons remain', () => {
    const reform = usReform([CTC_BASE_PATH], NATIONWIDE, { [CTC_BASE_PATH]: CTC_DIRECT_READERS });

    expect(
      relevantComparisons(
        [...REPORT_4332_CLAIMS, NONREFUNDABLE_CTC_CLAIM, JCT_CTC_CLAIM, COLORADO_CTC_CLAIM],
        reform
      )
    ).toEqual([ACTC_CLAIM, NONREFUNDABLE_CTC_CLAIM, JCT_CTC_CLAIM]);
  });

  test('given a Maryland EITC reform then the Maryland EITC comparison remains, nationwide or in Maryland', () => {
    const claims = [...REPORT_4332_CLAIMS, US_EITC_CLAIM, MARYLAND_FEDERAL_EITC_CLAIM];

    for (const region of [NATIONWIDE, MARYLAND, MARYLAND_DISTRICT]) {
      expect(relevantComparisons(claims, usReform([MD_EITC_MATCH_PATH], region))).toEqual([
        MD_EITC_CLAIM,
      ]);
    }
  });

  test('given a reform no comparison measures then none remain', () => {
    expect(
      relevantComparisons(REPORT_4332_CLAIMS, usReform([STANDARD_DEDUCTION_PATH], NATIONWIDE))
    ).toEqual([]);
  });

  test('given a federal rule a state reads then the state comparison shows in that state only', () => {
    const readers = { [CDCC_ELIGIBILITY_MAX_PATH]: CDCC_DIRECT_READERS };
    const claims = [SOI_CDCC_CLAIM, SC_CDCC_CLAIM, MD_EITC_CLAIM];

    expect(
      relevantComparisons(claims, usReform([CDCC_ELIGIBILITY_MAX_PATH], SOUTH_CAROLINA, readers))
    ).toEqual([SOI_CDCC_CLAIM, SC_CDCC_CLAIM]);
    expect(
      relevantComparisons(claims, usReform([CDCC_ELIGIBILITY_MAX_PATH], NATIONWIDE, readers))
    ).toEqual([SOI_CDCC_CLAIM]);
  });

  test('given a federal reform then its comparison in a state shows only in that state report', () => {
    const claims = [US_EITC_CLAIM, MARYLAND_FEDERAL_EITC_CLAIM, SC_EITC_CLAIM];

    expect(relevantComparisons(claims, usReform([EITC_MAX_PATH], NATIONWIDE))).toEqual([
      US_EITC_CLAIM,
    ]);
    expect(relevantComparisons(claims, usReform([EITC_MAX_PATH], MARYLAND))).toEqual([
      US_EITC_CLAIM,
      MARYLAND_FEDERAL_EITC_CLAIM,
    ]);
  });

  test('given a state option of a federal program then that state and the nation show', () => {
    const reform = usReform([DC_SNAP_MINIMUM_PATH], NATIONWIDE, {
      [DC_SNAP_MINIMUM_PATH]: ['snap_min_allotment'],
    });

    expect(relevantComparisons([US_SNAP_CLAIM, DC_SNAP_CLAIM], reform)).toEqual([
      US_SNAP_CLAIM,
      DC_SNAP_CLAIM,
    ]);
  });

  test('given a setting named after another program then that program does not match', () => {
    expect(
      relevantComparisons(
        [US_EITC_CLAIM, ACTC_CLAIM],
        usReform([CTC_PHASE_IN_EITC_PATH], NATIONWIDE, {
          [CTC_PHASE_IN_EITC_PATH]: ['co_refundable_ctc', 'ctc_phase_in'],
        })
      )
    ).toEqual([ACTC_CLAIM]);
  });

  test('given a city credit then no federal or state comparison matches', () => {
    const reform = usReform([NYC_EITC_PATH], NATIONWIDE, { [NYC_EITC_PATH]: ['nyc_eitc'] });

    expect(relevantComparisons([US_EITC_CLAIM, MD_EITC_CLAIM], reform)).toEqual([]);
  });

  test('given a scorecard abbreviation then it matches the model name it stands for', () => {
    expect(relevantComparisons([WA_WFTC_CLAIM], usReform([WA_WFTC_PATH], 'state/wa'))).toEqual([
      WA_WFTC_CLAIM,
    ]);
  });

  test('given no recorded program then only a receipt naming the parameter keeps it', () => {
    expect(
      relevantComparisons(
        [UNNAMED_PROGRAM_CLAIM, SAVERS_CREDIT_CLAIM],
        usReform([CTC_BASE_PATH], NATIONWIDE)
      )
    ).toEqual([]);
    expect(
      relevantComparisons([UK_PARAMETER_CLAIM], {
        countryId: 'uk',
        paths: ['gov.dwp.universal_credit.elements.child.amount'],
        readers: {},
        region: 'uk',
      })
    ).toEqual([UK_PARAMETER_CLAIM]);
  });
});
