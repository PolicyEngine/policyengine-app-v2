import { UK_AREA_NOUNS, type UKAreaLevel } from '@/adapters/ukLocalAreaBreakdownAdapter';
import { Text } from '@/components/ui';
import { colors, typography } from '@/designTokens';

/** The note's text, or null when the hex map placed every area. */
function unplacedNote(level: UKAreaLevel, areaCount: number, placedCount: number): string | null {
  const unplacedCount = areaCount - placedCount;
  if (unplacedCount <= 0) {
    return null;
  }
  const noun = UK_AREA_NOUNS[level];
  if (placedCount <= 0) {
    return `The hex map places each ${noun.one} by its ONS code and has no position for any ${noun.one} in this result.`;
  }
  return unplacedCount === 1
    ? `1 of ${areaCount} ${noun.many} is not on the hex map, which places each ${noun.one} by its ONS code and has no position for it.`
    : `${unplacedCount} of ${areaCount} ${noun.many} are not on the hex map, which places each ${noun.one} by its ONS code and has no position for them.`;
}

/**
 * A note under a UK hex map that says how many of the result's areas it
 * leaves out: the map draws an area only where the app's layout has a
 * position for its ONS code (placeOnUKHexLayout), and an older saved result
 * has no codes. Nothing when every area is on the map.
 */
export default function UKHexMapUnplacedNote({
  level,
  areaCount,
  placedCount,
}: {
  level: UKAreaLevel;
  /** How many areas the result has at this level. */
  areaCount: number;
  /** How many of them the hex map draws. */
  placedCount: number;
}) {
  const note = unplacedNote(level, areaCount, placedCount);
  if (!note) {
    return null;
  }
  return (
    <Text style={{ margin: 0, fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
      {note}
    </Text>
  );
}
