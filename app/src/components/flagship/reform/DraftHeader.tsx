import { useState } from 'react';
import {
  IconCalendarEvent,
  IconCalendarStats,
  IconChartBar,
  IconPencil,
} from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { getReformStore } from '@/api/reformStore';
import {
  Badge,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { useAppNavigate } from '@/contexts/NavigationContext';
import { colors, spacing, typography } from '@/designTokens';
import { useRunFlagshipReport } from '@/hooks/useRunFlagshipReport';
import {
  clearDraftReform,
  DraftReform,
  draftToReform,
  draftYear,
  provisionAdjusts,
  provisionsForYear,
  setDraftLabel,
  setDraftPopulation,
  setDraftWindowYears,
  setDraftYear,
} from '@/libs/draftReform';
import { getTaxYears } from '@/libs/metadataUtils';
import { RootState } from '@/store';
import { ValueIntervalCollection } from '@/types/subIngredients/valueInterval';
import PopulationPicker from './PopulationPicker';

/**
 * How the draft came about, for the report's own record. This is
 * provenance the report carries, not a label the page needs to wear.
 */
const SOURCE_NOTES: Record<string, string> = {
  manual: 'Hand-built',
  chat: 'Drafted from your question',
  bill: 'Drafted from a bill',
  tool: 'Drafted from a tool',
};

/** Budget spans offered: the year alone, or the common scoring windows. */
const WINDOW_YEARS = [1, 3, 5, 10];

interface HeaderOption {
  value: string;
  label: string;
  /** Shown, but not yet choosable. */
  soon?: boolean;
}

/**
 * A setting of the run as a dropdown that reads at a glance: its icon,
 * what it sets, and the choice — "Year 2026" — at the height of the
 * buttons beside it, with a menu that opens below.
 */
function HeaderSelect({
  label,
  icon,
  value,
  onValueChange,
  options,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  onValueChange: (value: string) => void;
  options: HeaderOption[];
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger
        aria-label={label}
        className="tw:w-auto tw:cursor-pointer tw:bg-white tw:transition-colors tw:hover:border-primary-500"
        style={{ gap: spacing.sm, fontFamily: typography.fontFamily.primary }}
      >
        <span aria-hidden style={{ display: 'inline-flex', color: colors.text.tertiary }}>
          {icon}
        </span>
        <span style={{ fontSize: typography.fontSize.xs, color: colors.text.tertiary }}>
          {label}
        </span>
        <span style={{ fontWeight: typography.fontWeight.medium, color: colors.text.primary }}>
          <SelectValue />
        </span>
      </SelectTrigger>
      <SelectContent position="popper" align="start" style={{ minWidth: 180 }}>
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            disabled={option.soon}
            className="tw:cursor-pointer"
          >
            {option.label}
            {option.soon && (
              <Badge variant="secondary" style={{ marginLeft: spacing.sm }}>
                Soon
              </Badge>
            )}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * The reform's title: its name. The run's settings and what to do with
 * the draft — the year, who the report runs on, discard, save, run —
 * come last, in the bar under the reform (DraftRunBar).
 */
export default function DraftHeader({ draft }: { draft: DraftReform }) {
  const [editing, setEditing] = useState(false);
  const named = draft.label.trim().length > 0;
  const titleText: React.CSSProperties = {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.primary,
    lineHeight: typography.lineHeight.tight,
  };

  return (
    <header style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
      {/* The name reads as a title with a pencil after it; a click opens it
          to typing, and Enter, Escape or a click away closes it again. */}
      {editing ? (
        <input
          // Opened by the reader's click: the cursor goes straight to the name.
          autoFocus
          value={draft.label}
          onChange={(event) => setDraftLabel(event.target.value)}
          onFocus={(event) => event.target.select()}
          onBlur={() => setEditing(false)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === 'Escape') {
              event.currentTarget.blur();
            }
          }}
          placeholder="Name your reform"
          aria-label="Reform name"
          className="tw:w-full tw:rounded-md tw:border tw:border-primary-500 tw:bg-white tw:focus:outline-none"
          style={{
            ...titleText,
            marginLeft: `-${spacing.sm}`,
            padding: `2px ${spacing.sm}`,
            color: colors.text.primary,
          }}
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          aria-label="Rename the reform"
          title="Rename the reform"
          className="tw:group tw:cursor-pointer tw:rounded-md tw:border tw:border-transparent tw:hover:border-border-light"
          style={{
            ...titleText,
            display: 'inline-flex',
            alignItems: 'center',
            alignSelf: 'flex-start',
            gap: spacing.sm,
            maxWidth: '100%',
            marginLeft: `-${spacing.sm}`,
            padding: `2px ${spacing.sm}`,
            background: 'transparent',
            textAlign: 'left',
            color: named ? colors.text.primary : colors.text.tertiary,
          }}
        >
          <span style={{ minWidth: 0, overflowWrap: 'anywhere' }}>
            {named ? draft.label : 'Name your reform'}
          </span>
          <IconPencil
            size={18}
            aria-hidden
            className="tw:shrink-0 tw:text-gray-500 tw:group-hover:text-primary-700"
          />
        </button>
      )}
    </header>
  );
}

/**
 * The last step, under the reform: the run's year and who it runs on on
 * the left; throwing the draft away, saving it and running it on the
 * right. It
 * stays at the bottom of the window while the reform is longer than the
 * screen, so the run is never a scroll away, and settles in place under
 * the table once the table ends.
 */
export function DraftRunBar({ draft }: { draft: DraftReform }) {
  const nav = useAppNavigate();
  const queryClient = useQueryClient();
  const runReport = useRunFlagshipReport();
  const parameters = useSelector((state: RootState) => state.metadata.parameters);
  const regions = useSelector((state: RootState) => state.metadata.economyOptions.region);
  const taxYears = useSelector(getTaxYears);
  const currentLawAt = (path: string, at: number) => {
    const values = parameters?.[path]?.values;
    return values ? new ValueIntervalCollection(values).getValueAtDate(`${at}-01-01`) : undefined;
  };
  const year = draftYear(draft);
  const yearOptions = taxYears.length > 0 ? taxYears.map((t) => Number(t.value)) : [year];
  // The budget's span from the report's year: the year alone, or a window
  // scored a year at a time alongside the report.
  const windowYears = draft.windowYears ?? 1;
  const windowOptions = WINDOW_YEARS.map((years) => ({
    value: String(years),
    label: years === 1 ? `${year} only` : `${year}–${year + years - 1}`,
  }));

  // Who the report runs on: the whole country, a state, or a congressional district.
  const region = draft.population?.region;

  const saveMutation = useMutation({
    mutationFn: async () => {
      const store = getReformStore();
      const payload = draftToReform(draft);
      if (draft.editingReformId) {
        return store.update(draft.editingReformId, {
          label: payload.label,
          parameters: payload.parameters,
          provenance: payload.provenance,
        });
      }
      return store.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reforms'] });
      clearDraftReform();
      nav.push(`/${draft.countryId}/reforms?filter=yours`);
    },
  });

  const empty = draft.provisions.length === 0;
  // The report models what the reform changes: a parameter added but
  // left at current law stays in the draft, out of the run.
  const adjusted = draft.provisions.filter((provision) =>
    provisionAdjusts(provision, parameters?.[provision.path]?.values)
  );

  return (
    <section
      aria-label="Reform actions"
      style={{
        position: 'sticky',
        bottom: 0,
        // Over the reform scrolling under it, but under the add bar (10),
        // whose search results and policy tree open down over the page.
        zIndex: 5,
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.xs,
        padding: `${spacing.md} 0`,
        // The page's own grey, so the bar reads as part of the page: only a
        // hairline above it parts the reform scrolling underneath.
        borderTop: `1px solid ${colors.border.light}`,
        background: colors.gray[50],
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: spacing.sm,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm }}>
          <HeaderSelect
            label="Year"
            icon={<IconCalendarEvent size={16} />}
            value={String(year)}
            onValueChange={(next) => setDraftYear(Number(next))}
            options={yearOptions.map((option) => ({
              value: String(option),
              label: String(option),
            }))}
          />
          <HeaderSelect
            label="Budget years"
            icon={<IconCalendarStats size={16} />}
            value={String(windowYears)}
            onValueChange={(next) => setDraftWindowYears(Number(next))}
            options={windowOptions}
          />
          <PopulationPicker
            value={region ?? ''}
            onChange={(next) => setDraftPopulation({ scope: 'national', region: next })}
            regions={regions}
          />
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: spacing.sm,
            marginLeft: 'auto',
          }}
        >
          <Button variant="ghost" onClick={() => clearDraftReform()}>
            Discard
          </Button>
          <Button
            variant="outline"
            onClick={() => saveMutation.mutate()}
            disabled={empty || saveMutation.isPending}
          >
            {draft.editingReformId ? 'Save changes' : 'Save'}
          </Button>
          <Button
            onClick={() =>
              runReport.run(
                draft.label || 'Draft reform',
                SOURCE_NOTES[draft.source] ?? 'Draft reform',
                // Described as they stand in the year the report simulates.
                provisionsForYear(adjusted, year, currentLawAt),
                undefined,
                year,
                { fromDraft: true, region, windowYears: draft.windowYears }
              )
            }
            disabled={adjusted.length === 0 || runReport.isRunning}
            title={
              !empty && adjusted.length === 0
                ? 'Adjust at least one value from current law to run the report'
                : undefined
            }
          >
            <IconChartBar size={16} />
            {runReport.isRunning ? 'Starting report…' : `Run ${year} report`}
          </Button>
        </div>
      </div>

      {/* Unchanged parameters still leave the run quietly; only "nothing changed" is said. */}
      {!empty && adjusted.length === 0 && (
        <p
          style={{
            margin: 0,
            textAlign: 'right',
            fontSize: typography.fontSize.xs,
            color: colors.text.tertiary,
          }}
        >
          No values differ from current law yet. Adjust at least one value to run the report.
        </p>
      )}

      {(runReport.error || saveMutation.isError) && (
        <p
          role="alert"
          style={{ margin: 0, fontSize: typography.fontSize.sm, color: colors.error }}
        >
          {runReport.error ?? 'Could not save the reform. Try again.'}
        </p>
      )}
    </section>
  );
}
