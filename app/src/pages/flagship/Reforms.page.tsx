import dayjs from 'dayjs';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  IconArrowLeft,
  IconChartBar,
  IconExternalLink,
  IconPencil,
  IconPlus,
  IconScale,
  IconSearch,
} from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { billRunYear, TrackedBill } from '@/api/billFeed';
import { getFlagshipReportStore } from '@/api/flagshipReportStore';
import { getReformStore } from '@/api/reformStore';
import BillFeedFilters from '@/components/flagship/bills/BillFeedFilters';
import BillStageBadge from '@/components/flagship/bills/BillStageBadge';
import DeleteReformDialog from '@/components/flagship/DeleteReformDialog';
import ProvisionList from '@/components/flagship/ProvisionList';
import ReformReports from '@/components/flagship/ReformReports';
import {
  CARD_GRID_STYLE,
  CardGridSkeleton,
  EmptyState,
  ErrorState,
  SkeletonLine,
  SkeletonRegion,
} from '@/components/flagship/states';
import StatTile from '@/components/flagship/StatTile';
import TrackerHomeButton from '@/components/flagship/TrackerHomeButton';
import WorkspaceLayout from '@/components/flagship/WorkspaceLayout';
import { Button, Stack, Text, Title } from '@/components/ui';
import { useAppLocation } from '@/contexts/LocationContext';
import { useAppNavigate } from '@/contexts/NavigationContext';
import { colors, spacing, typography } from '@/designTokens';
import { billRegion } from '@/hooks/useBillEconomy';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useRunFlagshipReport } from '@/hooks/useRunFlagshipReport';
import { useTrackedBills } from '@/hooks/useTrackedBills';
import { loadProvisionsIntoDraft } from '@/libs/draftReform';
import { BillFilters, billPlace, filterBills, NO_BILL_FILTERS } from '@/libs/flagship/billFilters';
import {
  billAlreadyCurrentLaw,
  billReportProvisions,
  billScoresOtherThanWriteUp,
} from '@/libs/flagship/billProvisions';
import { periodLabel } from '@/libs/flagship/draftLabels';
import { latestMatchingReport } from '@/libs/flagship/latestReport';
import { rerunSettings } from '@/libs/flagship/reportRerun';
import { flagshipReportQueryKeys } from '@/libs/flagship/runReport';
import { RootState } from '@/store';
import { Reform, ReformSource } from '@/types/ingredients/Reform';
import { ValueInterval, ValueIntervalCollection } from '@/types/subIngredients/valueInterval';
import { formatBudgetaryImpact } from '@/utils/formatPowers';
import { formatLabelParts, getHierarchicalLabels } from '@/utils/parameterLabels';
import { formatValue, getCurrentValue } from '@/utils/parameterValues';

/** How a reform came about: the report's record keeps it; the page doesn't show it. */
const SOURCE_LABELS: Record<ReformSource, string> = {
  manual: 'Hand-built',
  chat: 'From a question',
  bill: 'From a bill',
  tool: 'From a tool',
};

type Tab = 'bills' | 'yours';

/** Bills render in pages of this size; scrolling near the end reveals the next page. */
const BILLS_PAGE_SIZE = 12;

/**
 * The list's filter controls — state and search — at one height and
 * border: the segmented controls' height (h-9), so a filter row lines up.
 */
const filterControl: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: spacing.xs,
  height: 36,
  padding: `0 ${spacing.md}`,
  border: `1px solid ${colors.border.light}`,
  borderRadius: spacing.radius.container,
  background: colors.background.primary,
  fontSize: typography.fontSize.sm,
  fontFamily: typography.fontFamily.primary,
  color: colors.text.secondary,
};

interface ProvisionView {
  path: string;
  breadcrumb: string;
  unit: string | null;
  baselineValue: any;
  value: any;
  intervals?: ValueInterval[];
}

/** The year a saved reform's report runs: its first change, or this year once that is past. */
const reformRunYear = (reform: Reform) =>
  billRunYear(reform.parameters.map((parameter) => ({ intervals: parameter.values })));

/** A saved reform's parameter rows: name, current law, the reform's value, when it starts. */
const PARAMETER_ROW: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) minmax(88px, 140px) minmax(120px, 180px) minmax(64px, 96px)',
  alignItems: 'center',
  columnGap: spacing.md,
  padding: `${spacing.sm} 0`,
  borderBottom: `1px solid ${colors.border.light}`,
};

const PARAMETER_HEADING: React.CSSProperties = {
  fontSize: typography.fontSize.xs,
  fontWeight: typography.fontWeight.medium,
  color: colors.text.secondary,
};

const PARAMETER_VALUE: React.CSSProperties = {
  fontSize: typography.fontSize.sm,
  fontWeight: typography.fontWeight.medium,
  color: colors.text.primary,
  fontVariantNumeric: 'tabular-nums',
};

const PARAMETER_MUTED: React.CSSProperties = {
  fontSize: typography.fontSize.sm,
  color: colors.text.secondary,
  fontVariantNumeric: 'tabular-nums',
  whiteSpace: 'nowrap',
};

/** A value as the row reads it: True/False, as Build's switch says. */
function displayValue(value: unknown, unit: string | null): string {
  return typeof value === 'boolean' ? (value ? 'True' : 'False') : formatValue(value, unit);
}

/** Small-caps muted eyebrow — the one structural label cards carry. */
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <Text
      style={{
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: colors.text.secondary,
        fontWeight: typography.fontWeight.semibold,
      }}
    >
      {children}
    </Text>
  );
}

function clamp(lines: number): React.CSSProperties {
  return {
    display: '-webkit-box',
    WebkitLineClamp: lines,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  };
}

function Card({
  eyebrow,
  badge,
  title,
  body,
  stats,
  linkUrl,
  onClick,
}: {
  eyebrow: string;
  /** Beside the eyebrow, e.g. a bill's stage. */
  badge?: React.ReactNode;
  title: string;
  body: string;
  stats?: React.ReactNode;
  linkUrl?: string;
  onClick: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.xs,
        height: '100%',
        padding: spacing.lg,
        border: `1px solid ${colors.border.light}`,
        borderRadius: 12,
        background: colors.background.primary,
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: typography.fontFamily.primary,
        transition: 'border-color 120ms, box-shadow 120ms, transform 120ms',
        boxSizing: 'border-box',
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.borderColor = colors.primary[500];
        event.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06)';
        event.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.borderColor = colors.border.light;
        event.currentTarget.style.boxShadow = 'none';
        event.currentTarget.style.transform = 'none';
      }}
    >
      <Stack style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Eyebrow>{eyebrow}</Eyebrow>
        {badge}
        <div style={{ flex: 1 }} />
        {linkUrl && (
          <a
            href={linkUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="Bill text"
            onClick={(event) => event.stopPropagation()}
            // A fingertip wide on a phone, without moving the card's lines.
            className="tw:max-sm:-my-3 tw:max-sm:-mr-3 tw:max-sm:size-10 tw:max-sm:items-center tw:max-sm:justify-center"
            style={{ display: 'inline-flex', color: colors.text.secondary }}
          >
            <IconExternalLink size={13} />
          </a>
        )}
      </Stack>
      <Text
        style={{
          fontSize: typography.fontSize.base,
          fontWeight: typography.fontWeight.medium,
          color: colors.text.primary,
          lineHeight: 1.35,
          ...clamp(2),
        }}
      >
        {title}
      </Text>
      {body && (
        <Text
          style={{
            fontSize: typography.fontSize.sm,
            color: colors.text.secondary,
            lineHeight: 1.5,
            ...clamp(2),
          }}
        >
          {body}
        </Text>
      )}
      {stats && (
        <div
          style={{
            marginTop: 'auto',
            paddingTop: spacing.sm,
            borderTop: `1px solid ${colors.border.light}`,
            display: 'flex',
            gap: spacing.lg,
            flexWrap: 'wrap',
          }}
        >
          {stats}
        </div>
      )}
    </div>
  );
}

/** One headline number on a card: value in teal, quiet label after. */
function Stat({ value, label }: { value: string; label: string }) {
  return (
    <Text style={{ fontSize: typography.fontSize.sm, whiteSpace: 'nowrap' }}>
      <span style={{ color: colors.primary[700], fontWeight: typography.fontWeight.semibold }}>
        {value}
      </span>{' '}
      <span style={{ color: colors.text.secondary }}>{label}</span>
    </Text>
  );
}

/**
 * Reforms — everything reform-shaped in one calm surface. Two views:
 * Bills (federal and state bills analyzed with the PolicyEngine model,
 * live from the tracker) and Your library (saved reforms). Cards open a
 * focused detail; every detail ends in the same two verbs — view the
 * full impact report, or open as a draft.
 */
export default function ReformsPage() {
  const nav = useAppNavigate();
  const countryId = useCurrentCountry();
  const queryClient = useQueryClient();
  const parameters = useSelector((state: RootState) => state.metadata.parameters);
  const appLocation = useAppLocation();
  const urlParams = useMemo(() => new URLSearchParams(appLocation.search), [appLocation.search]);

  const [tab, setTab] = useState<Tab>(() =>
    urlParams.get('filter') === 'yours' ? 'yours' : 'bills'
  );
  const [query, setQuery] = useState('');
  const [billFilters, setBillFilters] = useState<BillFilters>(NO_BILL_FILTERS);
  // Deep links (?bill=<id>) open straight into that bill's detail.
  const [selectedId, setSelectedId] = useState<string | null>(() => urlParams.get('bill'));

  const runReport = useRunFlagshipReport();
  const {
    bills,
    isConfigured: billsConfigured,
    isLoading: billsLoading,
    isError: billsError,
    retry: retryBills,
  } = useTrackedBills(countryId);

  const {
    data: reforms,
    isPending,
    isError,
  } = useQuery({
    queryKey: ['reforms', countryId],
    queryFn: () => getReformStore().findMine(countryId),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['reforms'] });

  // The reports this browser ran, by the saved reform each came from: a
  // reform is where its reports are found again.
  const { data: reports } = useQuery({
    queryKey: flagshipReportQueryKeys.mine(countryId),
    queryFn: () => getFlagshipReportStore().findMine(countryId),
  });
  const reportsFor = (reformId: string | undefined) =>
    reformId ? (reports ?? []).filter((report) => report.reformId === reformId) : [];
  const reportsLine = (reformId: string | undefined) => {
    const runs = reportsFor(reformId);
    if (runs.length === 0) {
      return 'No reports yet';
    }
    const latest = runs.reduce((a, b) => (a.createdAt > b.createdAt ? a : b));
    return `${runs.length} report${runs.length === 1 ? '' : 's'} · latest ${new Date(
      latest.createdAt
    ).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  const deleteMutation = useMutation({
    mutationFn: (reformId: string) => getReformStore().delete(reformId),
    onSuccess: () => {
      setSelectedId(null);
      invalidate();
    },
  });

  const resolveBreadcrumb = (path: string, fallback?: string) =>
    parameters?.[path]
      ? formatLabelParts(getHierarchicalLabels(path, parameters))
      : (fallback ?? path);

  // Each with its dated values, read against the law in the bill's run year
  // — or, for a bill that is law already, the law the tracker compared it with.
  const billProvisions = (bill: TrackedBill) => {
    const year = billRunYear(bill.provisions);
    return billReportProvisions(bill.provisions, parameters, year, {
      priorLaw: billAlreadyCurrentLaw(bill.provisions, parameters, year),
    });
  };

  // As on the bill's report: stored parameters that contradict the bill's
  // write-up (UT SB60's reform and baseline are swapped) would score
  // another change, so neither a report nor a draft starts from them.
  const billScoresOtherChange = (bill: TrackedBill) =>
    !billAlreadyCurrentLaw(bill.provisions, parameters, billRunYear(bill.provisions)) &&
    billScoresOtherThanWriteUp(bill.provisions, bill.changes);

  /** Current law for a parameter on 1 January of `year`. */
  const currentLawAt = (path: string, year: number) => {
    const values = parameters?.[path]?.values;
    return values
      ? (new ValueIntervalCollection(values).getValueAtDate(`${year}-01-01`) ??
          getCurrentValue(values))
      : undefined;
  };

  /** The reform as the report runs it: every dated value, described in the run year. */
  const reformProvisions = (reform: Reform): ProvisionView[] => {
    const year = reformRunYear(reform);
    return reform.parameters.map((parameter) => {
      const baselineValue = currentLawAt(parameter.name, year);
      const inYear = new ValueIntervalCollection(parameter.values).getValueAtDate(`${year}-01-01`);
      return {
        path: parameter.name,
        breadcrumb: resolveBreadcrumb(parameter.name),
        unit: parameters?.[parameter.name]?.unit ?? null,
        baselineValue,
        value: inYear ?? baselineValue,
        ...(parameter.values.length > 0 && { intervals: parameter.values }),
      };
    });
  };

  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const matches = (haystack: string) =>
    tokens.every((token) => haystack.toLowerCase().includes(token));

  const searchedBills = bills.filter((bill) =>
    // The place reads once, as the card names it: "Federal", "Utah".
    matches(`${bill.title} ${billPlace(bill)} ${bill.summary}`)
  );
  const visibleBills = filterBills(searchedBills, billFilters).sort((a, b) =>
    (b.date ?? '').localeCompare(a.date ?? '')
  );
  const clearBillFilters = () => {
    setBillFilters(NO_BILL_FILTERS);
    setQuery('');
  };

  // The live feed can carry hundreds of bills — render a page at a time
  // and reveal the next as the reader approaches the end of the grid.
  const [billsShown, setBillsShown] = useState(BILLS_PAGE_SIZE);
  useEffect(() => {
    setBillsShown(BILLS_PAGE_SIZE);
  }, [tab, query, billFilters, countryId]);
  const pagedBills = visibleBills.slice(0, billsShown);
  const hasMoreBills = visibleBills.length > billsShown;

  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setBillsShown((count) => count + BILLS_PAGE_SIZE);
        }
      },
      { rootMargin: '400px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMoreBills, billsShown]);

  const visibleReforms = (reforms ?? []).filter((reform) =>
    matches(reform.label || 'Untitled reform')
  );

  const selectedBill = selectedId ? bills.find((bill) => bill.id === selectedId) : null;
  const selectedReform = selectedId
    ? (reforms ?? []).find((reform) => reform.id === selectedId)
    : null;

  const openReform = (reform: Reform) => {
    // A failed delete belongs to the reform it was tried on.
    deleteMutation.reset();
    setSelectedId(reform.id!);
  };

  const openBillAsDraft = (bill: TrackedBill) => {
    // The draft runs as the bill's report does: in its first year, on its state.
    loadProvisionsIntoDraft(countryId, billProvisions(bill), {
      label: bill.title,
      year: billRunYear(bill.provisions),
      region: bill.state ? billRegion(bill, countryId) : undefined,
      source: 'bill',
      sourceRef: bill.id,
    });
    // The draft is Build's page now, not a panel beside this one.
    nav.push(`/${countryId}/build`);
  };

  const billStats = (bill: TrackedBill): React.ReactNode => {
    const stats: React.ReactNode[] = [];
    const revenue = bill.impacts?.revenue;
    if (typeof revenue === 'number') {
      const { display, label } = formatBudgetaryImpact(revenue);
      stats.push(
        <Stat
          key="revenue"
          value={`${revenue < 0 ? '\u2212' : '+'}$${display}${label ? ` ${label}` : ''}`}
          label="revenue"
        />
      );
    }
    const poverty = bill.impacts?.povertyPercentChange;
    if (typeof poverty === 'number') {
      stats.push(
        <Stat
          key="poverty"
          value={`${poverty > 0 ? '+' : '\u2212'}${Math.abs(poverty).toFixed(1)}%`}
          label="poverty"
        />
      );
    }
    return stats.length > 0 ? stats : undefined;
  };

  const backLink = (
    <button
      type="button"
      onClick={() => setSelectedId(null)}
      className="tw:max-sm:min-h-10"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: spacing.xs,
        border: 'none',
        background: 'none',
        padding: 0,
        cursor: 'pointer',
        fontSize: typography.fontSize.sm,
        fontFamily: typography.fontFamily.primary,
        color: colors.text.secondary,
        alignSelf: 'flex-start',
      }}
    >
      <IconArrowLeft size={14} />
      All reforms
    </button>
  );

  // ---- Detail: a tracked bill ----
  if (selectedBill) {
    const provisions = billProvisions(selectedBill);
    const scoresOtherChange = billScoresOtherChange(selectedBill);
    const impact = selectedBill.impactData;
    const winners = impact?.winnersLosers;
    const betterOff = winners && ((winners.gainMore5Pct ?? 0) + (winners.gainLess5Pct ?? 0)) * 100;
    const worseOff = winners && ((winners.loseMore5Pct ?? 0) + (winners.loseLess5Pct ?? 0)) * 100;
    const poverty = impact?.poverty;
    const revenue = selectedBill.impacts?.revenue ?? impact?.budgetary?.stateRevenueImpact;
    const money = (value: number) => {
      const { display, label } = formatBudgetaryImpact(value);
      return `${value < 0 ? '−' : '+'}$${display}${label ? ` ${label}` : ''}`;
    };
    const hasTiles =
      typeof revenue === 'number' ||
      (typeof poverty?.percentChange === 'number' && poverty.percentChange !== 0) ||
      (typeof betterOff === 'number' && betterOff > 0) ||
      (typeof worseOff === 'number' && worseOff > 0);
    return (
      <WorkspaceLayout>
        <Stack style={{ gap: spacing.lg }}>
          {backLink}
          <Title order={1} style={{ margin: 0 }}>
            {selectedBill.title}
          </Title>
          {selectedBill.summary && (
            <Text
              style={{
                fontSize: typography.fontSize.base,
                color: colors.text.secondary,
                lineHeight: 1.6,
              }}
            >
              {selectedBill.summary}
            </Text>
          )}
          {hasTiles && (
            <Stack style={{ flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap' }}>
              {typeof revenue === 'number' && (
                <StatTile value={money(revenue)} label="revenue change" />
              )}
              {typeof poverty?.percentChange === 'number' && poverty.percentChange !== 0 && (
                <StatTile
                  value={`${poverty.percentChange > 0 ? '+' : '−'}${Math.abs(poverty.percentChange).toFixed(1)}%`}
                  label="poverty rate change"
                />
              )}
              {typeof betterOff === 'number' && betterOff > 0 && (
                <StatTile value={`${betterOff.toFixed(0)}%`} label="households better off" />
              )}
              {typeof worseOff === 'number' && worseOff > 0 && (
                <StatTile value={`${worseOff.toFixed(0)}%`} label="households worse off" />
              )}
            </Stack>
          )}
          {provisions.length > 0 ? (
            // A bill's value in today's law has passed, and was scored against the law
            // before it, so "current law" would mislead; the value reads alone.
            <ProvisionList provisions={provisions} sameValueNote="" />
          ) : (
            <Text style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
              Parameter mapping for this bill hasn't been published yet — report and draft actions
              unlock when it lands.
            </Text>
          )}
          {scoresOtherChange && (
            <Text style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
              The model parameters the legislative tracker stored for this bill do not match its
              write-up of the changes, so a report or draft from them would score a different
              change.
            </Text>
          )}
          <Stack
            style={{
              flexDirection: 'row',
              gap: spacing.sm,
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            {selectedBill.impactData ? (
              <Button onClick={() => nav.push(`/${countryId}/report/bill/${selectedBill.id}`)}>
                <IconChartBar size={16} />
                View impact report
              </Button>
            ) : (
              <Button
                onClick={() =>
                  // The title says which bill; no place-and-status line under it.
                  runReport.run(
                    selectedBill.title,
                    '',
                    provisions,
                    null,
                    billRunYear(selectedBill.provisions),
                    // A state bill runs on its state, as its own report does.
                    { region: billRegion(selectedBill, countryId) }
                  )
                }
                disabled={runReport.isRunning || provisions.length === 0 || scoresOtherChange}
              >
                <IconChartBar size={16} />
                {runReport.isRunning ? 'Starting report…' : 'Run impact report'}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => openBillAsDraft(selectedBill)}
              disabled={provisions.length === 0 || scoresOtherChange}
            >
              <IconPencil size={16} />
              Open as draft reform
            </Button>
            {selectedBill.legiscanUrl && (
              <a
                href={selectedBill.legiscanUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: typography.fontSize.sm,
                  color: colors.text.secondary,
                  fontFamily: typography.fontFamily.primary,
                }}
              >
                LegiScan
                <IconExternalLink size={13} />
              </a>
            )}
            {runReport.error && (
              <Text style={{ fontSize: typography.fontSize.xs, color: colors.error }}>
                {runReport.error}
              </Text>
            )}
          </Stack>
        </Stack>
      </WorkspaceLayout>
    );
  }

  // ---- Detail: one of your reforms (read only: changes are made in Build) ----
  if (selectedReform) {
    const reformName = selectedReform.label || 'Untitled reform';
    const count = selectedReform.parameters.length;
    // The store starts with no parameters; names and current law need them.
    const metadataReady = !!parameters && Object.keys(parameters).length > 0;
    return (
      <WorkspaceLayout>
        <Stack style={{ gap: spacing.xl }}>
          {backLink}
          <Stack style={{ gap: spacing.xs }}>
            <Title order={1} style={{ margin: 0 }}>
              {reformName}
            </Title>
            <Text
              style={{ margin: 0, fontSize: typography.fontSize.sm, color: colors.text.secondary }}
            >
              {count} {count === 1 ? 'provision' : 'provisions'}
              {selectedReform.createdAt
                ? ` · saved ${dayjs(selectedReform.createdAt).format('MMM D, YYYY')}`
                : ''}
            </Text>
          </Stack>

          <div role="table" aria-label="Parameters">
            <div role="row" style={{ ...PARAMETER_ROW, paddingTop: 0 }}>
              {['Parameter', 'Current law', 'Your reform', 'From'].map((heading) => (
                <span key={heading} role="columnheader" style={PARAMETER_HEADING}>
                  {heading}
                </span>
              ))}
            </div>
            {!metadataReady ? (
              // Names and current law come with the model's metadata: until
              // then each row holds its place, rather than empty boxes.
              <SkeletonRegion label="Loading parameters">
                {selectedReform.parameters.map((parameter) => (
                  <div key={parameter.name} style={PARAMETER_ROW}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <SkeletonLine width="60%" />
                      <SkeletonLine width="40%" height={10} />
                    </div>
                    <SkeletonLine width={56} />
                    <SkeletonLine width={64} />
                    <SkeletonLine width={64} />
                  </div>
                ))}
              </SkeletonRegion>
            ) : (
              selectedReform.parameters.map((parameter) => {
                const unit = parameters[parameter.name]?.unit ?? null;
                const first = parameter.values[0];
                // Current law where the change starts, not today.
                const baseline = first
                  ? currentLawAt(parameter.name, Number(first.startDate.slice(0, 4)))
                  : getCurrentValue(parameters[parameter.name]?.values);
                // One row per period the reform sets, each read against
                // current law in its own first year.
                const periods = parameter.values.length > 0 ? parameter.values : [];
                const parts = resolveBreadcrumb(parameter.name).split(' → ');
                const name = parts[parts.length - 1] ?? parameter.name;
                const context = parts.slice(0, -1).join(' → ');
                const nameCell = (
                  <div
                    role="cell"
                    style={{ minWidth: 0 }}
                    title={resolveBreadcrumb(parameter.name)}
                  >
                    <Text
                      style={{
                        margin: 0,
                        fontSize: typography.fontSize.sm,
                        lineHeight: '20px',
                        fontWeight: typography.fontWeight.medium,
                        color: colors.text.primary,
                      }}
                    >
                      {name.charAt(0).toUpperCase() + name.slice(1)}
                    </Text>
                    {context && (
                      <Text
                        className="tw:truncate"
                        style={{
                          margin: 0,
                          fontSize: typography.fontSize.xs,
                          color: colors.text.secondary,
                        }}
                      >
                        {context}
                      </Text>
                    )}
                  </div>
                );
                if (periods.length === 0) {
                  return (
                    <div key={parameter.name} role="row" style={PARAMETER_ROW}>
                      {nameCell}
                      <span role="cell" style={PARAMETER_MUTED}>
                        {displayValue(baseline, unit)}
                      </span>
                      <span role="cell" style={PARAMETER_VALUE} />
                      <span role="cell" style={PARAMETER_MUTED} />
                    </div>
                  );
                }
                // Each column lists the periods, one line each, so a period
                // reads straight across; the name sits at the top.
                const column = (
                  render: (period: (typeof periods)[number]) => React.ReactNode,
                  style: React.CSSProperties
                ) => (
                  <span
                    role="cell"
                    style={{ ...style, display: 'flex', flexDirection: 'column', gap: spacing.xs }}
                  >
                    {periods.map((period) => (
                      <span key={period.startDate} style={{ lineHeight: '20px' }}>
                        {render(period)}
                      </span>
                    ))}
                  </span>
                );
                return (
                  <div
                    key={parameter.name}
                    role="row"
                    style={{ ...PARAMETER_ROW, alignItems: 'start' }}
                  >
                    {nameCell}
                    {column(
                      (period) =>
                        displayValue(
                          currentLawAt(parameter.name, Number(period.startDate.slice(0, 4))),
                          unit
                        ),
                      PARAMETER_MUTED
                    )}
                    {column((period) => displayValue(period.value, unit), PARAMETER_VALUE)}
                    {column((period) => periodLabel(period), PARAMETER_MUTED)}
                  </div>
                );
              })
            )}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: spacing.sm,
            }}
          >
            <Button
              onClick={() => {
                // A report of these values already exists, done or still
                // computing: open it rather than starting the wait again.
                const latest = latestMatchingReport(
                  selectedReform,
                  reportsFor(selectedReform.id),
                  reformRunYear(selectedReform)
                );
                if (latest) {
                  nav.push(`/${countryId}/report/${latest.apiReportId}`);
                  return;
                }
                void runReport.run(
                  reformName,
                  SOURCE_LABELS[selectedReform.provenance.source],
                  reformProvisions(selectedReform),
                  // Links the report record to the saved reform it came from.
                  selectedReform.id,
                  reformRunYear(selectedReform)
                );
              }}
              disabled={runReport.isRunning}
            >
              <IconChartBar size={16} />
              {runReport.isRunning ? 'Starting report…' : 'View full impact report'}
            </Button>
            <DeleteReformDialog
              name={reformName}
              reportCount={reportsFor(selectedReform.id).length}
              disabled={deleteMutation.isPending}
              onConfirm={() => deleteMutation.mutate(selectedReform.id!)}
            />
          </div>
          {runReport.error && (
            <Text role="alert" style={{ fontSize: typography.fontSize.sm, color: colors.error }}>
              {runReport.error}
            </Text>
          )}
          {deleteMutation.isError && (
            <Text role="alert" style={{ fontSize: typography.fontSize.sm, color: colors.error }}>
              Could not delete the reform. Try again.
            </Text>
          )}

          <ReformReports
            countryId={countryId}
            reports={reportsFor(selectedReform.id)}
            rerunning={runReport.isRunning}
            onRerun={async (report) => {
              // The same report on today's model: its reform as it ran, its
              // year, population, budget window and comparison.
              const settings = await rerunSettings(countryId, report);
              await runReport.run(
                report.title || selectedReform.label || 'Untitled reform',
                report.sourceNote || SOURCE_LABELS[selectedReform.provenance.source],
                report.provisions,
                selectedReform.id,
                Number(report.year) || undefined,
                settings
              );
            }}
          />
        </Stack>
      </WorkspaceLayout>
    );
  }

  // ---- The browsing surface ----
  const buildAction = (
    <Button size="sm" onClick={() => nav.push(`/${countryId}/build`)}>
      Build a reform
    </Button>
  );
  return (
    <WorkspaceLayout wide>
      <Stack style={{ gap: spacing.lg }}>
        <Stack
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: spacing.md,
            // On a narrow screen the actions move under the title.
            flexWrap: 'wrap',
          }}
        >
          <Title order={1} style={{ margin: 0 }}>
            Reforms
          </Title>
          <Stack style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            {countryId === 'us' && <TrackerHomeButton />}
            <Button onClick={() => nav.push(`/${countryId}/build`)}>
              New reform
              <IconPlus size={16} />
            </Button>
          </Stack>
        </Stack>

        <Stack
          style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, alignItems: 'center' }}
        >
          {(
            [
              { id: 'bills', label: 'Tracked bills' },
              { id: 'yours', label: 'Your library' },
            ] as const
          ).map((option) => {
            const active = tab === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  setTab(option.id);
                  setSelectedId(null);
                }}
                aria-pressed={active}
                className="tw:max-sm:min-h-10"
                style={{
                  border: 'none',
                  background: 'none',
                  padding: `0 0 ${spacing.xs}`,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  fontSize: typography.fontSize.base,
                  fontFamily: typography.fontFamily.primary,
                  fontWeight: active
                    ? typography.fontWeight.semibold
                    : typography.fontWeight.normal,
                  color: active ? colors.text.primary : colors.text.secondary,
                  borderBottom: `2px solid ${active ? colors.primary[500] : 'transparent'}`,
                }}
              >
                {option.label}
              </button>
            );
          })}
        </Stack>

        {/* Search first, then the bill filters beside it. */}
        <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-3">
          <div
            // On a phone the search fills the line.
            className="tw:max-sm:min-h-10 tw:max-sm:min-w-0 tw:max-sm:grow tw:max-sm:basis-[160px]"
            style={{ ...filterControl, width: 220 }}
          >
            <IconSearch size={14} color={colors.text.secondary} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search"
              aria-label="Search reforms"
              // 16px on a phone, so the browser does not zoom in to type.
              className="tw:max-sm:-my-px tw:max-sm:h-10 tw:max-sm:text-base!"
              style={{
                flex: 1,
                minWidth: 0,
                border: 'none',
                outline: 'none',
                fontSize: typography.fontSize.sm,
                fontFamily: typography.fontFamily.primary,
                background: 'transparent',
              }}
            />
          </div>
          {tab === 'bills' && billsConfigured && bills.length > 0 && (
            <BillFeedFilters
              bills={bills}
              searched={searchedBills}
              value={billFilters}
              onChange={setBillFilters}
              controlStyle={filterControl}
            />
          )}
        </div>

        {tab === 'yours' && isPending && <CardGridSkeleton label="Loading your reforms" />}
        {tab === 'yours' && isError && (
          <ErrorState title="Could not load your reforms" onRetry={invalidate} />
        )}

        {tab === 'bills' && billsLoading && <CardGridSkeleton label="Loading bills" withStats />}
        {tab === 'bills' && billsError && (
          <ErrorState title="Could not load the bill feed" onRetry={retryBills} />
        )}
        {tab === 'bills' && !billsLoading && !billsError && !billsConfigured && (
          <EmptyState
            icon={<IconScale size={22} />}
            title="The bill feed is not configured here."
            action={buildAction}
          />
        )}
        {tab === 'bills' && !billsLoading && !billsError && billsConfigured && (
          <>
            {bills.length === 0 && (
              <EmptyState
                icon={<IconScale size={22} />}
                title="No analyzed bills yet."
                action={buildAction}
              />
            )}
            {bills.length > 0 && visibleBills.length === 0 && (
              <EmptyState
                title="No bills match."
                action={
                  <Button size="sm" variant="outline" onClick={clearBillFilters}>
                    Clear filters
                  </Button>
                }
              />
            )}
          </>
        )}
        {/* Saved reforms a search hides are a different empty from none at all. */}
        {tab === 'yours' &&
          !isPending &&
          !isError &&
          visibleReforms.length === 0 &&
          ((reforms ?? []).length === 0 ? (
            <EmptyState
              icon={<IconScale size={22} />}
              title="No saved reforms yet."
              action={buildAction}
            />
          ) : (
            <EmptyState
              title="No reforms match."
              action={
                <Button size="sm" variant="outline" onClick={() => setQuery('')}>
                  Clear search
                </Button>
              }
            />
          ))}

        <div style={CARD_GRID_STYLE}>
          {tab === 'bills' &&
            pagedBills.map((bill) => (
              <Card
                key={bill.id}
                eyebrow={billPlace(bill)}
                badge={<BillStageBadge status={bill.status} />}
                title={bill.title}
                body={bill.summary}
                linkUrl={bill.legiscanUrl}
                stats={billStats(bill)}
                // Scored bills go straight to their report — the detail
                // view is the launchpad for bills without one yet.
                onClick={() =>
                  bill.impactData
                    ? nav.push(`/${countryId}/report/bill/${bill.id}`)
                    : setSelectedId(bill.id)
                }
              />
            ))}
          {tab === 'yours' &&
            visibleReforms.map((reform) => (
              <Card
                key={reform.id}
                eyebrow={`${reform.parameters.length} provision${reform.parameters.length === 1 ? '' : 's'}`}
                title={reform.label || 'Untitled reform'}
                body={reportsLine(reform.id)}
                onClick={() => openReform(reform)}
              />
            ))}
        </div>

        {tab === 'bills' && hasMoreBills && (
          <div
            ref={loadMoreRef}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: spacing.sm,
              padding: spacing.md,
            }}
          >
            <Text style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
              Showing {pagedBills.length} of {visibleBills.length} bills
            </Text>
            <Button
              variant="outline"
              onClick={() => setBillsShown((count) => count + BILLS_PAGE_SIZE)}
            >
              Show more
            </Button>
          </div>
        )}
      </Stack>
    </WorkspaceLayout>
  );
}
