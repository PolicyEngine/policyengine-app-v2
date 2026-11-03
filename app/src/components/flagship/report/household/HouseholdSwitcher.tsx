import { useEffect, useRef } from 'react';
import { IconPlus } from '@tabler/icons-react';
import { effectColor, signedMoney } from '@/components/flagship/report/household/householdMoney';
import { Button } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import type { CountryId } from '@/libs/countries';

/** Where a household's calculation stands, as its tile and the comparison show it. */
export interface HouseholdStatus {
  /** "Married · 2 children · Ohio · $65,000 earnings": who the household is. */
  summary: string;
  state: 'draft' | 'running' | 'failed' | 'done';
  /** The inputs changed after the result on screen was calculated. */
  stale: boolean;
  /** The household's net income under each policy, once calculated. */
  netIncome?: { baseline: number; reform: number; change: number };
}

export interface HouseholdTile {
  key: number;
  name: string;
  status?: HouseholdStatus;
}

/** The comparison's key in the selection, beside the households' own. */
export const COMPARE_ALL = 'compare';

export type HouseholdSelection = number | typeof COMPARE_ALL;

/** What a tile says under the household's name: its result, or where its run stands. */
function tileOutcome(status: HouseholdStatus | undefined, countryId: CountryId) {
  if (!status || status.state === 'draft') {
    return { text: 'Not calculated', color: colors.text.secondary };
  }
  if (status.state === 'running') {
    return { text: 'Calculating…', color: colors.text.secondary };
  }
  if (status.state === 'failed') {
    return { text: 'Could not calculate', color: colors.error };
  }
  const change = status.netIncome?.change ?? 0;
  return {
    text: `${signedMoney(change, countryId)} a year${status.stale ? ' · inputs changed' : ''}`,
    color: effectColor(change),
  };
}

const tileStyle = (selected: boolean): React.CSSProperties => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: 2,
  flex: '0 0 auto',
  width: 220,
  maxWidth: '75vw',
  padding: `${spacing.sm} ${spacing.md}`,
  textAlign: 'left',
  cursor: 'pointer',
  fontFamily: typography.fontFamily.primary,
  borderRadius: spacing.radius.container,
  border: `1px solid ${selected ? colors.primary[500] : colors.border.light}`,
  background: selected ? colors.primary[50] : colors.background.primary,
  boxShadow: selected ? `inset 0 0 0 1px ${colors.primary[500]}` : undefined,
});

const oneLine: React.CSSProperties = {
  maxWidth: '100%',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

/**
 * The report's households, one tile each: the reader picks which one the
 * panel below shows. Each tile carries the household's name, who it is and
 * its result, so the households compare at a glance. A row across the top
 * on every width, so the panel below, its tables and its charts keep the
 * full width; it scrolls sideways when the tiles outgrow it. While the
 * comparison shows (opened beside the section's heading), no tile is
 * selected.
 */
export default function HouseholdSwitcher({
  households,
  selected,
  countryId,
  onSelect,
  onAdd,
}: {
  households: HouseholdTile[];
  selected: HouseholdSelection | null;
  countryId: CountryId;
  onSelect: (key: number) => void;
  onAdd: () => void;
}) {
  // On a narrow screen the row scrolls: keep the open tile in view, e.g. a household just added.
  const tablist = useRef<HTMLDivElement>(null);
  useEffect(() => {
    tablist.current
      ?.querySelector<HTMLElement>('[aria-selected="true"]')
      ?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  }, [selected]);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'stretch',
        gap: spacing.sm,
        overflowX: 'auto',
        paddingBottom: spacing.xs,
      }}
    >
      <div
        ref={tablist}
        role="tablist"
        aria-label="Households"
        style={{ display: 'flex', gap: spacing.sm }}
      >
        {households.map((household) => {
          const isSelected = selected === household.key;
          const outcome = tileOutcome(household.status, countryId);
          return (
            <button
              key={household.key}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => onSelect(household.key)}
              style={tileStyle(isSelected)}
            >
              <span
                style={{
                  ...oneLine,
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.semibold,
                  color: colors.text.primary,
                }}
              >
                {household.name}
              </span>
              <span
                style={{
                  ...oneLine,
                  fontSize: typography.fontSize.xs,
                  color: colors.text.secondary,
                }}
                title={household.status?.summary}
              >
                {household.status?.summary ?? 'Describe this household'}
              </span>
              <span
                style={{
                  ...oneLine,
                  marginTop: 2,
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.medium,
                  fontVariantNumeric: 'tabular-nums',
                  color: outcome.color,
                }}
              >
                {outcome.text}
              </span>
            </button>
          );
        })}
      </div>
      <Button
        variant="outline"
        onClick={onAdd}
        style={{ flex: '0 0 auto', height: 'auto', alignSelf: 'stretch' }}
      >
        <IconPlus size={16} aria-hidden />
        Add another household
      </Button>
    </div>
  );
}
