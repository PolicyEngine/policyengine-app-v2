import { useState } from 'react';
import { IconCalendarEvent, IconChartBar, IconChevronDown, IconPencil } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { ReformNotFoundError } from '@/api/reformStore';
import { BrowserOnlyIdError } from '@/api/v2Associations';
import { isV2ApiError } from '@/api/v2UserClient';
import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  SegmentedControl,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { useAppNavigate } from '@/contexts/NavigationContext';
import { colors, spacing, typography } from '@/designTokens';
import { useReformStore } from '@/hooks/useFlagshipStores';
import { useRunFlagshipReport } from '@/hooks/useRunFlagshipReport';
import {
  clearDraftReform,
  DraftReform,
  draftToReform,
  draftYear,
  provisionAdjusts,
  provisionsToRun,
  setDraftBaseline,
  setDraftEditingReform,
  setDraftLabel,
  setDraftPopulation,
  setDraftWindowYears,
  setDraftYear,
} from '@/libs/draftReform';
import { findMatchingReform } from '@/libs/flagship/reformMatch';
import { getTaxYears } from '@/libs/metadataUtils';
import { RootState } from '@/store';
import type { Reform } from '@/types/ingredients/Reform';
import BaselinePicker, { savedReformName, useDraftBaseline } from './BaselinePicker';
import PopulationPicker from './PopulationPicker';

/** The reform the draft edits is not in this session's store. */
function isMissingFromStore(error: unknown): boolean {
  return (
    error instanceof BrowserOnlyIdError ||
    error instanceof ReformNotFoundError ||
    isV2ApiError(error, 404)
  );
}

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

/** "2026", or "2026–2035" for a window of years. */
export function yearsLabel(year: number, windowYears: number): string {
  return windowYears > 1 ? `${year}–${year + windowYears - 1}` : String(year);
}

const fieldLabel: React.CSSProperties = {
  fontSize: typography.fontSize.xs,
  fontWeight: typography.fontWeight.medium,
  color: colors.text.secondary,
};

/**
 * The run's years in one control: the year the report scores in full,
 * and how many years of budget it adds from there. It reads "Year 2026",
 * or "Years 2026–2035" with a window; a click opens both choices, and a
 * window keeps its length when the year moves.
 */
function YearsPicker({
  year,
  windowYears,
  yearOptions,
  onYearChange,
  onWindowChange,
}: {
  year: number;
  windowYears: number;
  yearOptions: number[];
  onYearChange: (year: number) => void;
  onWindowChange: (windowYears: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const label = windowYears > 1 ? 'Years' : 'Year';
  const span = yearsLabel(year, windowYears);
  const yearLabel = windowYears > 1 ? 'Start year' : 'Report year';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`${label}: ${span}`}
          className="tw:inline-flex tw:h-9 tw:cursor-pointer tw:items-center tw:rounded-md tw:border tw:border-input tw:bg-white tw:px-3 tw:text-sm tw:whitespace-nowrap tw:shadow-xs tw:transition-colors tw:hover:border-primary-500"
          style={{ gap: spacing.sm, fontFamily: typography.fontFamily.primary }}
        >
          <span aria-hidden style={{ display: 'inline-flex', color: colors.text.tertiary }}>
            <IconCalendarEvent size={16} />
          </span>
          <span style={{ fontSize: typography.fontSize.xs, color: colors.text.tertiary }}>
            {label}
          </span>
          <span style={{ fontWeight: typography.fontWeight.medium, color: colors.text.primary }}>
            {span}
          </span>
          <IconChevronDown
            size={14}
            aria-hidden
            style={{
              color: colors.text.tertiary,
              transform: open ? 'rotate(180deg)' : undefined,
              transition: 'transform 160ms ease',
            }}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        aria-label="Report years"
        style={{ width: 320, padding: spacing.lg, fontFamily: typography.fontFamily.primary }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
            {/* The report's year, or with a window the year it starts. */}
            <span style={fieldLabel}>{yearLabel}</span>
            <Select value={String(year)} onValueChange={(next) => onYearChange(Number(next))}>
              <SelectTrigger
                aria-label={yearLabel}
                className="tw:w-full tw:cursor-pointer tw:bg-white tw:hover:border-primary-500 tw:max-sm:min-h-10"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" align="start">
                {yearOptions.map((option) => (
                  <SelectItem
                    key={option}
                    value={String(option)}
                    className="tw:cursor-pointer tw:max-sm:min-h-10"
                  >
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
            <span style={fieldLabel}>Budget</span>
            <SegmentedControl
              animated
              value={String(windowYears)}
              onValueChange={(next) => onWindowChange(Number(next))}
              options={WINDOW_YEARS.map((years) => ({
                value: String(years),
                label: years === 1 ? '1 year' : `${years} years`,
              }))}
              // A fingertip tall on a phone. The popover portals out of the
              // shell, so the shell's own phone sizes do not reach it.
              className="tw:max-sm:h-12"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
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
          className="tw:group tw:cursor-pointer tw:rounded-md tw:border tw:border-transparent tw:hover:border-border-light tw:max-sm:min-h-10"
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
 * The last step, under the reform: the run's year, who it runs on and
 * what it is compared with on the left; throwing the draft away, saving
 * it and running it on the right. It stays at the bottom of the window
 * while the reform is longer than the screen, so the run is never a
 * scroll away, and settles in place under the table once the table ends.
 */
export function DraftRunBar({ draft }: { draft: DraftReform }) {
  const nav = useAppNavigate();
  const queryClient = useQueryClient();
  const runReport = useRunFlagshipReport();
  const reformStore = useReformStore();
  const parameters = useSelector((state: RootState) => state.metadata.parameters);
  const regions = useSelector((state: RootState) => state.metadata.economyOptions.region);
  const taxYears = useSelector(getTaxYears);
  // Saving keeps what the run models: the values that differ from current law.
  const currentLawValues = (path: string) => parameters?.[path]?.values;
  const year = draftYear(draft);
  const yearOptions = taxYears.length > 0 ? taxYears.map((t) => Number(t.value)) : [year];
  // The budget's span from the report's year: the year alone, or a window
  // scored a year at a time alongside the report.
  const windowYears = draft.windowYears ?? 1;

  // Who the report runs on: the whole country, a state, or a congressional district.
  const region = draft.population?.region;

  // What the report compares the reform with: current law, or a saved reform.
  const baseline = useDraftBaseline(draft);

  // Saving changes the reform the draft came from, or saves a new one.
  // When that reform is no longer in this store (deleted, or another
  // user's), the draft is saved as a new reform instead.
  const saveReform = async (): Promise<Reform> => {
    const payload = draftToReform(draft, currentLawValues);
    if (draft.editingReformId) {
      try {
        return await reformStore.update(draft.editingReformId, {
          label: payload.label,
          parameters: payload.parameters,
          provenance: payload.provenance,
        });
      } catch (error) {
        if (!isMissingFromStore(error)) {
          throw error;
        }
      }
    }
    return reformStore.create(payload);
  };

  // A run keeps its reform: it saves the draft first (updating the saved
  // reform it edits, or reusing a saved one that sets the same values),
  // so the report links to it and both can be found again. A reused
  // reform stays as it is, its name too. A save that fails runs nothing.
  const saveForRun = async (): Promise<{ reform: Reform; reused: boolean }> => {
    if (!draft.editingReformId) {
      const payload = draftToReform(draft, currentLawValues);
      const match = findMatchingReform(
        await reformStore.findMine(draft.countryId),
        payload.parameters
      );
      if (match?.id) {
        return { reform: match, reused: true };
      }
    }
    return { reform: await saveReform(), reused: false };
  };

  const saveMutation = useMutation({
    mutationFn: saveReform,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reforms'] });
      clearDraftReform();
      nav.push(`/${draft.countryId}/reforms?filter=yours`);
    },
  });

  // A reform the run saved becomes the one the draft edits, so trying
  // again after a failed run changes it rather than saving another.
  const saveAndRunMutation = useMutation({
    mutationFn: saveForRun,
    onSuccess: ({ reform: saved, reused }) => {
      queryClient.invalidateQueries({ queryKey: ['reforms'] });
      if (!reused) {
        setDraftEditingReform(saved.id!);
      }
      void runReport.run(
        draft.label || 'Draft reform',
        SOURCE_NOTES[draft.source] ?? 'Draft reform',
        // Described as they stand in the year the report simulates.
        provisionsToRun(draft.provisions, year, parameters),
        saved.id,
        year,
        { fromDraft: true, region, windowYears: draft.windowYears, baseline: baseline.forRun }
      );
    },
  });
  const saveError = saveMutation.error ?? saveAndRunMutation.error;
  const starting = saveAndRunMutation.isPending || runReport.isRunning;

  const empty = draft.provisions.length === 0;
  // The report models what the reform changes: a parameter added but
  // left at current law stays in the draft, out of the run.
  const adjusted = draft.provisions.filter((provision) =>
    provisionAdjusts(provision, parameters?.[provision.path]?.values)
  );
  // Saving keeps only those values, so a new reform that changes nothing
  // has nothing to save. A saved reform being edited can still go back to
  // current law.
  const nothingToSave = empty || (!draft.editingReformId && adjusted.length === 0);

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
          <YearsPicker
            year={year}
            windowYears={windowYears}
            yearOptions={yearOptions}
            onYearChange={setDraftYear}
            onWindowChange={setDraftWindowYears}
          />
          <PopulationPicker
            value={region ?? ''}
            onChange={(next) => setDraftPopulation({ scope: 'national', region: next })}
            regions={regions}
          />
          <BaselinePicker
            value={baseline.reform?.id}
            onChange={setDraftBaseline}
            reforms={baseline.options}
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
            disabled={nothingToSave || saveMutation.isPending || starting}
          >
            {draft.editingReformId ? 'Save changes' : 'Save'}
          </Button>
          <Button
            onClick={() => saveAndRunMutation.mutate()}
            disabled={
              adjusted.length === 0 ||
              starting ||
              saveMutation.isPending ||
              baseline.pending ||
              baseline.matchesDraft
            }
            title={
              !empty && adjusted.length === 0
                ? 'Adjust at least one value from current law to run the report'
                : undefined
            }
          >
            <IconChartBar size={16} />
            {starting
              ? 'Starting report…'
              : // With a budget window, the run covers its years.
                `Save and run ${yearsLabel(year, windowYears)} report`}
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
      {adjusted.length > 0 && baseline.matchesDraft && baseline.reform && (
        <p
          style={{
            margin: 0,
            textAlign: 'right',
            fontSize: typography.fontSize.xs,
            color: colors.text.tertiary,
          }}
        >
          This reform matches {savedReformName(baseline.reform)}. Change a value or compare with
          something else.
        </p>
      )}

      {(runReport.error || saveError) && (
        <p
          role="alert"
          style={{ margin: 0, fontSize: typography.fontSize.sm, color: colors.error }}
        >
          {saveError ? 'Could not save the reform. Try again.' : runReport.error}
        </p>
      )}
    </section>
  );
}
