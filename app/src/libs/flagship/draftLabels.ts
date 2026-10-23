import dayjs from 'dayjs';
import { FOREVER } from '@/constants';
import type { DraftProvision } from '@/libs/draftReform';
import type { ValueInterval } from '@/types/subIngredients/valueInterval';
import { humanizeSegment } from './parameterGroups';

/** Breakdown members need their parent to make sense alone. */
const MEMBER_SEGMENT = /^([A-Z][A-Z0-9 _]*|\d+)$/;

/**
 * A provision's display name, from its breadcrumb: "Child tax credit
 * amount". Breakdown members and bracket fields borrow their parent —
 * "Amount" alone says nothing.
 */
export function provisionName(provision: Pick<DraftProvision, 'breadcrumb' | 'path'>): string {
  const parts = (provision.breadcrumb || provision.path).split(' → ');
  const last = parts[parts.length - 1] ?? provision.path;
  if (parts.length > 2 && /^Bracket \d+$/.test(parts[parts.length - 2].trim())) {
    return `${humanizeSegment(parts[parts.length - 3])} · ${parts[parts.length - 2]} ${last.toLowerCase()}`;
  }
  return parts.length > 1 && MEMBER_SEGMENT.test(last.trim())
    ? `${humanizeSegment(parts[parts.length - 2])} · ${humanizeSegment(last)}`
    : humanizeSegment(last);
}

/**
 * A report provision's name, as the report's table and adjust panel say
 * it. The child tax credit's base amount reads as what it is, the
 * maximum credit per child; everything else as `provisionName`.
 */
export function reportProvisionName(
  provision: Pick<DraftProvision, 'breadcrumb' | 'path'>
): string {
  return provision.path.startsWith('gov.irs.credits.ctc.amount.base')
    ? 'Maximum credit per child'
    : provisionName(provision);
}

/**
 * A change as a reader says it: "$1,700 → $2,500", or for a set of
 * variables, what the reform takes out and puts in.
 */
export function describeChange(
  baseline: unknown,
  value: unknown,
  formatScalar: (value: unknown) => string,
  variableLabel: (name: string) => string = (name) => name
): string {
  if (Array.isArray(baseline) && Array.isArray(value)) {
    const removed = baseline.filter((name) => !value.includes(name)).map(variableLabel);
    const added = value.filter((name) => !baseline.includes(name)).map(variableLabel);
    const parts = [
      removed.length ? `removes ${removed.join(', ')}` : '',
      added.length ? `adds ${added.join(', ')}` : '',
    ].filter(Boolean);
    return parts.length ? parts.join('; ') : 'no change';
  }
  return `${formatScalar(baseline)} → ${formatScalar(value)}`;
}

const isYearStart = (date: string) => date.endsWith('-01-01');
const isYearEnd = (date: string) => date.endsWith('-12-31');

/**
 * A day as the country writes it: "Jan 1, 2026" in the US, "1 Jan 2026"
 * in the UK. `long` spells the month out: "January 1, 2026", "1 January 2026".
 */
export function dayLabel(
  date: string | Date | dayjs.Dayjs,
  countryId: string = 'us',
  { long = false }: { long?: boolean } = {}
): string {
  const month = long ? 'MMMM' : 'MMM';
  return dayjs(date).format(countryId === 'uk' ? `D ${month} YYYY` : `${month} D, YYYY`);
}

/** A UK tax year as it is written: 2027 is "2027-28". */
export function taxYearLabel(year: number | string): string {
  const start = Number(year);
  return `${start}-${String((start + 1) % 100).padStart(2, '0')}`;
}

/**
 * A report's year as the country counts it. US results are for a
 * calendar year ("2027"); UK results are for a fiscal year, April to
 * March, so a UK year reads as the tax year it starts ("2027-28").
 */
export function reportYearLabel(year: number | string, countryId: string = 'us'): string {
  return countryId === 'uk' ? taxYearLabel(year) : String(year);
}

/** A run of report years: "2026–2030" in the US, "2026-27 to 2030-31" in the UK. */
export function reportYearSpanLabel(
  first: number | string,
  last: number | string,
  countryId: string = 'us'
): string {
  return countryId === 'uk'
    ? `${taxYearLabel(first)} to ${taxYearLabel(last)}`
    : `${first}–${last}`;
}

/** Said wherever UK results show: their years are fiscal years. */
export const UK_FISCAL_YEAR_NOTE = 'UK figures are for fiscal years, April to March.';

/**
 * When a change starts or ends, for a table of changes. The UK model
 * reads a year in its tax year (from April), so a change from 1 January
 * applies from that tax year, and one to 31 December applies to the end
 * of that tax year: they read "2027-28", not "1 Jan 2027". Other dates,
 * and every US date, read as the day.
 */
export function changeDateLabel(date: string, countryId: string = 'us'): string {
  if (countryId === 'uk' && (isYearStart(date) || isYearEnd(date))) {
    return taxYearLabel(date.slice(0, 4));
  }
  return dayLabel(date, countryId);
}

const startLabel = (date: string, countryId: string) =>
  isYearStart(date) ? date.slice(0, 4) : dayLabel(date, countryId);

/** When one change applies: "from 2027", "2027 only", "2027–2029", or its dates. */
export function periodLabel(
  { startDate, endDate }: Pick<ValueInterval, 'startDate' | 'endDate'>,
  countryId: string = 'us'
) {
  if (endDate === FOREVER) {
    return `from ${startLabel(startDate, countryId)}`;
  }
  if (isYearStart(startDate) && isYearEnd(endDate)) {
    const [from, to] = [startDate.slice(0, 4), endDate.slice(0, 4)];
    return from === to ? `${from} only` : `${from}–${to}`;
  }
  return `${dayLabel(startDate, countryId)} – ${dayLabel(endDate, countryId)}`;
}

/**
 * A provision's changes in brief, as its row says them: the new value
 * and when it applies — "$2,500", "2026 only" — or for a schedule, its
 * first and last values and how many steps it takes.
 */
export function summarizeIntervals(
  intervals: ValueInterval[],
  formatScalar: (value: unknown) => string,
  countryId: string = 'us'
): { value: string; when: string } {
  if (intervals.length === 0) {
    return { value: '', when: '' };
  }
  const [first, last] = [intervals[0], intervals[intervals.length - 1]];
  if (intervals.length === 1) {
    return { value: formatScalar(first.value), when: periodLabel(first, countryId) };
  }
  const [from, to] = [formatScalar(first.value), formatScalar(last.value)];
  return {
    value: from === to ? from : `${from} → ${to}`,
    when: `${intervals.length} periods from ${startLabel(first.startDate, countryId)}`,
  };
}

/** What an unnamed reform, and its report, is called. */
export const UNTITLED_REFORM = 'Untitled reform';

/** Whether a reform's name is one the app gave it, not the user ("Draft reform" before). */
export function isUntitledReform(name: string | null | undefined): boolean {
  const trimmed = (name ?? '').trim();
  return trimmed === '' || trimmed === UNTITLED_REFORM || trimmed === 'Draft reform';
}
