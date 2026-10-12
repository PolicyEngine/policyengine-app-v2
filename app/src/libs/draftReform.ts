import { useSyncExternalStore } from 'react';
import { CURRENT_YEAR, FOREVER } from '@/constants';
import { CountryId } from '@/libs/countries';
import { Reform, ReformSource } from '@/types/ingredients/Reform';
import { ValueInterval, ValueIntervalCollection } from '@/types/subIngredients/valueInterval';
import { getCurrentValue } from '@/utils/parameterValues';

/**
 * The draft reform being composed in the flagship shell.
 *
 * Ask and Build both add provisions here; Build's reform table edits
 * values inline; saving materializes it into the reform store. Persisted
 * in localStorage so it survives navigation between the flagship pages
 * (which are separate Next.js routes).
 */
export interface DraftProvision {
  path: string;
  breadcrumb: string;
  unit: string | null;
  baselineValue: any;
  /** The proposed new value; starts equal to baseline until edited */
  value: any;
  /**
   * Dated changes, when the reform varies over time: each interval sets
   * the parameter for its dates, and current law holds outside them.
   * When present they replace `value`, which then only mirrors the value
   * in effect for the draft's year so single-value readers stay right.
   */
  intervals?: ValueInterval[];
  /**
   * How a value set from one year on moves after it — 'fixed',
   * 'current_law', or an index's parameter path (see uprating). Set by
   * the one-value editor; a schedule set by year or dates has none.
   */
  growth?: string;
  /** With a growth: the first year the value moves (default: the year after it is set). */
  growthStart?: number;
  /** With a growth: the year whose index level it moves from (default: the year it is set). */
  growthBase?: number;
  /** With a growth: grown values round to a multiple of this… */
  growthRoundTo?: number;
  /** …up, down, or to the nearest. */
  growthRound?: 'nearest' | 'down' | 'up';
}

/**
 * The population component of the draft — who the reform applies to.
 * National (full microsimulation population) is the default; household
 * unlocks with the run bridge.
 */
export interface DraftPopulation {
  scope: 'national' | 'household';
}

export interface DraftReform {
  countryId: CountryId;
  label: string;
  provisions: DraftProvision[];
  population: DraftPopulation;
  source: ReformSource;
  sourceRef?: string;
  /** Set when editing an existing saved reform; save updates instead of creating */
  editingReformId?: string;
  /**
   * When this draft began. Per-draft UI state (the panel's fold) keys on
   * it, so a new draft never inherits how the last one was left.
   */
  startedAt?: number;
  /** The year the report simulates; the current year when unset. */
  year?: number;
}

/** The year a draft's report simulates. */
export function draftYear(draft: Pick<DraftReform, 'year'> | null | undefined): number {
  return draft?.year ?? Number(CURRENT_YEAR);
}

/**
 * The provision as dated intervals — its own when it varies over time,
 * otherwise its single value from the current year onward (the shape
 * reports and saved reforms have always used).
 */
export function provisionIntervals(
  provision: Pick<DraftProvision, 'value' | 'intervals'>
): ValueInterval[] {
  if (provision.intervals && provision.intervals.length > 0) {
    return provision.intervals;
  }
  return [{ startDate: `${CURRENT_YEAR}-01-01`, endDate: FOREVER, value: provision.value }];
}

/**
 * Whether two parameter values are the same — by content, since list
 * values come back from storage as new arrays.
 */
export function sameParameterValue(a: unknown, b: unknown): boolean {
  if (a === b) {
    return true;
  }
  return typeof a === 'object' && typeof b === 'object' && JSON.stringify(a) === JSON.stringify(b);
}

/** True once the provision differs from current law. */
export function provisionChanged(
  provision: Pick<DraftProvision, 'value' | 'baselineValue' | 'intervals'>
): boolean {
  return (
    Boolean(provision.intervals?.length) ||
    !sameParameterValue(provision.value, provision.baselineValue)
  );
}

/** Same value, allowing for the float noise a percentage box leaves (7.65 / 100). */
function sameInEffect(a: unknown, b: unknown): boolean {
  if (typeof a === 'number' && typeof b === 'number') {
    return Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
  }
  return sameParameterValue(a, b);
}

/**
 * Whether the provision changes anything a simulation would see: some
 * value it sets differs from current law on some day it covers. A value
 * typed back to current law changes nothing; one held where current law
 * moves on (a frozen amount) does. Without current law to compare, any
 * set value counts.
 */
export function provisionAdjusts(
  provision: Pick<DraftProvision, 'value' | 'baselineValue' | 'intervals'>,
  currentLaw: Record<string, unknown> | undefined
): boolean {
  if (!provisionChanged(provision)) {
    return false;
  }
  if (!currentLaw) {
    return true;
  }
  const baseline = new ValueIntervalCollection(currentLaw as Record<string, any>);
  const changeDates = Object.keys(currentLaw);
  return provisionIntervals(provision).some((interval) =>
    [
      interval.startDate,
      // Every day current law changes inside the interval, too.
      ...changeDates.filter((date) => date > interval.startDate && date <= interval.endDate),
    ].some((date) => !sameInEffect(interval.value, baseline.getValueAtDate(date)))
  );
}

/** Numbers and yes/no switches: the values a number box or switch sets. */
export function isEditableValue(value: unknown): boolean {
  return typeof value === 'number' || typeof value === 'boolean';
}

/** True when the provision's intervals amount to more than one value from one date. */
export function provisionVariesOverTime(provision: Pick<DraftProvision, 'intervals'>): boolean {
  const intervals = provision.intervals ?? [];
  return intervals.length > 1 || (intervals.length === 1 && intervals[0].endDate !== FOREVER);
}

/** The proposed value in effect on 1 January of `year`, or null where current law holds. */
export function provisionValueInYear(
  provision: Pick<DraftProvision, 'value' | 'intervals'>,
  year: number
): any {
  const value = new ValueIntervalCollection(provisionIntervals(provision)).getValueAtDate(
    `${year}-01-01`
  );
  return value === undefined ? null : value;
}

const STORAGE_KEY = 'pe-draft-reform';
const CHANGE_EVENT = 'pe-draft-reform-change';

function readDraft(): DraftReform | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return null;
    }
    const parsed = JSON.parse(stored);
    if (!parsed || !Array.isArray(parsed.provisions)) {
      return null;
    }
    // Drafts saved before the population component existed default to national.
    return { population: { scope: 'national' }, ...parsed };
  } catch {
    return null;
  }
}

function writeDraft(draft: DraftReform | null): void {
  try {
    if (draft) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    cachedDraft = draft;
    cachedRaw = draft ? JSON.stringify(draft) : null;
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    // localStorage unavailable — draft simply doesn't persist
  }
}

// Cache so getSnapshot returns a stable reference between changes
// (useSyncExternalStore requires referential stability).
let cachedDraft: DraftReform | null = null;
let cachedRaw: string | null = null;

function getSnapshot(): DraftReform | null {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedDraft = readDraft();
  }
  return cachedDraft;
}

function subscribe(callback: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener('storage', callback);
  };
}

export function getDraftReform(): DraftReform | null {
  return getSnapshot();
}

export function clearDraftReform(): void {
  writeDraft(null);
}

/**
 * The report a run from the draft started. Running hands the draft over
 * to its report: the report's page clears it on opening — not the run
 * itself, which would blank Build while the report loads — so going
 * back to Build starts fresh.
 */
let runReportId: string | null = null;

export function markDraftRun(userReportId: string): void {
  runReportId = userReportId;
}

export function clearDraftAfterRun(userReportId: string): void {
  if (userReportId && runReportId === userReportId) {
    runReportId = null;
    clearDraftReform();
  }
}

/** A report's reform back in the draft, to edit and run again. */
export function loadProvisionsIntoDraft(
  countryId: CountryId,
  provisions: DraftProvision[],
  options: { label?: string; year?: number } = {}
): void {
  writeDraft({
    countryId,
    label: options.label ?? '',
    provisions: provisions.map((provision) => ({ ...provision })),
    population: { scope: 'national' },
    source: 'manual',
    startedAt: Date.now(),
    ...(options.year ? { year: options.year } : {}),
  });
}

export function startDraftReform(
  countryId: CountryId,
  source: ReformSource,
  sourceRef?: string
): DraftReform {
  const draft: DraftReform = {
    countryId,
    label: '',
    provisions: [],
    population: { scope: 'national' },
    source,
    sourceRef,
    startedAt: Date.now(),
  };
  writeDraft(draft);
  return draft;
}

/** Adds a provision (no-op if the parameter is already in the draft). */
export function addDraftProvision(
  countryId: CountryId,
  provision: DraftProvision,
  source: ReformSource = 'manual',
  sourceRef?: string
): void {
  const existing = getSnapshot();
  const draft =
    existing && existing.countryId === countryId
      ? existing
      : startDraftReform(countryId, source, sourceRef);

  if (draft.provisions.some((p) => p.path === provision.path)) {
    return;
  }
  writeDraft({ ...draft, provisions: [...draft.provisions, provision] });
}

export function updateDraftProvisionValue(path: string, value: any): void {
  const draft = getSnapshot();
  if (!draft) {
    return;
  }
  writeDraft({
    ...draft,
    // A single value replaces any dated changes: one value, from now on.
    provisions: draft.provisions.map((p) =>
      p.path === path ? { ...p, value, intervals: undefined } : p
    ),
  });
}

/**
 * Sets a provision's dated changes, adding the provision first when it is
 * not in the draft yet (editing a sibling in a breakdown grid adds it).
 * An empty list resets the provision to current law.
 */
export function setDraftProvisionIntervals(
  countryId: CountryId,
  provision: Omit<DraftProvision, 'intervals'>,
  intervals: ValueInterval[],
  /** The growth the intervals follow; omitted, a hand-set schedule clears it. */
  growth?: string,
  /** When that growth applies, and how its values round, if it moves the value. */
  timing?: {
    start: number;
    base: number;
    roundTo?: number;
    round?: 'nearest' | 'down' | 'up';
  }
): void {
  addDraftProvision(countryId, provision);
  const draft = getSnapshot();
  if (!draft) {
    return;
  }
  const year = draftYear(draft);
  writeDraft({
    ...draft,
    provisions: draft.provisions.map((p) => {
      if (p.path !== provision.path) {
        return p;
      }
      if (intervals.length === 0) {
        return {
          ...p,
          value: p.baselineValue,
          intervals: undefined,
          growth: undefined,
          growthStart: undefined,
          growthBase: undefined,
          growthRoundTo: undefined,
          growthRound: undefined,
        };
      }
      const inYear = provisionValueInYear({ value: p.value, intervals }, year);
      return {
        ...p,
        intervals,
        value: inYear ?? p.baselineValue,
        growth,
        growthStart: timing?.start,
        growthBase: timing?.base,
        growthRoundTo: timing?.roundTo,
        growthRound: timing?.round,
      };
    }),
  });
}

/**
 * Sets one value from 1 January of `year` onward, over whatever dated
 * changes come before it — the inline edit and the grid's one-value mode.
 */
export function setDraftProvisionValueFrom(
  countryId: CountryId,
  provision: Omit<DraftProvision, 'intervals'> & { intervals?: ValueInterval[] },
  year: number,
  value: any
): void {
  const collection = new ValueIntervalCollection(
    provisionChanged(provision) ? provisionIntervals(provision) : []
  );
  collection.addInterval({ startDate: `${year}-01-01`, endDate: FOREVER, value });
  setDraftProvisionIntervals(countryId, provision, collection.getIntervals());
}

export function setDraftYear(year: number): void {
  const draft = getSnapshot();
  if (!draft) {
    return;
  }
  writeDraft({
    ...draft,
    year,
    // Dated provisions mirror the value in effect for the draft's year.
    provisions: draft.provisions.map((p) =>
      p.intervals?.length ? { ...p, value: provisionValueInYear(p, year) ?? p.baselineValue } : p
    ),
  });
}

/**
 * The provisions as they stand in one year — current law then, and the
 * reform's value then — so a report's "current law → new value" lines
 * describe the year it simulates, not the year a value was typed.
 */
export function provisionsForYear(
  provisions: DraftProvision[],
  year: number,
  currentLawAt: (path: string, year: number) => any
): DraftProvision[] {
  return provisions.map((p) => {
    const baseline = currentLawAt(p.path, year) ?? p.baselineValue;
    const changed = provisionChanged(p);
    return {
      ...p,
      baselineValue: baseline,
      value: changed ? (provisionValueInYear(p, year) ?? baseline) : baseline,
    };
  });
}

export function removeDraftProvision(path: string): void {
  const draft = getSnapshot();
  if (!draft) {
    return;
  }
  const provisions = draft.provisions.filter((p) => p.path !== path);
  if (provisions.length === 0 && !draft.editingReformId) {
    writeDraft(null);
    return;
  }
  writeDraft({ ...draft, provisions });
}

export function setDraftLabel(label: string): void {
  const draft = getSnapshot();
  if (!draft) {
    return;
  }
  writeDraft({ ...draft, label });
}

export function setDraftPopulation(population: DraftPopulation): void {
  const draft = getSnapshot();
  if (!draft) {
    return;
  }
  writeDraft({ ...draft, population });
}

/** Loads a saved reform into the composer for editing. */
export function loadReformIntoDraft(
  reform: Reform,
  resolve: (path: string) => { breadcrumb: string; unit: string | null; baselineValue: any }
): void {
  writeDraft({
    countryId: reform.countryId,
    label: reform.label ?? '',
    population: { scope: 'national' },
    provisions: reform.parameters.map((parameter) => {
      const { breadcrumb, unit, baselineValue } = resolve(parameter.name);
      const single =
        parameter.values.length === 1 &&
        parameter.values[0].startDate === `${CURRENT_YEAR}-01-01` &&
        parameter.values[0].endDate === FOREVER;
      return {
        path: parameter.name,
        breadcrumb,
        unit,
        baselineValue,
        value: parameter.values[0]?.value ?? baselineValue,
        // Anything but one value from this year on keeps its dates.
        ...(!single && parameter.values.length > 0 && { intervals: parameter.values }),
      };
    }),
    source: reform.provenance.source,
    sourceRef: reform.provenance.ref,
    editingReformId: reform.id,
    startedAt: Date.now(),
  });
}

/** Builds a provision from a search entry plus the parameter's metadata values. */
export function provisionFromSearchEntry(
  entry: { path: string; breadcrumb: string; unit: string | null },
  values: Record<string, any> | undefined | null
): DraftProvision {
  const baselineValue = getCurrentValue(values);
  return {
    path: entry.path,
    breadcrumb: entry.breadcrumb,
    unit: entry.unit,
    baselineValue,
    value: baselineValue,
  };
}

/** Converts the draft to the Reform shape for the store. */
export function draftToReform(
  draft: DraftReform,
  userId: string
): Omit<Reform, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    userId,
    countryId: draft.countryId,
    label: draft.label || null,
    parameters: draft.provisions.map((provision) => ({
      name: provision.path,
      values: provisionIntervals(provision),
    })),
    baseline: 'current-law',
    provenance: { source: draft.source, ref: draft.sourceRef },
  };
}

/** React hook: subscribe to the draft reform across flagship pages. */
export function useDraftReform(): DraftReform | null {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}
