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

/**
 * UK places that breakdowns split by — the nations, the English
 * regions, Northern Ireland's councils — as the model spells their
 * members. They read as proper names ("Northern Ireland", "England
 * outside London"), not as sentence case ("Northern ireland").
 */
const UK_PLACE_SEGMENTS = new Set([
  'UNITED_KINGDOM',
  'GREAT_BRITAIN',
  'ENGLAND',
  'SCOTLAND',
  'WALES',
  'NORTHERN_IRELAND',
  'ENGLAND_OUTSIDE_LONDON',
  'NORTH_EAST',
  'NORTH_WEST',
  'YORKSHIRE',
  'YORKSHIRE_AND_THE_HUMBER',
  'EAST_MIDLANDS',
  'WEST_MIDLANDS',
  'EAST_OF_ENGLAND',
  'LONDON',
  'SOUTH_EAST',
  'SOUTH_WEST',
  'ANTRIM_AND_NEWTOWNABBEY',
  'ARDS_AND_NORTH_DOWN',
  'ARMAGH_CITY_BANBRIDGE_AND_CRAIGAVON',
  'BELFAST',
  'CAUSEWAY_COAST_AND_GLENS',
  'DERRY_CITY_AND_STRABANE',
  'FERMANAGH_AND_OMAGH',
  'LISBURN_AND_CASTLEREAGH',
  'MID_AND_EAST_ANTRIM',
  'MID_ULSTER',
  'NEWRY_MOURNE_AND_DOWN',
]);

/** Words a place name keeps in lower case: "East of England", "England outside London". */
const PLACE_LOWERCASE_WORDS = new Set(['and', 'of', 'the', 'outside']);

/** Place names a sentence-case label may lower: "United kingdom private rental prices". */
const UK_PLACE_PHRASES: Array<[RegExp, string]> = [
  [/\bunited kingdom\b/gi, 'United Kingdom'],
  [/\bgreat britain\b/gi, 'Great Britain'],
  [/\bnorthern ireland\b/gi, 'Northern Ireland'],
  [/\bengland\b/gi, 'England'],
  [/\bscotland\b/gi, 'Scotland'],
  [/\bwales\b/gi, 'Wales'],
  [/\blondon\b/gi, 'London'],
];

function titleCasePlace(lower: string): string {
  return lower
    .split(' ')
    .map((word, index) =>
      index > 0 && PLACE_LOWERCASE_WORDS.has(word)
        ? word
        : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(' ');
}

/**
 * HEAD_OF_HOUSEHOLD → "Head of household"; NORTHERN_IRELAND → "Northern
 * Ireland"; leaves sentence-case labels alone, but for UK place names.
 */
export function humanizeSegment(text: string): string {
  const spaced = text.replace(/_/g, ' ').trim();
  if (spaced !== spaced.toUpperCase()) {
    const sentence = spaced.charAt(0).toUpperCase() + spaced.slice(1);
    return UK_PLACE_PHRASES.reduce(
      (label, [pattern, name]) => label.replace(pattern, name),
      sentence
    );
  }
  const lower = spaced.toLowerCase();
  if (UK_PLACE_SEGMENTS.has(spaced.replace(/ +/g, '_'))) {
    return titleCasePlace(lower);
  }
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

/** Labels that name no setting alone: "Amount" of what? */
const GENERIC_LABELS = new Set([
  'amount',
  'amounts',
  'base',
  'cap',
  'limit',
  'maximum',
  'rate',
  'rates',
  'revenue',
  'threshold',
  'value',
  'values',
]);

/**
 * A group's name. Where the split setting's own label is a generic word
 * — Universal Credit's standard allowance is just "amount" — the setting
 * above it names it: "Standard allowance amount", or "Domestic Rates"
 * where that name already says it.
 */
function groupLabel(key: string, parameters: ParameterMetadataCollection): string {
  const label = labelFor(key, parameters);
  const lastDot = key.lastIndexOf('.');
  if (!GENERIC_LABELS.has(label.toLowerCase()) || lastDot <= 0) {
    return label;
  }
  const parent = labelFor(key.slice(0, lastDot), parameters);
  const word = label.toLowerCase();
  return parent.toLowerCase().split(/\s+/).includes(word) ? parent : `${parent} ${word}`;
}

/**
 * The key `path`'s group has, read from the path alone: a bracket
 * field's schedule, a breakdown member's split setting, else the path
 * itself. Draft paths that share a key share one table row, so a count
 * of keys sizes the table before the parameters are here to group it.
 */
export function groupKeyFromPath(path: string): string {
  const lastDot = path.lastIndexOf('.');
  if (lastDot <= 0) {
    return path;
  }
  const parent = path.slice(0, lastDot);
  const bracket = parent.match(BRACKET_PARENT);
  if (bracket) {
    return bracket[1];
  }
  return BREAKDOWN_SEGMENT.test(path.slice(lastDot + 1)) ? parent : path;
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
          label: groupLabel(root, parameters),
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
  return members.length > 1
    ? { key: parent, label: groupLabel(parent, parameters), members }
    : null;
}
