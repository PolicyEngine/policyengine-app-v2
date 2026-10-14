import { WEBSITE_URL } from '@/constants';

/**
 * The bill tracker's names and pages for a bill, so a bill reads the same
 * in app v3 and in the tracker, and each links to the other.
 *
 * The rules mirror the tracker's own code (PolicyEngine/state-legislative-tracker):
 * its page routes (src/App.jsx, src/components/RedesignHome.jsx), its place
 * names (src/components/Breadcrumb.jsx), its bill number fallback
 * (src/context/DataContext.jsx), and its join of research rows to
 * processed_bills (src/components/StatePanel.jsx, RedesignHome.jsx).
 * A bill's stage stays the tracker's own word; reading it is billStage's job.
 */

/** Where policyengine.org serves the tracker (its BASE_PATH). */
export const BILL_TRACKER_URL = `${WEBSITE_URL}/us/bill-tracker`;

/** The research row fields the tracker's routes and labels read. */
export interface TrackerResearchRow {
  id: string;
  state?: string | null;
  title?: string | null;
  /** "bill", "blog", "dashboard", "tool". */
  type?: string | null;
  /** "published", "in_progress", "in_review", ... */
  status?: string | null;
}

/** The tracker files federal work under "US"; older federal rows say "all" or "federal". */
const FEDERAL_CODES = new Set(['US', 'ALL', 'FEDERAL']);

/** An id as a URL may carry it: percent-encoded, or in other case. */
function comparableId(id: string): string {
  let decoded = id;
  try {
    decoded = decodeURIComponent(id);
  } catch {
    // A stray "%" is part of the id.
  }
  return decoded.trim().toLowerCase();
}

/**
 * The tracker's page for a research row, as the tracker links it: the
 * bill's own page (/us/bill-tracker/{state}/{id}, "us" for a federal
 * bill), the state's page for a row that is no bill page (a blog post, a
 * row in review), and the tracker's home for an older federal row.
 */
export function trackerBillUrl(row: TrackerResearchRow): string {
  const code = (row.state ?? '').trim().toLowerCase();
  const id = encodeURIComponent(row.id);
  if (!/^[a-z]{2}$/.test(code)) {
    return FEDERAL_CODES.has(code.toUpperCase()) && row.id.startsWith('us-')
      ? `${BILL_TRACKER_URL}/us/${id}`
      : BILL_TRACKER_URL;
  }
  return row.type === 'bill' && row.status !== 'in_review'
    ? `${BILL_TRACKER_URL}/${code}/${id}`
    : `${BILL_TRACKER_URL}/${code}`;
}

/**
 * The tracker's page for a bill known only by its id, as a report URL
 * names it: tracker ids lead with the place ("ks-hb2620", "us-hr1425").
 */
export function trackerUrlForBillId(billId: string): string {
  const id = comparableId(billId);
  return trackerBillUrl({ id, state: id.split('-')[0], type: 'bill' });
}

/** The place as the tracker names it: "Federal", or the state's name. */
export function trackerPlace(state: unknown, stateNames: Record<string, string>): string {
  const code = typeof state === 'string' ? state.trim().toUpperCase() : '';
  if (!code || FEDERAL_CODES.has(code)) {
    return 'Federal';
  }
  return stateNames[code] ?? String(state);
}

/**
 * The bill's name as the tracker shows it: its title, or without one the
 * bill number the id carries ("ut-sb60" is "SB60").
 */
export function trackerBillTitle(row: Pick<TrackerResearchRow, 'id' | 'title'>): string {
  const title = row.title?.trim();
  if (title) {
    return title;
  }
  const parts = row.id.split('-');
  return (parts.length >= 2 ? parts.slice(1).join('-') : row.id).toUpperCase();
}

/** A bill number across spacing and leading-zero variants: "HB 0210" is "HB210". */
function billNumberKey(billNumber: string): string {
  return billNumber
    .replace(/[\s.]+/g, '')
    .toUpperCase()
    .replace(/^([A-Z]+)0+(\d)/, '$1$2');
}

/** The key the tracker joins a processed_bills row by: "UT:HB210". */
export function processedBillKey(state: unknown, billNumber: unknown): string {
  return `${String(state ?? '').toUpperCase()}:${billNumberKey(String(billNumber ?? ''))}`;
}

/** A bill number in a title ("UT HB 210: …" has "HB 210"), as the tracker reads it. */
const TITLE_BILL_NUMBER = /\b(?!FY)([A-Z]{1,3}\.?\s*\d+(?:\s*S\d+)?)/i;

/**
 * The keys a research row's processed_bills row may sit under, in the
 * order the tracker tries them: the bill number in its title, then the
 * one its id carries ("ut-hb-210" and "ut-hb210" are both "UT:HB210").
 */
export function researchBillKeys(row: Pick<TrackerResearchRow, 'id' | 'title'>): string[] {
  const parts = row.id.split('-');
  if (parts.length < 2) {
    return [];
  }
  const fromTitle = row.title?.match(TITLE_BILL_NUMBER)?.[1];
  const keys = [
    ...(fromTitle ? [processedBillKey(parts[0], fromTitle)] : []),
    processedBillKey(parts[0], parts.slice(1).join('')),
  ];
  return [...new Set(keys)];
}

/**
 * The bill a report URL names, by the tracker's id. The tracker links
 * here by that id, so an encoded or upper-case id finds the same bill.
 */
export function findTrackedBill<T extends { id: string }>(
  bills: T[],
  billId: string
): T | undefined {
  const exact = bills.find((bill) => bill.id === billId);
  if (exact) {
    return exact;
  }
  const wanted = comparableId(billId);
  return bills.find((bill) => comparableId(bill.id) === wanted);
}
