import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { clearSignedInSessionData } from '@/libs/auth/sessionData';
import {
  addDraftProvision,
  clearAllDraftReforms,
  dropHeldDraftReforms,
  getDraftReform,
  holdAllDraftReforms,
  restoreHeldDraftReforms,
  startDraftReform,
} from '@/libs/draftReform';

const OWNER = 'a1b2c3d4';
const PROVISION = {
  path: 'gov.irs.credits.ctc.amount.base',
  breadcrumb: 'IRS → Credits → Child tax credit → Base amount',
  unit: 'currency-USD',
  baselineValue: 2000,
  value: 3000,
};
const DAY_MS = 24 * 60 * 60 * 1000;

beforeEach(() => {
  localStorage.clear();
  clearAllDraftReforms();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-10-16T00:00:00Z'));
  startDraftReform('us', 'manual');
  addDraftProvision('us', PROVISION);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('held drafts', () => {
  test('given drafts held for an account then they are out of sight until it returns', () => {
    // When
    holdAllDraftReforms(OWNER);

    // Then
    expect(getDraftReform()).toBeNull();
    restoreHeldDraftReforms(OWNER);
    expect(getDraftReform()?.provisions).toHaveLength(1);
  });

  test('given a draft started since then restoring keeps it and adds only empty slots', () => {
    // Given
    holdAllDraftReforms(OWNER);
    startDraftReform('us', 'chat');

    // When
    restoreHeldDraftReforms(OWNER);

    // Then: the newer draft in hand stays
    expect(getDraftReform()?.source).toBe('chat');
    expect(getDraftReform()?.provisions).toHaveLength(0);
  });

  test('given held drafts older than a week then they do not come back', () => {
    // Given
    holdAllDraftReforms(OWNER);
    vi.setSystemTime(Date.now() + 8 * DAY_MS);

    // When
    restoreHeldDraftReforms(OWNER);

    // Then
    expect(getDraftReform()).toBeNull();
  });

  test('given a signed-out load after a week then expired held drafts are deleted', () => {
    // Given
    holdAllDraftReforms(OWNER);
    vi.setSystemTime(Date.now() + 8 * DAY_MS);

    // When
    dropHeldDraftReforms({ expiredOnly: true });

    // Then
    expect(localStorage.getItem('pe-draft-reform-held')).toBeNull();
  });

  test('given held drafts within a week then dropping only expired ones keeps them', () => {
    // Given
    holdAllDraftReforms(OWNER);

    // When
    dropHeldDraftReforms({ expiredOnly: true });

    // Then
    restoreHeldDraftReforms(OWNER);
    expect(getDraftReform()?.provisions).toHaveLength(1);
  });

  test('given a sign-out then held drafts go too', () => {
    // Given
    holdAllDraftReforms(OWNER);

    // When
    clearSignedInSessionData();

    // Then
    restoreHeldDraftReforms(OWNER);
    expect(getDraftReform()).toBeNull();
    expect(localStorage.getItem('pe-draft-reform-held')).toBeNull();
  });
});
