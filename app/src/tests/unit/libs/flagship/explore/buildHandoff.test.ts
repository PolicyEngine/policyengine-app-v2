import { afterEach, describe, expect, test } from 'vitest';
import {
  addDraftProvision,
  clearDraftReform,
  getDraftReform,
  setDraftLabel,
} from '@/libs/draftReform';
import { draftForRegion } from '@/libs/flagship/explore/buildHandoff';

const CTC = {
  path: 'gov.irs.credits.ctc.amount.base',
  breadcrumb: 'IRS → Credits → Child tax credit → Base amount',
  unit: 'currency-USD',
  baselineValue: 2000,
  value: 2500,
};

describe('draftForRegion', () => {
  afterEach(() => {
    clearDraftReform();
  });

  test('given no draft then a new one starts for the state', () => {
    const result = draftForRegion('us', 'state/oh');

    expect(result.keptDraft).toBe(false);
    expect(getDraftReform()?.population).toEqual({ scope: 'national', region: 'state/oh' });
    expect(getDraftReform()?.provisions).toEqual([]);
  });

  test('given a draft with parameters then they stay and only the place changes', () => {
    addDraftProvision('us', CTC as never);
    setDraftLabel('Bigger CTC');

    const result = draftForRegion('us', 'congressional_district/OH-09');

    expect(result.keptDraft).toBe(true);
    expect(getDraftReform()?.label).toBe('Bigger CTC');
    expect(getDraftReform()?.provisions).toHaveLength(1);
    expect(getDraftReform()?.population.region).toBe('congressional_district/OH-09');
  });

  test('given the nation then the draft has no region', () => {
    draftForRegion('us', 'state/oh');
    draftForRegion('us', 'us');

    expect(getDraftReform()?.population).toEqual({ scope: 'national' });
  });
});
