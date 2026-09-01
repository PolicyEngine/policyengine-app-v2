import { useSyncExternalStore } from 'react';
import { FOREVER } from '@/constants';
import { CountryId } from '@/libs/countries';
import { Reform, ReformSource } from '@/types/ingredients/Reform';
import { getCurrentValue } from '@/utils/parameterValues';

/**
 * The draft reform being composed in the flagship shell.
 *
 * Ask and Build both add provisions here; the ReformPreviewCard edits
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
    provisions: draft.provisions.map((p) => (p.path === path ? { ...p, value } : p)),
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
      return {
        path: parameter.name,
        breadcrumb,
        unit,
        baselineValue,
        value: parameter.values[0]?.value ?? baselineValue,
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
  const year = new Date().getFullYear();
  return {
    userId,
    countryId: draft.countryId,
    label: draft.label || null,
    parameters: draft.provisions.map((provision) => ({
      name: provision.path,
      values: [
        {
          startDate: `${year}-01-01`,
          endDate: FOREVER,
          value: provision.value,
        },
      ],
    })),
    baseline: 'current-law',
    provenance: { source: draft.source, ref: draft.sourceRef },
  };
}

/** React hook: subscribe to the draft reform across flagship pages. */
export function useDraftReform(): DraftReform | null {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}
