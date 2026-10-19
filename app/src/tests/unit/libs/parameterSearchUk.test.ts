import { describe, expect, test } from 'vitest';
import {
  buildConceptAliases,
  buildConceptClusters,
  buildParameterSearchEntries,
  buildStateNames,
  createParameterSearchIndex,
  DEFAULT_SEARCH_FILTERS,
  hasStateKeys,
  isKeyLabel,
  SEARCH_KEYWORDS,
  searchParameters,
} from '@/libs/parameterSearch';
import { isModelAssumption, priorOffset } from '@/libs/searchPriors';
import { buildUkParameterCollection, UK_PATHS } from '@/tests/fixtures/libs/parameterSearchUkMocks';

const parameters = buildUkParameterCollection();
const entries = buildParameterSearchEntries(parameters);
const aliases = buildConceptAliases(parameters);
const index = createParameterSearchIndex(
  entries,
  buildConceptClusters(parameters),
  aliases,
  buildStateNames(parameters)
);
const search = (query: string, limit = 5) =>
  searchParameters(index, query, limit, DEFAULT_SEARCH_FILTERS).map((entry) => entry.path);
const entryAt = (path: string) => entries.find((entry) => entry.path === path);

describe('UK concept aliases', () => {
  test('given raw region keys labelled NORTHERN IRELAND then "ni" still means national insurance', () => {
    expect(aliases.get('ni')).toBe('national insurance');
  });

  test('given a contributed reform with the same initialism then "uc" means universal credit', () => {
    // "UBI Center" (gov.contrib) would otherwise tie with "Universal Credit".
    expect(aliases.get('uc')).toBe('universal credit');
  });

  test('given a label that only restates its key then it is recognized as one', () => {
    expect(isKeyLabel(UK_PATHS.niBusinessRates, 'NORTHERN IRELAND')).toBe(true);
    expect(isKeyLabel('gov.hmrc.vat', 'vat')).toBe(true);
    expect(isKeyLabel('gov.hmrc.national_insurance', 'National Insurance')).toBe(false);
  });

  test('given "employee NI rate" then the employee rate leads and business rates do not show', () => {
    const paths = search('employee NI rate');

    expect(paths[0]).toBe(UK_PATHS.employeeNiMain);
    expect(paths).not.toContain(UK_PATHS.niBusinessRates);
  });
});

describe('UK short tokens', () => {
  test('given "UC" then no parameter merely spelling uc inside a word comes first', () => {
    const paths = search('UC');

    expect(paths[0]).toMatch(/^gov\.dwp\.universal_credit\./);
    expect(paths).not.toContain(UK_PATHS.vatReduced);
  });

  test('given "VAT" then "private" does not match it', () => {
    expect(search('VAT', 10)).not.toContain(UK_PATHS.privatePension);
  });

  test('given a three-letter word then it still matches the start of a longer one', () => {
    expect(search('tax', 20)).toContain(UK_PATHS.taxableSources);
  });

  test('given structural words absent from an entry then they do not exclude it', () => {
    // No label says "and"; the words that carry meaning still find it.
    expect(search('free and reduced school meals')).toContain(UK_PATHS.schoolMealsFree);
  });
});

describe('UK ranking signals', () => {
  test('given a query that is a label word for word then that parameter leads', () => {
    expect(search('basic rate')[0]).toBe(UK_PATHS.incomeTaxBasic);
  });

  test('given a candidate missing a query word then a full match outranks it', () => {
    // "employer" is one letter from "employee"; fuzzy scoring alone ranks it first.
    const paths = search('employee national insurance rate');

    expect(paths.indexOf(UK_PATHS.employeeNiMain)).toBeLessThan(paths.indexOf(UK_PATHS.employerNi));
  });
});

describe('UK modelling assumptions', () => {
  test('given simulation and economic assumption paths then they are model assumptions', () => {
    expect(isModelAssumption(UK_PATHS.vatCoverage)).toBe(true);
    expect(isModelAssumption(UK_PATHS.cgtIndex)).toBe(true);
    expect(isModelAssumption('gov.dwp.pension_credit.takeup')).toBe(true);
    expect(isModelAssumption(UK_PATHS.cgtBasic)).toBe(false);
    expect(priorOffset(UK_PATHS.cgtBasic)).toBe(0);
    expect(priorOffset(UK_PATHS.cgtIndex)).toBeGreaterThan(0);
  });

  test('given "capital gains" then the tax comes before its index and elasticities', () => {
    const paths = search('capital gains');

    expect(paths[0]).toBe(UK_PATHS.cgtBasic);
    expect(paths.indexOf(UK_PATHS.cgtIndex)).toBeGreaterThan(0);
  });

  test('given "VAT" then the VAT rates come before the microdata coverage assumption', () => {
    const paths = search('VAT');

    expect(paths.slice(0, 2).sort()).toEqual([UK_PATHS.vatReduced, UK_PATHS.vatStandard].sort());
  });
});

describe('UK leaves labelled only with their key', () => {
  test('given a member key then it reads as its parent with the key as a qualifier', () => {
    expect(entryAt(UK_PATHS.pcSingle)?.label).toBe('Pension Credit minimum guarantee (single)');
    expect(entryAt(UK_PATHS.pcSingle)?.breadcrumb).toBe(
      'DWP → Pension Credit → Guarantee credit → Pension Credit minimum guarantee → ' +
        'Pension Credit minimum guarantee (single)'
    );
  });

  test('given a region key then it reads as a place', () => {
    expect(entryAt(UK_PATHS.londonBusinessRates)?.label).toBe('Revenue: London');
    expect(entryAt(UK_PATHS.niBusinessRates)?.label).toBe('Revenue: Northern Ireland');
  });

  test('given "pension credit single" then the single minimum guarantee leads', () => {
    expect(search('pension credit single')[0]).toBe(UK_PATHS.pcSingle);
  });
});

describe('UK breadcrumb casing', () => {
  test('given a node labelled with its acronym key then the breadcrumb capitalizes it', () => {
    expect(entryAt(UK_PATHS.vatStandard)?.breadcrumb).toBe('HMRC → VAT → VAT standard rate');
    expect(entryAt(UK_PATHS.privatePension)?.breadcrumb).toBe(
      'Economic assumptions → Indices → OBR → Private pension index'
    );
  });
});

describe('state keys outside the US model', () => {
  test('given no gov.states then a two-letter key is not a state', () => {
    expect(hasStateKeys(Object.keys(parameters))).toBe(false);
    expect(entryAt(UK_PATHS.waKeyed)?.stateCode).toBeNull();
  });

  test('given no gov.states then a WA-keyed value is not collapsed into a state breakdown', () => {
    const [found] = searchParameters(index, 'rail fares', 5, DEFAULT_SEARCH_FILTERS);

    expect(found.path).toBe(UK_PATHS.waKeyed);
    expect(found.jurisdictionCount).toBeUndefined();
  });

  test('given gov.states then two-letter keys are states again', () => {
    expect(hasStateKeys(['gov.irs.credits', 'gov.states.ca.tax'])).toBe(true);
  });
});

describe('everyday names the metadata never uses', () => {
  test('given the curated list then every entry names a parameter path, briefly', () => {
    for (const [path, words] of Object.entries(SEARCH_KEYWORDS)) {
      expect(path).toMatch(/^gov\.[a-z_]+\./);
      expect(words.split(' ').length).toBeLessThanOrEqual(3);
    }
    expect(Object.keys(SEARCH_KEYWORDS).length).toBeLessThanOrEqual(8);
  });

  test('given "taper rate" then the Universal Credit taper leads', () => {
    expect(search('taper rate')[0]).toBe(UK_PATHS.ucTaper);
  });

  test('given "UC taper" then the Universal Credit taper leads', () => {
    expect(search('UC taper')[0]).toBe(UK_PATHS.ucTaper);
  });

  test('given "two child limit" then the Universal Credit child limit is found', () => {
    expect(search('two child limit')).toContain(UK_PATHS.ucChildLimit);
  });
});
