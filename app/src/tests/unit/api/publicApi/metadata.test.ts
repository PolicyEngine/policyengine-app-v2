import { beforeEach, describe, expect, test, vi } from 'vitest';
import { createPublicApiClient } from '@/api/publicApi/client';
import { fetchV2Metadata } from '@/api/publicApi/metadata';
import { isV2ApiError } from '@/api/v2UserClient';
import {
  modelCatalog,
  modelSelection,
  V2_MODEL_ID,
  V2_PARAMETER_IDS,
  V2_POLICYENGINE_VERSION,
  V2_US_REGIONS,
} from '@/tests/fixtures/api/publicApi/metadataV2Mocks';
import { errorResponse, okResponse, TEST_API_BASE } from '@/tests/fixtures/api/v2UserMocks';

const CTC_AMOUNT = 'gov.irs.credits.ctc.amount.base[0].amount';
const CTC_PHASE_OUT = 'gov.irs.credits.ctc.phase_out.threshold';

const fetchMock = vi.fn();

interface Answers {
  selection?: Response;
  catalog?: unknown;
  regionPages?: unknown[][];
}

function answer({ selection, catalog = modelCatalog(), regionPages }: Answers = {}) {
  const pages = regionPages ?? [V2_US_REGIONS];
  fetchMock.mockImplementation(async (request: Request) => {
    const url = new URL(request.url);
    if (url.pathname === '/v2/tax-benefit-models/by-country/us') {
      return selection ?? okResponse(modelSelection());
    }
    if (url.pathname === '/v2/model-catalog') {
      return okResponse(catalog);
    }
    if (url.pathname === '/v2/regions') {
      const pageIndex = Number(url.searchParams.get('offset') ?? 0) / 500;
      return okResponse({
        policyengine_version: V2_POLICYENGINE_VERSION,
        items: pages[pageIndex],
        offset: pageIndex * 500,
        limit: 500,
        has_more: pageIndex < pages.length - 1,
      });
    }
    return errorResponse(404, 'not found');
  });
}

function load() {
  return fetchV2Metadata(
    'us',
    createPublicApiClient({
      baseUrl: TEST_API_BASE,
      fetchImpl: fetchMock as unknown as typeof fetch,
    })
  );
}

function requestedUrls(): URL[] {
  return fetchMock.mock.calls.map(([request]) => new URL((request as Request).url));
}

beforeEach(() => {
  fetchMock.mockReset();
});

describe('fetchV2Metadata', () => {
  test('given a country then the catalog and regions are read for its pinned version', async () => {
    // Given
    answer({ regionPages: [V2_US_REGIONS.slice(0, 2), V2_US_REGIONS.slice(2)] });

    // When
    await load();

    // Then
    const [selectionUrl, ...laterUrls] = requestedUrls();
    expect(selectionUrl.pathname).toBe('/v2/tax-benefit-models/by-country/us');
    expect(laterUrls.map((url) => url.pathname).sort()).toEqual([
      '/v2/model-catalog',
      '/v2/regions',
      '/v2/regions',
    ]);
    expect(
      laterUrls.every(
        (url) =>
          url.searchParams.get('country_id') === 'us' &&
          url.searchParams.get('policyengine_version') === V2_POLICYENGINE_VERSION
      )
    ).toBe(true);
    expect(
      laterUrls
        .filter((url) => url.pathname === '/v2/regions')
        .map((url) => [url.searchParams.get('offset'), url.searchParams.get('limit')])
    ).toEqual([
      ['0', '500'],
      ['500', '500'],
    ]);
  });

  test('given the model version then the summary fields match the v1 document', async () => {
    // Given
    answer();

    // When
    const { result } = await load();

    // Then
    expect(result.version).toBe(V2_POLICYENGINE_VERSION);
    expect(result.current_law_id).toBe(2);
    expect(result.basicInputs).toEqual(['state_name', 'employment_income', 'age']);
    expect(result.economy_options.time_period).toEqual([
      { name: 2027, label: '2027' },
      { name: 2026, label: '2026' },
      { name: 2025, label: '2025' },
    ]);
    expect(result.entities).toEqual({
      person: {
        key: 'person',
        plural: 'people',
        label: 'Person',
        doc: 'An individual.',
        is_person: true,
        roles: {},
      },
      tax_unit: {
        key: 'tax_unit',
        plural: 'tax_units',
        label: 'Tax unit',
        doc: 'A tax unit.',
        is_person: false,
        roles: { member: { plural: 'members', label: 'Member', doc: null } },
      },
    });
  });

  test('given catalog parameters then government parameters and nodes keep v1 labels', async () => {
    // Given
    answer();

    // When
    const { result } = await load();

    // Then
    const { parameters } = result;
    expect(Object.keys(parameters).some((name) => name.startsWith('calibration'))).toBe(false);
    expect(parameters[CTC_AMOUNT]).toEqual({
      type: 'parameter',
      parameter: CTC_AMOUNT,
      label: 'CTC base amount',
      description: 'Maximum credit per child',
      unit: 'currency-USD',
      period: 'year',
      values: { '2024-01-01': 2000, '2026-01-01': 2200 },
      economy: true,
      household: true,
    });
    expect(parameters[CTC_PHASE_OUT]).toMatchObject({
      label: 'threshold',
      economy: false,
      household: true,
      values: { '2018-01-01': 'Infinity' },
    });
    expect(parameters['gov.irs.credits.ctc']).toEqual({
      type: 'parameterNode',
      parameter: 'gov.irs.credits.ctc',
      label: 'Child Tax Credit',
      description: null,
    });
    expect(parameters['gov.irs.income.bracket'].label).toBe('bracket');
    expect(parameters['gov.irs.income.bracket.rates[0]'].label).toBe('bracket 1');
  });

  test('given a value in force since the earliest date then v1 dates it 0000-01-01', async () => {
    // Given: Python's earliest date is year 1, v1 wrote year 0
    const catalog = modelCatalog();
    catalog.parameters = catalog.parameters.map((parameter) =>
      parameter.name === CTC_PHASE_OUT
        ? { ...parameter, values: { '0001-01-01': 75000, '2018-01-01': 'Infinity' } }
        : parameter
    );
    answer({ catalog });

    // When
    const { result } = await load();

    // Then
    expect(result.parameters[CTC_PHASE_OUT].values).toEqual({
      '0000-01-01': 75000,
      '2018-01-01': 'Infinity',
    });
  });

  test('given catalog variables then each has the v1 field names', async () => {
    // Given
    answer();

    // When
    const { result } = await load();

    // Then
    expect(result.variables.employment_income).toEqual({
      name: 'employment_income',
      label: 'Employment income',
      entity: 'person',
      documentation: 'Wages and salaries',
      valueType: 'float',
      definitionPeriod: 'year',
      unit: 'currency-USD',
      moduleName: 'household.income.person.employment_income',
      isInputVariable: true,
      hidden_input: false,
      defaultValue: 0,
      adds: null,
      subtracts: null,
    });
    expect(result.variables.state_name).toMatchObject({
      valueType: 'Enum',
      defaultValue: 'CA',
      possibleValues: [
        { value: 'AL', label: 'Alabama' },
        { value: 'CA', label: 'California' },
      ],
    });
    expect(result.variables.household_net_income).toMatchObject({
      adds: ['household_market_income'],
      subtracts: ['household_tax'],
      isInputVariable: false,
    });
  });

  test('given catalog regions then v1 region types are listed, national first', async () => {
    // Given
    answer();

    // When
    const { result } = await load();

    // Then
    expect(result.economy_options.region).toEqual([
      { name: 'us', label: 'United States', type: 'national' },
      { name: 'state/ca', label: 'California', type: 'state' },
      {
        name: 'congressional_district/CA-01',
        label: "California's 1st congressional district",
        type: 'congressional_district',
        state_abbreviation: 'CA',
        state_name: 'California',
      },
    ]);
  });

  test('given the catalog then v2 saved reforms can name its model and parameters', async () => {
    // Given
    answer();

    // When
    const { result } = await load();

    // Then
    expect(result.v2Catalog).toEqual({
      policyengineVersion: V2_POLICYENGINE_VERSION,
      taxBenefitModelId: V2_MODEL_ID,
      parameterIds: {
        [CTC_AMOUNT]: V2_PARAMETER_IDS.CTC_AMOUNT,
        [CTC_PHASE_OUT]: V2_PARAMETER_IDS.CTC_PHASE_OUT,
        'gov.irs.income.bracket.rates[0].rate': V2_PARAMETER_IDS.BRACKET_RATE,
      },
    });
  });

  test('given a catalog published before format 2 then defaults stand in for absent fields', async () => {
    // Given: no entities, basic inputs, flags, metadata labels or input flags
    const olderCatalog = modelCatalog();
    olderCatalog.parameters = olderCatalog.parameters.map((parameter) => ({
      ...parameter,
      metadata_label: null,
      period: null,
      economy: null,
      household: null,
    }));
    answer({
      selection: okResponse(
        modelSelection({ catalog_format: null, entities: null, basic_inputs: null })
      ),
      catalog: olderCatalog,
    });

    // When
    const { result } = await load();

    // Then
    expect(result.entities).toEqual({});
    expect(result.basicInputs).toEqual([]);
    expect(result.parameters[CTC_AMOUNT]).toMatchObject({
      label: 'Child Tax Credit base amount (bracket 1 amount)',
      economy: true,
      household: true,
    });
  });

  test('given an unavailable catalog then the API error is thrown', async () => {
    // Given
    answer({ selection: errorResponse(503, 'V2 metadata catalog is unavailable') });

    // When
    const loading = load();

    // Then
    await expect(loading).rejects.toSatisfy((error: unknown) => isV2ApiError(error, 503));
  });
});
