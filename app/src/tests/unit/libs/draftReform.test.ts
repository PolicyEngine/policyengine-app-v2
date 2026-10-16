import { beforeEach, describe, expect, it } from 'vitest';
import {
  addDraftProvision,
  clearDraftReform,
  draftToReform,
  getDraftReform,
  isEditableValue,
  loadProvisionsIntoDraft,
  loadReformIntoDraft,
  provisionFromSearchEntry,
  removeDraftProvision,
  resumeDraftFor,
  setDraftBaseline,
  setDraftLabel,
  setDraftPopulation,
  setDraftWindowYears,
  setDraftYear,
  startDraftReform,
  updateDraftProvisionValue,
} from '@/libs/draftReform';
import type { Reform } from '@/types/ingredients/Reform';

const CTC_PROVISION = {
  path: 'gov.irs.credits.ctc.amount.base[0].amount',
  breadcrumb: 'IRS → Credits → Child tax credit → Base amount',
  unit: 'currency-USD',
  baselineValue: 2000,
  value: 2000,
};

const EITC_PROVISION = {
  path: 'gov.irs.credits.eitc.max[0].amount',
  breadcrumb: 'IRS → Credits → EITC → Maximum → Bracket 1 → Amount',
  unit: 'currency-USD',
  baselineValue: 600,
  value: 600,
};

/** A UK parameter, for drafts in two countries at once. */
const PERSONAL_ALLOWANCE = {
  path: 'gov.hmrc.income_tax.allowances.personal_allowance.amount',
  breadcrumb: 'HMRC → Income tax → Personal allowance',
  unit: 'currency-GBP',
  baselineValue: 12570,
  value: 12570,
};

const MARRIAGE_ALLOWANCE = {
  path: 'gov.hmrc.income_tax.allowances.marriage_allowance.max',
  breadcrumb: 'HMRC → Income tax → Marriage allowance → Maximum',
  unit: 'currency-GBP',
  baselineValue: 1260,
  value: 1260,
};

describe('draftReform', () => {
  beforeEach(() => {
    // Every country's draft, the ones set aside too.
    localStorage.clear();
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
    addDraftProvision('us', { ...CTC_PROVISION, value: 9999 });

    expect(getDraftReform()?.provisions).toHaveLength(1);
    expect(getDraftReform()?.provisions[0].value).toBe(2000);
  });

  it('given a draft for another country then adding starts a fresh draft for this one', () => {
    addDraftProvision('us', CTC_PROVISION);
    addDraftProvision('uk', PERSONAL_ALLOWANCE);

    const draft = getDraftReform();
    expect(draft?.countryId).toBe('uk');
    expect(draft?.provisions).toHaveLength(1);
  });

  it('given a draft for another country then the first draft is kept for its own country', () => {
    addDraftProvision('us', CTC_PROVISION);
    setDraftLabel('US plan');
    addDraftProvision('uk', PERSONAL_ALLOWANCE);

    resumeDraftFor('us');

    expect(getDraftReform()).toMatchObject({
      countryId: 'us',
      label: 'US plan',
      provisions: [CTC_PROVISION],
    });
  });

  it('given a country with a draft set aside then adding there goes on with that draft', () => {
    addDraftProvision('uk', PERSONAL_ALLOWANCE);
    addDraftProvision('us', CTC_PROVISION);

    addDraftProvision('uk', MARRIAGE_ALLOWANCE);

    expect(getDraftReform()?.provisions.map((provision) => provision.path)).toEqual([
      PERSONAL_ALLOWANCE.path,
      MARRIAGE_ALLOWANCE.path,
    ]);
  });

  it('given a draft is discarded then it does not come back, and the other country keeps its own', () => {
    addDraftProvision('us', CTC_PROVISION);
    addDraftProvision('uk', PERSONAL_ALLOWANCE);

    clearDraftReform();

    expect(resumeDraftFor('uk')).toBeNull();
    expect(resumeDraftFor('us')?.provisions).toEqual([CTC_PROVISION]);
  });

  it('given a value update then only that provision changes', () => {
    addDraftProvision('us', CTC_PROVISION);
    updateDraftProvisionValue(CTC_PROVISION.path, 3600);

    expect(getDraftReform()?.provisions[0].value).toBe(3600);
    expect(getDraftReform()?.provisions[0].baselineValue).toBe(2000);
  });

  it('given the last provision is removed then the draft clears entirely', () => {
    addDraftProvision('us', CTC_PROVISION);
    removeDraftProvision(CTC_PROVISION.path);

    expect(getDraftReform()).toBeNull();
  });

  it('given the last provision is removed from a named draft then the draft keeps its settings', () => {
    // The user swaps the one parameter for another: the name and years stay.
    addDraftProvision('us', CTC_PROVISION);
    setDraftLabel('QA build flow test');
    setDraftYear(2027);
    setDraftWindowYears(10);
    setDraftPopulation({ scope: 'national', region: 'state/ca' });

    removeDraftProvision(CTC_PROVISION.path);

    expect(getDraftReform()).toMatchObject({
      label: 'QA build flow test',
      year: 2027,
      windowYears: 10,
      population: { scope: 'national', region: 'state/ca' },
      provisions: [],
    });
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

  it('given a saved reform is loaded then provisions carry resolved metadata and the editing id', () => {
    const reform: Reform = {
      id: 'rf-1',
      countryId: 'us',
      label: 'Saved CTC reform',
      parameters: [
        {
          name: CTC_PROVISION.path,
          values: [{ startDate: '2026-01-01', endDate: '2100-12-31', value: 3600 }],
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
    expect(draft?.provisions[0].value).toBe(3600);
    expect(draft?.provisions[0].baselineValue).toBe(2000);
  });

  it('given a report reopened for editing with its reform then the draft edits that reform', () => {
    loadProvisionsIntoDraft('us', [{ ...CTC_PROVISION, value: 3600 }], {
      label: 'CTC expansion',
      year: 2027,
      reformId: 'rf-ran',
    });

    const draft = getDraftReform();
    expect(draft?.editingReformId).toBe('rf-ran');
    expect(draft?.year).toBe(2027);
  });

  it('given a report reopened for editing without a reform then saving makes a new one', () => {
    loadProvisionsIntoDraft('us', [{ ...CTC_PROVISION, value: 3600 }], { label: 'Shared' });

    expect(getDraftReform()?.editingReformId).toBeUndefined();
  });

  it('given a draft then draftToReform produces the store shape with a year-to-forever interval', () => {
    startDraftReform('us', 'bill', 'ut-hb-106');
    addDraftProvision('us', { ...CTC_PROVISION, value: 3600 });
    setDraftLabel('From HB 106');

    const reform = draftToReform(getDraftReform()!);

    expect(reform).not.toHaveProperty('userId');
    expect(reform.label).toBe('From HB 106');
    expect(reform.provenance).toEqual({ source: 'bill', ref: 'ut-hb-106' });
    expect(reform.parameters[0].name).toBe(CTC_PROVISION.path);
    expect(reform.parameters[0].values[0].value).toBe(3600);
    expect(reform.parameters[0].values[0].endDate).toBe('2100-12-31');
  });

  it('given a parameter added but left at current law then saving leaves it out', () => {
    addDraftProvision('us', CTC_PROVISION);
    addDraftProvision('us', { ...EITC_PROVISION, value: 900 });

    const reform = draftToReform(getDraftReform()!);

    expect(reform.parameters.map((parameter) => parameter.name)).toEqual([EITC_PROVISION.path]);
  });

  it('given current law then a value reset to it saves as nothing, and a freeze still saves', () => {
    // Current law moves on in 2027: holding 2,000 from 2026 freezes it.
    const currentLaw = { '2026-01-01': 2000, '2027-01-01': 2100 };
    addDraftProvision('us', {
      ...CTC_PROVISION,
      intervals: [{ startDate: '2026-01-01', endDate: '2026-12-31', value: 2000 }],
    });
    addDraftProvision('us', {
      ...EITC_PROVISION,
      intervals: [{ startDate: '2026-01-01', endDate: '2100-12-31', value: 600 }],
    });

    const reform = draftToReform(getDraftReform()!, (path) =>
      path === CTC_PROVISION.path ? currentLaw : { '2026-01-01': 600, '2027-01-01': 650 }
    );

    expect(reform.parameters.map((parameter) => parameter.name)).toEqual([EITC_PROVISION.path]);
  });

  it('given a saved reform to compare with then the draft keeps it, and current law clears it', () => {
    addDraftProvision('us', CTC_PROVISION);

    // A new draft compares with current law.
    expect(getDraftReform()).not.toHaveProperty('baselineReformId');
    setDraftBaseline('rf-plan-b');
    expect(getDraftReform()?.baselineReformId).toBe('rf-plan-b');
    setDraftBaseline(undefined);
    expect(getDraftReform()?.baselineReformId).toBeUndefined();
  });

  it('given a baseline then the draft saves as the same reform, compared with nothing', () => {
    addDraftProvision('us', { ...CTC_PROVISION, value: 3600 });
    setDraftBaseline('rf-plan-b');

    // The comparison is the run's, not the reform's.
    expect(draftToReform(getDraftReform()!).baseline).toBe('current-law');
  });

  it('given a report back in the draft then it keeps the comparison it ran with', () => {
    loadProvisionsIntoDraft('us', [{ ...CTC_PROVISION, value: 3600 }], {
      baselineReformId: 'rf-plan-b',
    });
    expect(getDraftReform()?.baselineReformId).toBe('rf-plan-b');

    loadProvisionsIntoDraft('us', [{ ...CTC_PROVISION, value: 3600 }], { baselineReformId: null });
    expect(getDraftReform()).not.toHaveProperty('baselineReformId');
  });

  it('given provisions loaded with no source then the draft is hand-built', () => {
    loadProvisionsIntoDraft('us', [{ ...CTC_PROVISION, value: 3600 }]);

    expect(getDraftReform()?.source).toBe('manual');
    expect(getDraftReform()).not.toHaveProperty('sourceRef');
  });

  it('given provisions loaded from a bill then the draft keeps the bill as its source', () => {
    loadProvisionsIntoDraft('us', [{ ...CTC_PROVISION, value: 3600 }], {
      source: 'bill',
      sourceRef: 'us-hr1425',
    });

    expect(getDraftReform()).toMatchObject({ source: 'bill', sourceRef: 'us-hr1425' });
  });

  it('given a search entry and metadata values then provisionFromSearchEntry uses the current value as baseline', () => {
    const provision = provisionFromSearchEntry(
      { path: 'gov.x', breadcrumb: 'X', unit: 'currency-USD' },
      { '2020-01-01': 1000, '2026-01-01': 1500, '2099-01-01': 9999 }
    );

    expect(provision.baselineValue).toBe(1500);
    expect(provision.value).toBe(1500);
  });

  it('given no limit then a number box can set it, while lists and text stay read only', () => {
    // Metadata sends no limit as the text "Infinity".
    expect(isEditableValue('Infinity')).toBe(true);
    expect(isEditableValue('-Infinity')).toBe(true);
    expect(isEditableValue(2200)).toBe(true);
    expect(isEditableValue(['employee_medicare_tax'])).toBe(false);
    expect(isEditableValue('CITIZEN')).toBe(false);
  });
});
