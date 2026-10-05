import type { DraftProvision } from '@/libs/draftReform';
import { humanizeSegment } from './parameterGroups';

/** Breakdown members need their parent to make sense alone. */
const MEMBER_SEGMENT = /^([A-Z][A-Z0-9 _]*|\d+)$/;

/**
 * A provision's display name and the place it sits, from its breadcrumb:
 * "Child tax credit amount" in "IRS · Credits". Breakdown members and
 * bracket fields borrow their parent — "Amount" alone says nothing.
 */
export function provisionName(provision: Pick<DraftProvision, 'breadcrumb' | 'path'>): {
  name: string;
  context: string;
} {
  const parts = (provision.breadcrumb || provision.path).split(' → ');
  const last = parts[parts.length - 1] ?? provision.path;
  if (parts.length > 2 && /^Bracket \d+$/.test(parts[parts.length - 2].trim())) {
    return {
      name: `${humanizeSegment(parts[parts.length - 3])} · ${parts[parts.length - 2]} ${last.toLowerCase()}`,
      context: parts.slice(0, -3).slice(-2).join(' · '),
    };
  }
  const memberOf = parts.length > 1 && MEMBER_SEGMENT.test(last.trim());
  const name = memberOf
    ? `${humanizeSegment(parts[parts.length - 2])} · ${humanizeSegment(last)}`
    : humanizeSegment(last);
  const context = parts
    .slice(0, memberOf ? -2 : -1)
    .slice(-2)
    .join(' · ');
  return { name, context };
}

/** The breadcrumb's tail above a group's members, as row context. */
export function groupContext(breadcrumb: string): string {
  const parts = breadcrumb.split(' → ');
  const bracket = parts.length > 2 && /^Bracket \d+$/.test(parts[parts.length - 2].trim());
  return parts
    .slice(0, bracket ? -3 : -2)
    .slice(-2)
    .join(' · ');
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
