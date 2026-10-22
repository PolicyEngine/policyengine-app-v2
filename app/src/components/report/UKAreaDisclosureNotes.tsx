import type { UKAreaLevel, UKWithheldAreas } from '@/adapters/ukLocalAreaBreakdownAdapter';
import { Stack, Text } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import type { UKAreaImpact } from '@/types/metadata/UKAreaImpact';

const AREA_NOUNS: Record<UKAreaLevel, { one: string; many: string }> = {
  constituency: { one: 'constituency', many: 'constituencies' },
  local_authority: { one: 'local authority', many: 'local authorities' },
};

/** Why disclosure control leaves an area out, from .py's disclosure rules. */
const WITHHOLDING_RULE =
  'withhold an area’s estimate when too few surveyed households support it, or when it could reveal a household’s income.';

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** The withheld note: a count where the app can count them, else the rule alone. */
function withheldNote(level: UKAreaLevel, withheld: UKWithheldAreas): string | null {
  const noun = AREA_NOUNS[level];
  if (withheld === null) {
    return `${capitalize(noun.many)} whose estimates fail the survey data’s disclosure rules are not shown. The rules ${WITHHOLDING_RULE}`;
  }
  if (withheld.withheld <= 0) {
    return null;
  }
  const verb = withheld.withheld === 1 ? 'is' : 'are';
  return `${withheld.withheld} of ${withheld.total} ${noun.many} ${verb} not shown. The survey data’s disclosure rules ${WITHHOLDING_RULE}`;
}

function approximateNote(level: UKAreaLevel, count: number): string | null {
  if (count <= 0) {
    return null;
  }
  const noun = AREA_NOUNS[level];
  return count === 1
    ? `1 ${noun.one} is approximate: few surveyed households support its estimate, so its 90% range understates the uncertainty.`
    : `${count} ${noun.many} are approximate: few surveyed households support their estimates, so their 90% ranges understate the uncertainty.`;
}

/**
 * Notes under a UK local-area map from a disclosure-controlled breakdown:
 * how many of the level's areas were not published and why, and how many
 * shown areas are approximate. A saved result (no `withheld`, no tiers)
 * gets no notes.
 */
export default function UKAreaDisclosureNotes({
  level,
  areas,
  withheld,
}: {
  level: UKAreaLevel;
  areas: Record<string, UKAreaImpact> | null | undefined;
  /** Undefined for results without disclosure control. */
  withheld?: UKWithheldAreas;
}) {
  const approximateCount = Object.values(areas ?? {}).filter(
    (area) => area.disclosure_tier === 'approximate'
  ).length;
  const notes = [
    withheld === undefined ? null : withheldNote(level, withheld),
    approximateNote(level, approximateCount),
  ].filter((note): note is string => note !== null);

  if (notes.length === 0) {
    return null;
  }

  return (
    <Stack style={{ gap: spacing.xs }}>
      {notes.map((note) => (
        <Text
          key={note}
          style={{ margin: 0, fontSize: typography.fontSize.xs, color: colors.text.secondary }}
        >
          {note}
        </Text>
      ))}
    </Stack>
  );
}
