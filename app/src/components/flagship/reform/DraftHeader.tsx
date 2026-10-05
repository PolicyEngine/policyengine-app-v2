import { IconCalendarEvent, IconChartBar, IconUsers } from '@tabler/icons-react';
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
import { MOCK_USER_ID } from '@/constants';
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
  setDraftYear,
} from '@/libs/draftReform';
import { getTaxYears } from '@/libs/metadataUtils';
import { RootState } from '@/store';
import { ValueIntervalCollection } from '@/types/subIngredients/valueInterval';

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
 * The reform's title bar: its name, then one toolbar — the run's year
 * and population on the left, the verbs (throw it away, save it, run the
 * report) on the right — so the reform below has the page.
 */
export default function DraftHeader({ draft }: { draft: DraftReform }) {
  const nav = useAppNavigate();
  const queryClient = useQueryClient();
  const runReport = useRunFlagshipReport();
  const taxYears = useSelector(getTaxYears);
  const parameters = useSelector((state: RootState) => state.metadata.parameters);
  const currentLawAt = (path: string, at: number) => {
    const values = parameters?.[path]?.values;
    return values ? new ValueIntervalCollection(values).getValueAtDate(`${at}-01-01`) : undefined;
  };
  const year = draftYear(draft);
  const yearOptions = taxYears.length > 0 ? taxYears.map((t) => Number(t.value)) : [year];

  const saveMutation = useMutation({
    mutationFn: async () => {
      const store = getReformStore();
      const payload = draftToReform(draft, MOCK_USER_ID);
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
  const leftOut = draft.provisions.length - adjusted.length;

  return (
    <header style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
      <input
        value={draft.label}
        onChange={(event) => setDraftLabel(event.target.value)}
        placeholder="Untitled reform"
        aria-label="Reform name"
        className="tw:w-full tw:rounded-md tw:border tw:border-transparent tw:bg-transparent tw:hover:border-border-light tw:focus:border-primary-500 tw:focus:bg-white tw:focus:outline-none"
        style={{
          marginLeft: `-${spacing.sm}`,
          padding: `2px ${spacing.sm}`,
          fontSize: typography.fontSize['2xl'],
          fontWeight: typography.fontWeight.semibold,
          fontFamily: typography.fontFamily.primary,
          color: colors.text.primary,
        }}
      />

      {/* What the run covers on the left; what to do with the reform on the right. */}
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
            label="Population"
            icon={<IconUsers size={16} />}
            value="national"
            // Household analysis arrives with the run bridge.
            onValueChange={() => {}}
            options={[
              { value: 'national', label: 'Nationwide' },
              { value: 'household', label: 'A household', soon: true },
            ]}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm }}>
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
                year
              )
            }
            disabled={adjusted.length === 0 || runReport.isRunning}
            title={!empty && adjusted.length === 0 ? 'Change a value to run the report' : undefined}
          >
            <IconChartBar size={16} />
            {runReport.isRunning ? 'Starting report…' : `Run ${year} report`}
          </Button>
        </div>
      </div>

      {!empty && leftOut > 0 && (
        <p
          style={{
            margin: 0,
            textAlign: 'right',
            fontSize: typography.fontSize.xs,
            color: colors.text.tertiary,
          }}
        >
          {adjusted.length === 0
            ? 'Nothing is changed yet. Change a value to run the report.'
            : `${leftOut} unchanged parameter${leftOut === 1 ? ' is' : 's are'} left out of the report.`}
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
    </header>
  );
}
