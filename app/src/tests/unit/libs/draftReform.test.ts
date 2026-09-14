import { beforeEach, describe, expect, it } from 'vitest';
import {
  addDraftProvision,
  clearDraftReform,
  draftToPolicyParameters,
  draftToReform,
  getDraftReform,
  loadReformIntoDraft,
  provisionFromSearchEntry,
  removeDraftProvision,
  setDraftLabel,
  startDraftReform,
  updateDraftProvisionValue,
} from '@/libs/draftReform';
import type { Reform } from '@/types/ingredients/Reform';

const CTC_PROVISION = {
  path: 'gov.irs.credits.ctc.amount.base[0].amount',
  breadcrumb: 'IRS → Credits → Child tax credit → Base amount',
  unit: 'currency-USD',
  baselineValue: 2000,
  values: [{ startDate: '2026-01-01', endDate: '2100-12-31', value: 2000 }],
};

const CURRENT_LAW_METADATA = {
  [CTC_PROVISION.path]: {
    type: 'parameter' as const,
    parameter: CTC_PROVISION.path,
    label: 'Child tax credit amount',
    values: { '2020-01-01': 2000, '2027-07-01': 3000 },
  },
};

describe('draftReform', () => {
  beforeEach(() => {
    clearDraftReform();
  });

  it('given a provision is added with no draft then a draft is started with that source', () => {
    addDraftProvision('us', CTC_PROVISION, 'chat', 'ask-keyword-v0');

    const draft = getDraftReform();
    expect(draft?.source).toBe('chat');
    expect(draft?.sourceRef).toBe('ask-keyword-v0');
    expect(draft?.provisions).toHaveLength(1);
  });

  it('given the same parameter is added twice then it is not duplicated', () => {
    addDraftProvision('us', CTC_PROVISION);
    addDraftProvision('us', {
      ...CTC_PROVISION,
      values: [{ startDate: '2026-01-01', endDate: '2100-12-31', value: 9999 }],
    });

    expect(getDraftReform()?.provisions).toHaveLength(1);
    expect(getDraftReform()?.provisions[0].values[0].value).toBe(2000);
  });

  it('given a draft for another country then adding replaces it with a fresh draft', () => {
    addDraftProvision('us', CTC_PROVISION);
    addDraftProvision('uk', {
      path: 'gov.hmrc.income_tax.allowances.personal_allowance.amount',
      breadcrumb: 'HMRC → Income tax → Personal allowance',
      unit: 'currency-GBP',
      baselineValue: 12570,
      values: [{ startDate: '2026-01-01', endDate: '2100-12-31', value: 12570 }],
    });

    const draft = getDraftReform();
    expect(draft?.countryId).toBe('uk');
    expect(draft?.provisions).toHaveLength(1);
  });

  it('given a value update then only that provision changes', () => {
    addDraftProvision('us', CTC_PROVISION);
    updateDraftProvisionValue(CTC_PROVISION.path, 3600);

    expect(getDraftReform()?.provisions[0].values[0].value).toBe(3600);
    expect(getDraftReform()?.provisions[0].baselineValue).toBe(2000);
  });

  it('given the last provision is removed then the draft clears entirely', () => {
    addDraftProvision('us', CTC_PROVISION);
    removeDraftProvision(CTC_PROVISION.path);

    expect(getDraftReform()).toBeNull();
  });

  it('given a label is set then it persists on the draft', () => {
    addDraftProvision('us', CTC_PROVISION);
    setDraftLabel('CTC expansion');

    expect(getDraftReform()?.label).toBe('CTC expansion');
  });

  it('given corrupted storage then the draft reads as null', () => {
    localStorage.setItem('pe-draft-reform', '{broken json');

    expect(getDraftReform()).toBeNull();
  });

  it('given a saved reform is loaded then every dated value and the editing id are preserved', () => {
    const reform: Reform = {
      id: 'rf-1',
      userId: 'anonymous',
      countryId: 'us',
      label: 'Saved CTC reform',
      parameters: [
        {
          name: CTC_PROVISION.path,
          values: [
            { startDate: '2026-01-01', endDate: '2026-12-31', value: 3600 },
            { startDate: '2027-01-01', endDate: '2100-12-31', value: 4000 },
          ],
        },
      ],
      baseline: 'current-law',
      provenance: { source: 'chat', ref: 'session-1' },
    };

    loadReformIntoDraft(reform, () => ({
      breadcrumb: CTC_PROVISION.breadcrumb,
      unit: 'currency-USD',
      baselineValue: 2000,
    }));

    const draft = getDraftReform();
    expect(draft?.editingReformId).toBe('rf-1');
    expect(draft?.label).toBe('Saved CTC reform');
    expect(draft?.provisions[0].values).toEqual(reform.parameters[0].values);
    expect(draft?.provisions[0].values).not.toBe(reform.parameters[0].values);
    expect(draft?.provisions[0].baselineValue).toBe(2000);
  });

  it('given a dated saved reform is edited then later values survive policy conversion', () => {
    const reform: Reform = {
      id: 'rf-dated',
      userId: 'anonymous',
      countryId: 'us',
      label: 'Scheduled CTC reform',
      parameters: [
        {
          name: CTC_PROVISION.path,
          values: [
            { startDate: '2026-01-01', endDate: '2026-12-31', value: 3600 },
            { startDate: '2027-01-01', endDate: '2100-12-31', value: 4000 },
          ],
        },
      ],
      baseline: 'current-law',
      provenance: { source: 'manual' },
    };
    loadReformIntoDraft(reform, () => ({
      breadcrumb: CTC_PROVISION.breadcrumb,
      unit: CTC_PROVISION.unit,
      baselineValue: CTC_PROVISION.baselineValue,
    }));

    updateDraftProvisionValue(CTC_PROVISION.path, 3800);

    expect(draftToPolicyParameters(getDraftReform()!, CURRENT_LAW_METADATA)).toEqual([
      {
        name: CTC_PROVISION.path,
        values: [
          { startDate: '2026-01-01', endDate: '2026-12-31', value: 3800 },
          { startDate: '2027-01-01', endDate: '2100-12-31', value: 4000 },
        ],
      },
    ]);
  });

  it('given a legacy scalar draft in storage then it migrates to dated values on read', () => {
    localStorage.setItem(
      'pe-draft-reform',
      JSON.stringify({
        countryId: 'us',
        label: 'Legacy draft',
        provisions: [
          {
            path: CTC_PROVISION.path,
            breadcrumb: CTC_PROVISION.breadcrumb,
            unit: CTC_PROVISION.unit,
            baselineValue: 2000,
            value: 3600,
          },
        ],
        source: 'manual',
      })
    );

    expect(getDraftReform()?.provisions[0]).toEqual({
      path: CTC_PROVISION.path,
      breadcrumb: CTC_PROVISION.breadcrumb,
      unit: CTC_PROVISION.unit,
      baselineValue: 2000,
      values: [{ startDate: '2026-01-01', endDate: '2100-12-31', value: 3600 }],
    });
  });

  it('given a draft then draftToReform produces the store shape with a year-to-forever interval', () => {
    startDraftReform('us', 'bill', 'ut-hb-106');
    addDraftProvision('us', {
      ...CTC_PROVISION,
      values: [{ startDate: '2026-01-01', endDate: '2100-12-31', value: 3600 }],
    });
    setDraftLabel('From HB 106');

    const reform = draftToReform(getDraftReform()!, 'anonymous', CURRENT_LAW_METADATA);

    expect(reform.userId).toBe('anonymous');
    expect(reform.label).toBe('From HB 106');
    expect(reform.provenance).toEqual({ source: 'bill', ref: 'ut-hb-106' });
    expect(reform.parameters[0].name).toBe(CTC_PROVISION.path);
    expect(reform.parameters[0].values[0].value).toBe(3600);
    expect(reform.parameters[0].values[0].endDate).toBe('2100-12-31');
  });

  it('given a draft value matches current law then draftToPolicyParameters removes it', () => {
    startDraftReform('us', 'manual');
    addDraftProvision('us', CTC_PROVISION);

    expect(
      draftToPolicyParameters(getDraftReform()!, {
        [CTC_PROVISION.path]: {
          ...CURRENT_LAW_METADATA[CTC_PROVISION.path],
          values: { '2020-01-01': 2000 },
        },
      })
    ).toEqual([]);
  });

  it('given current law changes inside the draft range then retains only the later difference', () => {
    startDraftReform('us', 'manual');
    addDraftProvision('us', CTC_PROVISION);

    expect(draftToPolicyParameters(getDraftReform()!, CURRENT_LAW_METADATA)).toEqual([
      {
        name: CTC_PROVISION.path,
        values: [{ startDate: '2027-07-01', endDate: '2100-12-31', value: 2000 }],
      },
    ]);
  });

  it('given a search entry and metadata values then provisionFromSearchEntry uses the current value as baseline', () => {
    const provision = provisionFromSearchEntry(
      { path: 'gov.x', breadcrumb: 'X', unit: 'currency-USD' },
      { '2020-01-01': 1000, '2026-01-01': 1500, '2099-01-01': 9999 }
    );

    expect(provision.baselineValue).toBe(1500);
    expect(provision.values).toEqual([
      { startDate: '2026-01-01', endDate: '2100-12-31', value: 1500 },
    ]);
  });
});
