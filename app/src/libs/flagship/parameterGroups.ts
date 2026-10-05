import { ParameterMetadataCollection } from '@/types/metadata/parameterMetadata';

/**
 * Parameters that are one setting split into sibling values: a breakdown
 * by filing status (`…amount.SINGLE`, `…amount.JOINT`), by household
 * size (`…allotment.1`, `…allotment.2`), or a schedule of brackets
 * (`…max[0].amount`, `…max[1].amount`). The draft editor shows a group
 * as one grid, so a reform that touches several members — or all of
 * them, year by year — is one edit rather than one per parameter.
 */
export interface ParameterGroupMember {
  path: string;
  label: string;
}

/**
 * A schedule's members as its brackets: one row per bracket, a cell per
 * field — its threshold, and its rate or amount — so the editor shows
 * the schedule as a table rather than a list of loose values.
 */
export interface BracketLayout {
  /** Columns, threshold first, then "amount" or "rate". */
  fields: string[];
  rows: Array<{ index: number; cells: Record<string, string> }>;
}

export interface ParameterGroup {
  /** The split setting's own path — the same for every member, so it keys the group. */
  key: string;
  /** The setting the members split, e.g. "Standard deduction amount" */
  label: string;
  members: ParameterGroupMember[];
  /** Set for a schedule of brackets only; breakdowns have none. */
  brackets?: BracketLayout;
}

/** An enum member (SINGLE, HEAD_OF_HOUSEHOLD) or a size (1, 2, …) as a path segment. */
const BREAKDOWN_SEGMENT = /^([A-Z][A-Z0-9_]*|\d+)$/;
const BRACKET_PARENT = /^(.*)\[(\d+)\]$/;
const BRACKET_LEAF = /^\[(\d+)\]\.([a-z0-9_]+)$/;

/** HEAD_OF_HOUSEHOLD → "Head of household"; leaves sentence-case labels alone. */
export function humanizeSegment(text: string): string {
  const spaced = text.replace(/_/g, ' ').trim();
  if (spaced !== spaced.toUpperCase()) {
    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
  }
  const lower = spaced.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

/** A bracket field as a reader says it: its threshold, or its rate where the amount is one. */
export function bracketFieldLabel(field: string, unit: string | null | undefined): string {
  if (field === 'rate' || (field === 'amount' && unit === '/1')) {
    return 'rate';
  }
  return humanizeSegment(field).toLowerCase();
}

function labelFor(path: string, parameters: ParameterMetadataCollection): string {
  const segment = path.slice(path.lastIndexOf('.') + 1);
  const label = parameters[path]?.label;
  // Breakdown members often carry their raw segment as the label ("SINGLE").
  return humanizeSegment(label && label.replace(/ /g, '_') !== segment ? label : segment);
}

/**
 * The group `path` belongs to, from the draftable parameters around it,
 * or null when it stands alone (fewer than two members).
 */
export function parameterGroup(
  path: string,
  parameters: ParameterMetadataCollection,
  draftable: Set<string>
): ParameterGroup | null {
  const lastDot = path.lastIndexOf('.');
  if (lastDot <= 0) {
    return null;
  }
  const parent = path.slice(0, lastDot);
  const leaf = path.slice(lastDot + 1);

  const bracket = parent.match(BRACKET_PARENT);
  if (bracket) {
    const root = bracket[1];
    const members: Array<ParameterGroupMember & { index: number; field: string }> = [];
    for (const candidate of draftable) {
      if (!candidate.startsWith(`${root}[`)) {
        continue;
      }
      const match = candidate.slice(root.length).match(BRACKET_LEAF);
      if (match) {
        const index = Number(match[1]);
        members.push({
          path: candidate,
          index,
          field: match[2],
          label: `Bracket ${index + 1} · ${bracketFieldLabel(match[2], parameters[candidate]?.unit)}`,
        });
      }
    }
    // A bracket's threshold comes first, as a schedule reads.
    const fieldOrder = (field: string) => (field === 'threshold' ? 0 : 1);
    members.sort(
      (a, b) =>
        a.index - b.index ||
        fieldOrder(a.field) - fieldOrder(b.field) ||
        a.field.localeCompare(b.field)
    );
    const rows = new Map<number, Record<string, string>>();
    for (const member of members) {
      rows.set(member.index, { ...rows.get(member.index), [member.field]: member.path });
    }
    const fields = [...new Set(members.map((member) => member.field))];
    return members.length > 1
      ? {
          key: root,
          label: labelFor(root, parameters),
          members: members.map(({ path: memberPath, label }) => ({ path: memberPath, label })),
          brackets: {
            fields,
            rows: [...rows].map(([index, cells]) => ({ index, cells })),
          },
        }
      : null;
  }

  if (!BREAKDOWN_SEGMENT.test(leaf)) {
    return null;
  }
  const members: ParameterGroupMember[] = [];
  for (const candidate of draftable) {
    if (candidate.lastIndexOf('.') !== lastDot || !candidate.startsWith(`${parent}.`)) {
      continue;
    }
    const segment = candidate.slice(lastDot + 1);
    if (BREAKDOWN_SEGMENT.test(segment)) {
      members.push({ path: candidate, label: labelFor(candidate, parameters) });
    }
  }
  // Sizes in number order; named members in the model's own order.
  members.sort((a, b) => {
    const [sa, sb] = [a.path.slice(lastDot + 1), b.path.slice(lastDot + 1)];
    return /^\d+$/.test(sa) && /^\d+$/.test(sb) ? Number(sa) - Number(sb) : 0;
  });
  return members.length > 1 ? { key: parent, label: labelFor(parent, parameters), members } : null;
}
