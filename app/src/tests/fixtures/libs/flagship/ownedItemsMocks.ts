import type { OwnedItem } from '@/libs/flagship/ownedItems';

export const OWNED_REFORMS_KEY = 'pe-flagship-owned-reforms';
export const OWNED_REPORTS_KEY = 'pe-flagship-owned-reports';

/** Central ids are UUIDs the server picks. */
export const CENTRAL_REFORM_ID = '0b6f0c1e-5d0a-4c38-9a51-6c7f2f3e8a01';
export const OTHER_CENTRAL_REFORM_ID = '7d2c9e4a-1b3f-4e6d-8a2b-9c0d1e2f3a4b';
export const UK_CENTRAL_REFORM_ID = 'c3a1b2d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';
export const CENTRAL_REPORT_ID = '5e8f7a6b-4c3d-4e2f-9a1b-0c9d8e7f6a5b';

/** 64 hex characters, as the server issues them. */
export const EDIT_TOKEN = 'a'.repeat(64);
export const OTHER_EDIT_TOKEN = 'b'.repeat(64);

export const API_REPORT_ID = '4512';
export const OTHER_API_REPORT_ID = '9999';

export const ADDED_AT = '2026-10-01T00:00:00.000Z';

export const ownedUsReform: OwnedItem = {
  id: CENTRAL_REFORM_ID,
  countryId: 'us',
  editToken: EDIT_TOKEN,
  addedAt: ADDED_AT,
};

export const ownedUkReform: OwnedItem = {
  id: UK_CENTRAL_REFORM_ID,
  countryId: 'uk',
  editToken: OTHER_EDIT_TOKEN,
  addedAt: ADDED_AT,
};

export const ownedReport: OwnedItem = {
  id: CENTRAL_REPORT_ID,
  countryId: 'us',
  editToken: EDIT_TOKEN,
  apiReportId: API_REPORT_ID,
  addedAt: ADDED_AT,
};

/** Seeds this browser's index as an earlier session would have left it. */
export function seedOwnedItems(key: string, items: OwnedItem[]): void {
  localStorage.setItem(key, JSON.stringify(items));
}
