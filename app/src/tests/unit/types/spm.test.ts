import { describe, expect, test } from 'vitest';
import { SPM_COMPARISON_RECEIPT, SPM_RECEIPT } from '@/tests/fixtures/spm/spmMocks';
import {
  parseOptionalSPMCalculationProvenance,
  parseRequiredSPMComparisonCalculationProvenance,
  parseSPMComparisonProvenance,
  parseSPMProvenance,
  parseSPMSelection,
} from '@/types/spm';

describe('SPM wire contracts', () => {
  test('given canonical individual provenance then parses every explicit field', () => {
    expect(parseSPMProvenance(SPM_RECEIPT)).toEqual(SPM_RECEIPT);
  });

  test.each([
    { ...SPM_RECEIPT, schema_version: undefined },
    { ...SPM_RECEIPT, forecast_sha256: 'not-a-sha' },
    { ...SPM_RECEIPT, years: ['2027', '2026'] },
    { ...SPM_RECEIPT, years: ['2026', '2026'] },
    { ...SPM_RECEIPT, geography_kind: 'national', geography_id: '35620' },
    { ...SPM_RECEIPT, geography_kind: 'metro', geography_id: null },
    { ...SPM_RECEIPT, composition_method: 'legacy-diagnostic' },
    {
      ...SPM_RECEIPT,
      runtime_versions: {
        ...SPM_RECEIPT.runtime_versions,
        unrecognized_package: '1.0.0',
      },
    },
  ])('given invalid or legacy individual provenance then rejects it', (value) => {
    expect(() => parseSPMProvenance(value)).toThrow('Invalid SPM provenance');
  });

  test('given canonical comparison provenance then parses both execution receipts', () => {
    expect(parseSPMComparisonProvenance(SPM_COMPARISON_RECEIPT)).toEqual(SPM_COMPARISON_RECEIPT);
  });

  test.each([
    {
      ...SPM_COMPARISON_RECEIPT,
      schema_version: 'canonical-spm-provenance-v2',
    },
    {
      ...SPM_COMPARISON_RECEIPT,
      baseline: { ...SPM_COMPARISON_RECEIPT.baseline, execution_count: 0 },
    },
    {
      ...SPM_COMPARISON_RECEIPT,
      reform: {
        ...SPM_COMPARISON_RECEIPT.reform,
        receipt: { ...SPM_RECEIPT, scenario: 'different-scenario' },
      },
    },
  ])('given invalid comparison provenance then rejects it', (value) => {
    expect(() => parseSPMComparisonProvenance(value)).toThrow('Invalid SPM comparison provenance');
  });

  test('given a metro selection then requires its identifier', () => {
    expect(() => parseSPMSelection({ geography_kind: 'metro' })).toThrow('Invalid SPM selection');
    expect(parseSPMSelection({ geography_kind: 'metro', geography_id: '35620' })).toEqual({
      geography_kind: 'metro',
      geography_id: '35620',
    });
  });

  test('given matching calculation fields then parses the selection and receipt together', () => {
    const spmConfig = {
      geography_kind: 'national',
      geography_id: null,
      forecast_content_sha256: SPM_RECEIPT.forecast_sha256,
      scenario: SPM_RECEIPT.scenario,
      county_vintage: '2020',
      as_of: SPM_RECEIPT.as_of,
    };
    expect(
      parseOptionalSPMCalculationProvenance({
        spm_config: spmConfig,
        spm_provenance: SPM_RECEIPT,
      })
    ).toEqual({ spm_config: spmConfig, spm_provenance: SPM_RECEIPT });
  });

  test('given a mismatched receipt then rejects the calculation fields', () => {
    expect(() =>
      parseOptionalSPMCalculationProvenance({
        spm_config: {
          geography_kind: 'county',
          geography_id: null,
          forecast_content_sha256: SPM_RECEIPT.forecast_sha256,
          scenario: SPM_RECEIPT.scenario,
          county_vintage: '2020',
          as_of: SPM_RECEIPT.as_of,
        },
        spm_provenance: SPM_RECEIPT,
      })
    ).toThrow('does not match');
  });

  test('given US society-wide output then requires a comparison receipt and selection', () => {
    expect(() => parseRequiredSPMComparisonCalculationProvenance({ budget: {} })).toThrow(
      'requires spm_config and spm_provenance'
    );
    expect(
      parseRequiredSPMComparisonCalculationProvenance({
        spm_config: {
          geography_kind: 'national',
          geography_id: null,
          forecast_content_sha256: SPM_RECEIPT.forecast_sha256,
          scenario: SPM_RECEIPT.scenario,
          county_vintage: '2020',
          as_of: SPM_RECEIPT.as_of,
        },
        spm_provenance: SPM_COMPARISON_RECEIPT,
      })
    ).toEqual({
      spm_config: {
        geography_kind: 'national',
        geography_id: null,
        forecast_content_sha256: SPM_RECEIPT.forecast_sha256,
        scenario: SPM_RECEIPT.scenario,
        county_vintage: '2020',
        as_of: SPM_RECEIPT.as_of,
      },
      spm_provenance: SPM_COMPARISON_RECEIPT,
    });
  });
});
