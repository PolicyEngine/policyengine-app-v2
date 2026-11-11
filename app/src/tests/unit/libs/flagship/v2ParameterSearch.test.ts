import { describe, expect, test } from 'vitest';
import {
  buildV2SearchCatalog,
  editableOn,
  searchCollectionFromFile,
} from '@/libs/flagship/v2ParameterSearch';
import { DEFAULT_SEARCH_FILTERS, searchParametersWidening } from '@/libs/parameterSearch';
import {
  CTC_ARPA_AMOUNT,
  CTC_FIRST_BRACKET_AMOUNT,
  CTC_FULLY_REFUNDABLE,
  CTC_PHASE_OUT_SINGLE,
  STANDARD_DEDUCTION_JOINT,
  STANDARD_DEDUCTION_SINGLE,
  US_SEARCH_FILE,
} from '@/tests/fixtures/api/publicApi/searchFileMocks';

const BEFORE_2026 = '2025-06-30';
const IN_2026 = '2026-03-01';

describe('searchCollectionFromFile', () => {
  test('given parameters without a label then they take the label v1 gave them', () => {
    const collection = searchCollectionFromFile(US_SEARCH_FILE);

    expect(collection[STANDARD_DEDUCTION_SINGLE].label).toBe('SINGLE');
    expect(collection[CTC_FIRST_BRACKET_AMOUNT].label).toBe('amount');
    expect(collection[CTC_FULLY_REFUNDABLE].label).toBe('Child Tax Credit fully refundable');
  });

  test('given unlabelled ancestors then each is a node with v1 label, a bracket as "bracket N"', () => {
    const collection = searchCollectionFromFile(US_SEARCH_FILE);

    expect(collection['gov.irs.deductions']).toMatchObject({
      type: 'parameterNode',
      label: 'deductions',
    });
    expect(collection['gov.irs.credits.ctc.amount.base[0]']).toMatchObject({
      type: 'parameterNode',
      label: 'bracket 1',
    });
    expect(collection['gov.irs.deductions.standard']).toMatchObject({
      type: 'parameterNode',
      label: 'Standard deduction',
    });
  });

  test('given the file then it carries no values: they load on demand', () => {
    const collection = searchCollectionFromFile(US_SEARCH_FILE);

    expect(Object.values(collection).every((entry) => entry.values === undefined)).toBe(true);
  });

  test('given a parameter a reform cannot change then it is labelled but not searchable', () => {
    const collection = searchCollectionFromFile(US_SEARCH_FILE);

    expect(collection[CTC_ARPA_AMOUNT]).toMatchObject({
      label: 'ARPA Child Tax Credit amount',
      economy: false,
      household: false,
    });
  });
});

describe('editableOn', () => {
  test('given a parameter whose value becomes editable later then the date decides', () => {
    const phaseOut = US_SEARCH_FILE.parameters.find(
      (entry) => entry.path === CTC_PHASE_OUT_SINGLE
    )!;

    expect(editableOn(phaseOut, BEFORE_2026)).toBe(false);
    expect(editableOn(phaseOut, IN_2026)).toBe(true);
    expect(editableOn(phaseOut, '2026-01-01')).toBe(true);
  });
});

describe('buildV2SearchCatalog', () => {
  test('given a date then only parameters a draft can edit then are offered', () => {
    const before = buildV2SearchCatalog(US_SEARCH_FILE, BEFORE_2026);
    const during = buildV2SearchCatalog(US_SEARCH_FILE, IN_2026);

    expect(before.addablePaths.has(CTC_PHASE_OUT_SINGLE)).toBe(false);
    expect(during.addablePaths.has(CTC_PHASE_OUT_SINGLE)).toBe(true);
    expect(before.addablePaths.has(CTC_ARPA_AMOUNT)).toBe(false);
    expect([...before.addablePaths].sort()).toEqual(
      [
        CTC_FIRST_BRACKET_AMOUNT,
        CTC_FULLY_REFUNDABLE,
        STANDARD_DEDUCTION_JOINT,
        STANDARD_DEDUCTION_SINGLE,
      ].sort()
    );
  });

  test('given the catalog then entries carry breadcrumbs from the node labels', () => {
    const catalog = buildV2SearchCatalog(US_SEARCH_FILE, IN_2026);

    const entry = catalog.entriesByPath.get(STANDARD_DEDUCTION_SINGLE)!;
    expect(entry.breadcrumb).toContain('Standard deduction');
    expect(entry.unit).toBe('currency-USD');
    expect(entry.description).toBe('Standard deduction for single filers.');
  });

  test('given a query then v3 search finds it in the index built from the file', () => {
    const catalog = buildV2SearchCatalog(US_SEARCH_FILE, IN_2026);

    const result = searchParametersWidening(
      catalog.index,
      'standard deduction',
      10,
      DEFAULT_SEARCH_FILTERS
    );

    expect(result.entries.map((entry) => entry.path)).toContain(STANDARD_DEDUCTION_SINGLE);
  });

  test('given the same file and date twice then the catalog is built once', () => {
    expect(buildV2SearchCatalog(US_SEARCH_FILE, IN_2026)).toBe(
      buildV2SearchCatalog(US_SEARCH_FILE, IN_2026)
    );
  });
});
