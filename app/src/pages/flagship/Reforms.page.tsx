import { useMemo, useState } from 'react';
import {
  IconChartBar,
  IconChevronDown,
  IconChevronRight,
  IconCopy,
  IconDeviceFloppy,
  IconExternalLink,
  IconPencil,
  IconPlus,
  IconScale,
  IconSearch,
  IconTrash,
} from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { getReformStore } from '@/api/reformStore';
import ValueInput from '@/components/flagship/ValueInput';
import WorkspaceLayout from '@/components/flagship/WorkspaceLayout';
import { Button, Spinner, Stack, Text, Title } from '@/components/ui';
import { FOREVER, MOCK_USER_ID, WEBSITE_URL } from '@/constants';
import { useAppLocation } from '@/contexts/LocationContext';
import { useAppNavigate } from '@/contexts/NavigationContext';
import { SAMPLE_BILLS, SampleBill } from '@/data/flagship/sampleBills';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useRunFlagshipReport } from '@/hooks/useRunFlagshipReport';
import {
  addDraftProvision,
  clearDraftReform,
  loadReformIntoDraft,
  setDraftLabel,
} from '@/libs/draftReform';
import { RootState } from '@/store';
import { Reform, ReformSource } from '@/types/ingredients/Reform';
import {
  formatCompactBreadcrumb,
  formatLabelParts,
  getHierarchicalLabels,
} from '@/utils/parameterLabels';
import { formatValue, getCurrentValue } from '@/utils/parameterValues';

const SOURCE_LABELS: Record<ReformSource, string> = {
  manual: 'Hand-built',
  chat: 'From a question',
  bill: 'From a bill',
  tool: 'From a tool',
};

type FilterKind = 'all' | 'bills' | 'yours';

const FILTERS: { id: FilterKind; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'bills', label: 'In Congress' },
  { id: 'yours', label: 'Yours' },
];

/**
 * Reforms — the combined surface for everything reform-shaped: bills
 * analyzed by PolicyEngine (read-only, fork to edit) and the user's
 * saved reforms (amendable in place), one list with provenance badges
 * and filter chips. Every row's endgame is the same: view the full
 * impact report or open as a draft.
 */
export default function ReformsPage() {
  const nav = useAppNavigate();
  const countryId = useCurrentCountry();
  const queryClient = useQueryClient();
  const parameters = useSelector((state: RootState) => state.metadata.parameters);
  const appLocation = useAppLocation();
  const urlParams = useMemo(() => new URLSearchParams(appLocation.search), [appLocation.search]);

  const [filter, setFilter] = useState<FilterKind>(() => {
    const requested = urlParams.get('filter');
    return requested === 'bills' || requested === 'yours' ? requested : 'all';
  });
  const [query, setQuery] = useState('');
  // Deep links (?bill=<id>) open with that bill's row expanded.
  const [expandedId, setExpandedId] = useState<string | null>(() => urlParams.get('bill'));
  const [editedLabel, setEditedLabel] = useState('');
  const [editedValues, setEditedValues] = useState<Record<string, any>>({});

  const runReport = useRunFlagshipReport();

  const {
    data: reforms,
    isPending,
    isError,
  } = useQuery({
    queryKey: ['reforms', MOCK_USER_ID, countryId],
    queryFn: () => getReformStore().findByUser(MOCK_USER_ID, countryId),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['reforms'] });

  const saveMutation = useMutation({
    mutationFn: (reform: Reform) =>
      getReformStore().update(reform.id!, {
        label: editedLabel || null,
        parameters: reform.parameters.map((parameter) => ({
          name: parameter.name,
          values: [
            {
              startDate: parameter.values[0]?.startDate ?? `${new Date().getFullYear()}-01-01`,
              endDate: parameter.values[0]?.endDate ?? FOREVER,
              value: editedValues[parameter.name],
            },
          ],
        })),
      }),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (reformId: string) => getReformStore().delete(reformId),
    onSuccess: () => {
      setExpandedId(null);
      invalidate();
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: (reform: Reform) =>
      getReformStore().create({
        userId: reform.userId,
        countryId: reform.countryId,
        label: `${reform.label || 'Untitled reform'} (copy)`,
        parameters: reform.parameters,
        baseline: reform.baseline,
        provenance: reform.provenance,
      }),
    onSuccess: invalidate,
  });

  const bills = useMemo(
    () => SAMPLE_BILLS.filter((bill) => bill.countryId === countryId),
    [countryId]
  );

  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const matchesQuery = (haystack: string) =>
    tokens.every((token) => haystack.toLowerCase().includes(token));

  const visibleBills =
    filter === 'yours'
      ? []
      : bills.filter((bill) => matchesQuery(`${bill.title} ${bill.jurisdiction} ${bill.summary}`));
  const visibleReforms =
    filter === 'bills'
      ? []
      : (reforms ?? []).filter((reform) => matchesQuery(reform.label || 'Untitled reform'));

  const resolveBreadcrumb = (path: string, fallback?: string) =>
    parameters?.[path]
      ? formatLabelParts(getHierarchicalLabels(path, parameters))
      : (fallback ?? path);

  const billProvisions = (bill: SampleBill) =>
    bill.provisions.map((provision) => {
      const metadata = parameters?.[provision.path];
      return {
        path: provision.path,
        breadcrumb: resolveBreadcrumb(provision.path, provision.fallbackBreadcrumb),
        unit: metadata?.unit ?? null,
        baselineValue: getCurrentValue(metadata?.values),
        value: provision.proposedValue,
      };
    });

  const reformProvisions = (reform: Reform) =>
    reform.parameters.map((parameter) => {
      const metadata = parameters?.[parameter.name];
      return {
        path: parameter.name,
        breadcrumb: resolveBreadcrumb(parameter.name),
        unit: metadata?.unit ?? null,
        baselineValue: getCurrentValue(metadata?.values),
        value: parameter.values[0]?.value,
      };
    });

  const openBillAsDraft = (bill: SampleBill) => {
    clearDraftReform();
    billProvisions(bill).forEach((provision) =>
      addDraftProvision(countryId, provision, 'bill', bill.id)
    );
    setDraftLabel(bill.title);
  };

  const toggleReform = (reform: Reform) => {
    if (expandedId === reform.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(reform.id!);
    setEditedLabel(reform.label ?? '');
    setEditedValues(Object.fromEntries(reform.parameters.map((p) => [p.name, p.values[0]?.value])));
  };

  const amendInBuild = (reform: Reform) => {
    loadReformIntoDraft(reform, (path) => ({
      breadcrumb: resolveBreadcrumb(path),
      unit: parameters?.[path]?.unit ?? null,
      baselineValue: getCurrentValue(parameters?.[path]?.values),
    }));
    nav.push(`/${countryId}/build`);
  };

  const isDirty = (reform: Reform) =>
    editedLabel !== (reform.label ?? '') ||
    reform.parameters.some((p) => editedValues[p.name] !== p.values[0]?.value);

  const rowButtonStyle = (isExpanded: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'flex-start',
    gap: spacing.md,
    width: '100%',
    padding: `${spacing.sm} ${spacing.lg}`,
    border: 'none',
    background: isExpanded ? colors.gray[50] : 'transparent',
    cursor: 'pointer',
    textAlign: 'left',
    fontFamily: typography.fontFamily.primary,
  });

  const ellipsis: React.CSSProperties = {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  /** Two-line row body: title + muted preview, with plain meta text right. */
  const rowBody = (title: string, preview: string, meta: string) => (
    <>
      <Stack style={{ flex: 1, gap: 2, minWidth: 0 }}>
        <Text
          style={{
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.medium,
            color: colors.text.primary,
            ...ellipsis,
          }}
        >
          {title}
        </Text>
        {preview && (
          <Text
            style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary, ...ellipsis }}
          >
            {preview}
          </Text>
        )}
      </Stack>
      <Text
        style={{
          fontSize: typography.fontSize.xs,
          color: colors.text.secondary,
          whiteSpace: 'nowrap',
          flexShrink: 0,
          paddingTop: 2,
        }}
      >
        {meta}
      </Text>
    </>
  );

  /** One-line change preview for a saved reform, e.g. "Amount: $2,000 → $3,600 · +2 more". */
  const reformPreview = (reform: Reform) => {
    const first = reform.parameters[0];
    if (!first) {
      return 'No provisions yet';
    }
    const breadcrumb = resolveBreadcrumb(first.name);
    const tail = breadcrumb.split(' → ').slice(-2).join(' → ');
    const unit = parameters?.[first.name]?.unit ?? null;
    const baseline = getCurrentValue(parameters?.[first.name]?.values);
    const change = `${tail}: ${formatValue(baseline, unit)} → ${formatValue(first.values[0]?.value, unit)}`;
    const more = reform.parameters.length - 1;
    return more > 0 ? `${change} · +${more} more` : change;
  };

  const provisionTable = (
    provisions: {
      path: string;
      breadcrumb: string;
      unit: string | null;
      baselineValue: any;
      value: any;
    }[]
  ) => (
    <div style={{ background: colors.gray[50], borderRadius: 8, padding: `${spacing.xs} 0` }}>
      {provisions.map((provision) => (
        <div
          key={provision.path}
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: spacing.lg,
            padding: `${spacing.xs} ${spacing.md}`,
          }}
        >
          <Text
            title={provision.breadcrumb}
            style={{
              fontSize: typography.fontSize.sm,
              color: colors.text.primary,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {formatCompactBreadcrumb(provision.breadcrumb)}
          </Text>
          <Text
            style={{
              fontSize: typography.fontSize.sm,
              whiteSpace: 'nowrap',
              flexShrink: 0,
              color: colors.text.secondary,
            }}
          >
            {formatValue(provision.baselineValue, provision.unit)} →{' '}
            <span
              style={{ color: colors.primary[700], fontWeight: typography.fontWeight.semibold }}
            >
              {formatValue(provision.value, provision.unit)}
            </span>
          </Text>
        </div>
      ))}
    </div>
  );

  const hasRows = visibleBills.length > 0 || visibleReforms.length > 0;

  return (
    <WorkspaceLayout>
      <Stack style={{ gap: spacing.lg }}>
        <Stack
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: spacing.md,
          }}
        >
          <Title order={1} style={{ margin: 0 }}>
            Reforms
          </Title>
          <Button onClick={() => nav.push(`/${countryId}/build`)}>
            New reform
            <IconPlus size={16} />
          </Button>
        </Stack>

        <Stack
          style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center', flexWrap: 'wrap' }}
        >
          <div
            style={{
              display: 'flex',
              gap: spacing.xs,
              padding: 3,
              background: colors.gray[100],
              borderRadius: 999,
            }}
            role="group"
            aria-label="Filter reforms"
          >
            {FILTERS.map((option) => {
              const active = filter === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFilter(option.id)}
                  style={{
                    padding: `${spacing.xs} ${spacing.md}`,
                    borderRadius: 999,
                    border: 'none',
                    background: active ? colors.background.primary : 'transparent',
                    color: active ? colors.text.primary : colors.text.secondary,
                    fontSize: typography.fontSize.sm,
                    fontFamily: typography.fontFamily.primary,
                    fontWeight: active
                      ? typography.fontWeight.medium
                      : typography.fontWeight.normal,
                    cursor: 'pointer',
                    boxShadow: active ? '0 1px 2px rgba(0, 0, 0, 0.08)' : 'none',
                  }}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.xs,
              padding: `${spacing.xs} ${spacing.md}`,
              border: `1px solid ${colors.border.light}`,
              borderRadius: 8,
              background: colors.background.primary,
              flex: 1,
              minWidth: 200,
            }}
          >
            <IconSearch size={14} color={colors.text.secondary} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search reforms"
              aria-label="Search reforms"
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                fontSize: typography.fontSize.sm,
                fontFamily: typography.fontFamily.primary,
                background: 'transparent',
              }}
            />
          </div>
        </Stack>

        {isPending && filter !== 'bills' && <Spinner />}
        {isError && filter !== 'bills' && (
          <Text style={{ color: colors.error, fontSize: typography.fontSize.sm }}>
            Could not load your reforms. Try reloading the page.
          </Text>
        )}

        {!hasRows && !isPending && (
          <Stack
            style={{
              padding: spacing['2xl'],
              border: `1px dashed ${colors.border.light}`,
              borderRadius: 8,
              alignItems: 'center',
              gap: spacing.sm,
            }}
          >
            <IconScale size={24} color={colors.text.secondary} />
            <Text style={{ color: colors.text.secondary, fontSize: typography.fontSize.sm }}>
              {filter === 'yours'
                ? 'No saved reforms yet. Build one, or ask a policy question to get started.'
                : 'Nothing matches — adjust the search or filter.'}
            </Text>
          </Stack>
        )}

        {hasRows && (
          <div
            style={{
              border: `1px solid ${colors.border.light}`,
              borderRadius: 12,
              background: colors.background.primary,
              overflow: 'hidden',
            }}
          >
            {visibleReforms.map((reform, i) => {
              const isExpanded = expandedId === reform.id;
              const ChevronIcon = isExpanded ? IconChevronDown : IconChevronRight;
              return (
                <div
                  key={reform.id}
                  style={{ borderTop: i === 0 ? 'none' : `1px solid ${colors.border.light}` }}
                >
                  <button
                    type="button"
                    onClick={() => toggleReform(reform)}
                    aria-expanded={isExpanded}
                    style={rowButtonStyle(isExpanded)}
                  >
                    <ChevronIcon
                      size={14}
                      color={colors.text.secondary}
                      style={{ flexShrink: 0, marginTop: 3 }}
                    />
                    {rowBody(
                      reform.label || 'Untitled reform',
                      reformPreview(reform),
                      reform.parameters.length === 1
                        ? '1 provision'
                        : `${reform.parameters.length} provisions`
                    )}
                  </button>

                  {isExpanded && (
                    <Stack
                      style={{ gap: spacing.md, padding: `0 ${spacing.lg} ${spacing.lg} 40px` }}
                    >
                      <Text
                        style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}
                      >
                        {SOURCE_LABELS[reform.provenance.source]}
                      </Text>
                      <input
                        value={editedLabel}
                        onChange={(event) => setEditedLabel(event.target.value)}
                        placeholder="Name this reform"
                        aria-label="Reform name"
                        style={{
                          padding: `${spacing.sm} ${spacing.md}`,
                          border: `1px solid ${colors.border.light}`,
                          borderRadius: 8,
                          fontSize: typography.fontSize.sm,
                          fontFamily: typography.fontFamily.primary,
                          maxWidth: 420,
                        }}
                      />
                      {reform.parameters.map((parameter) => {
                        const baseline = getCurrentValue(parameters?.[parameter.name]?.values);
                        const unit = parameters?.[parameter.name]?.unit ?? null;
                        return (
                          <Stack
                            key={parameter.name}
                            style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}
                          >
                            <Stack style={{ flex: 1, gap: 2, minWidth: 0 }}>
                              <Text
                                title={resolveBreadcrumb(parameter.name)}
                                style={{
                                  fontSize: typography.fontSize.sm,
                                  color: colors.text.primary,
                                }}
                              >
                                {formatCompactBreadcrumb(resolveBreadcrumb(parameter.name))}
                              </Text>
                            </Stack>
                            <Text
                              style={{
                                fontSize: typography.fontSize.sm,
                                color: colors.text.secondary,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {formatValue(baseline, unit)} →
                            </Text>
                            <ValueInput
                              value={editedValues[parameter.name]}
                              onChange={(next) =>
                                setEditedValues((current) => ({
                                  ...current,
                                  [parameter.name]: next,
                                }))
                              }
                              ariaLabel={`New value for ${parameter.name}`}
                            />
                          </Stack>
                        );
                      })}
                      {saveMutation.isError && (
                        <Text style={{ fontSize: typography.fontSize.sm, color: colors.error }}>
                          Could not save the changes. Try again.
                        </Text>
                      )}
                      <Stack style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
                        <Button
                          size="sm"
                          onClick={() =>
                            runReport.run(
                              reform.label || 'Untitled reform',
                              SOURCE_LABELS[reform.provenance.source],
                              reformProvisions(reform)
                            )
                          }
                          disabled={runReport.isRunning}
                        >
                          <IconChartBar size={14} />
                          {runReport.isRunning ? 'Starting report…' : 'View full impact report'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!isDirty(reform) || saveMutation.isPending}
                          onClick={() => saveMutation.mutate(reform)}
                        >
                          <IconDeviceFloppy size={14} />
                          Save changes
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => amendInBuild(reform)}>
                          <IconSearch size={14} />
                          Add parameters in Build
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={duplicateMutation.isPending}
                          onClick={() => duplicateMutation.mutate(reform)}
                        >
                          <IconCopy size={14} />
                          Duplicate
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={deleteMutation.isPending}
                          onClick={() => deleteMutation.mutate(reform.id!)}
                        >
                          <IconTrash size={14} />
                          Delete
                        </Button>
                        {runReport.error && (
                          <Text style={{ fontSize: typography.fontSize.xs, color: colors.error }}>
                            {runReport.error}
                          </Text>
                        )}
                      </Stack>
                    </Stack>
                  )}
                </div>
              );
            })}

            {visibleBills.map((bill, i) => {
              const isExpanded = expandedId === bill.id;
              const ChevronIcon = isExpanded ? IconChevronDown : IconChevronRight;
              return (
                <div
                  key={bill.id}
                  style={{
                    borderTop:
                      i === 0 && visibleReforms.length === 0
                        ? 'none'
                        : `1px solid ${colors.border.light}`,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : bill.id)}
                    aria-expanded={isExpanded}
                    style={rowButtonStyle(isExpanded)}
                  >
                    <ChevronIcon
                      size={14}
                      color={colors.text.secondary}
                      style={{ flexShrink: 0, marginTop: 3 }}
                    />
                    {rowBody(bill.title, bill.summary, `${bill.jurisdiction} · ${bill.status}`)}
                  </button>

                  {isExpanded && (
                    <Stack
                      style={{ gap: spacing.md, padding: `0 ${spacing.lg} ${spacing.lg} 40px` }}
                    >
                      <Text
                        style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}
                      >
                        {bill.summary}
                      </Text>
                      {provisionTable(billProvisions(bill))}
                      <Stack
                        style={{
                          flexDirection: 'row',
                          gap: spacing.sm,
                          alignItems: 'center',
                          flexWrap: 'wrap',
                        }}
                      >
                        <Button
                          size="sm"
                          onClick={() =>
                            runReport.run(
                              bill.title,
                              `${bill.jurisdiction} · ${bill.status}`,
                              billProvisions(bill)
                            )
                          }
                          disabled={runReport.isRunning}
                        >
                          <IconChartBar size={14} />
                          {runReport.isRunning ? 'Starting report…' : 'View full impact report'}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => openBillAsDraft(bill)}>
                          <IconPencil size={14} />
                          Open as draft reform
                        </Button>
                        {runReport.error && (
                          <Text style={{ fontSize: typography.fontSize.xs, color: colors.error }}>
                            {runReport.error}
                          </Text>
                        )}
                      </Stack>
                    </Stack>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {filter !== 'yours' && (
          <Text
            style={{
              fontSize: typography.fontSize.xs,
              color: colors.text.secondary,
            }}
          >
            Bills are illustrative samples until the tracker API connects ·{' '}
            <a
              href={`${WEBSITE_URL}/${countryId}/bill-tracker`}
              target="_blank"
              rel="noreferrer"
              style={{
                color: colors.text.secondary,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              full tracker
              <IconExternalLink size={11} />
            </a>
          </Text>
        )}
      </Stack>
    </WorkspaceLayout>
  );
}
