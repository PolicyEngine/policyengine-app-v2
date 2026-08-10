import { useMemo, useState } from 'react';
import {
  IconArrowLeft,
  IconChartBar,
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
import { TrackedBill } from '@/api/billFeed';
import { getReformStore } from '@/api/reformStore';
import ProvisionList from '@/components/flagship/ProvisionList';
import ValueInput from '@/components/flagship/ValueInput';
import WorkspaceLayout from '@/components/flagship/WorkspaceLayout';
import { Button, Spinner, Stack, Text, Title } from '@/components/ui';
import { FOREVER, MOCK_USER_ID } from '@/constants';
import { useAppLocation } from '@/contexts/LocationContext';
import { useAppNavigate } from '@/contexts/NavigationContext';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useRunFlagshipReport } from '@/hooks/useRunFlagshipReport';
import { useTrackedBills } from '@/hooks/useTrackedBills';
import {
  addDraftProvision,
  clearDraftReform,
  loadReformIntoDraft,
  setDraftLabel,
} from '@/libs/draftReform';
import { RootState } from '@/store';
import { Reform, ReformSource } from '@/types/ingredients/Reform';
import { formatBudgetaryImpact } from '@/utils/formatPowers';
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

type Tab = 'bills' | 'yours';

interface ProvisionView {
  path: string;
  breadcrumb: string;
  unit: string | null;
  baselineValue: any;
  value: any;
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
  title,
  body,
  stats,
  linkUrl,
  onClick,
}: {
  eyebrow: string;
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
        <div style={{ flex: 1 }} />
        {linkUrl && (
          <a
            href={linkUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="Bill text"
            onClick={(event) => event.stopPropagation()}
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
 * In Congress (bills analyzed with the PolicyEngine model, live from
 * the tracker) and Yours (saved reforms, amendable). Cards open a
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
  const [placeFilter, setPlaceFilter] = useState('all');
  // Deep links (?bill=<id>) open straight into that bill's detail.
  const [selectedId, setSelectedId] = useState<string | null>(() => urlParams.get('bill'));
  const [editedLabel, setEditedLabel] = useState('');
  const [editedValues, setEditedValues] = useState<Record<string, any>>({});

  const runReport = useRunFlagshipReport();
  const { bills, isLive } = useTrackedBills(countryId);

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
      setSelectedId(null);
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

  const resolveBreadcrumb = (path: string, fallback?: string) =>
    parameters?.[path]
      ? formatLabelParts(getHierarchicalLabels(path, parameters))
      : (fallback ?? path);

  const billProvisions = (bill: TrackedBill): ProvisionView[] =>
    bill.provisions.map((provision) => {
      const metadata = parameters?.[provision.path];
      return {
        path: provision.path,
        breadcrumb: resolveBreadcrumb(provision.path, provision.fallbackBreadcrumb),
        unit: metadata?.unit ?? null,
        baselineValue: getCurrentValue(metadata?.values),
        value: provision.value,
      };
    });

  const reformProvisions = (reform: Reform): ProvisionView[] =>
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

  const places = useMemo(
    () => [...new Set(bills.map((bill) => bill.jurisdiction))].sort((a, b) => a.localeCompare(b)),
    [bills]
  );

  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const matches = (haystack: string) =>
    tokens.every((token) => haystack.toLowerCase().includes(token));

  const visibleBills = bills
    .filter(
      (bill) =>
        (placeFilter === 'all' || bill.jurisdiction === placeFilter) &&
        matches(`${bill.title} ${bill.jurisdiction} ${bill.summary}`)
    )
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));

  const visibleReforms = (reforms ?? []).filter((reform) =>
    matches(reform.label || 'Untitled reform')
  );

  const selectedBill = selectedId ? bills.find((bill) => bill.id === selectedId) : null;
  const selectedReform = selectedId
    ? (reforms ?? []).find((reform) => reform.id === selectedId)
    : null;

  const openReform = (reform: Reform) => {
    setSelectedId(reform.id!);
    setEditedLabel(reform.label ?? '');
    setEditedValues(Object.fromEntries(reform.parameters.map((p) => [p.name, p.values[0]?.value])));
  };

  const openBillAsDraft = (bill: TrackedBill) => {
    clearDraftReform();
    billProvisions(bill).forEach((provision) =>
      addDraftProvision(countryId, provision, 'bill', bill.id)
    );
    setDraftLabel(bill.title);
  };

  const isDirty = (reform: Reform) =>
    editedLabel !== (reform.label ?? '') ||
    reform.parameters.some((p) => editedValues[p.name] !== p.values[0]?.value);

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
    return (
      <WorkspaceLayout>
        <Stack style={{ gap: spacing.lg }}>
          {backLink}
          <Stack style={{ gap: spacing.xs }}>
            <Eyebrow>
              {selectedBill.jurisdiction} · {selectedBill.status}
            </Eyebrow>
            <Title order={1} style={{ margin: 0 }}>
              {selectedBill.title}
            </Title>
          </Stack>
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
          {selectedBill.keyFindings && selectedBill.keyFindings.length > 0 && (
            <Stack style={{ gap: spacing.xs }}>
              {selectedBill.keyFindings.map((finding) => (
                <Text
                  key={finding}
                  style={{ fontSize: typography.fontSize.sm, color: colors.text.primary }}
                >
                  · {finding}
                </Text>
              ))}
            </Stack>
          )}
          {provisions.length > 0 ? (
            <ProvisionList provisions={provisions} />
          ) : (
            <Text style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
              Parameter mapping for this bill hasn't been published yet — report and draft actions
              unlock when it lands.
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
                  runReport.run(
                    selectedBill.title,
                    `${selectedBill.jurisdiction} · ${selectedBill.status}`,
                    provisions
                  )
                }
                disabled={runReport.isRunning || provisions.length === 0}
              >
                <IconChartBar size={16} />
                {runReport.isRunning ? 'Starting report…' : 'Run impact report'}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => openBillAsDraft(selectedBill)}
              disabled={provisions.length === 0}
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

  // ---- Detail: one of your reforms ----
  if (selectedReform) {
    return (
      <WorkspaceLayout>
        <Stack style={{ gap: spacing.lg }}>
          {backLink}
          <Stack style={{ gap: spacing.xs }}>
            <Eyebrow>{SOURCE_LABELS[selectedReform.provenance.source]}</Eyebrow>
            <input
              value={editedLabel}
              onChange={(event) => setEditedLabel(event.target.value)}
              placeholder="Name this reform"
              aria-label="Reform name"
              style={{
                padding: `${spacing.sm} ${spacing.md}`,
                border: `1px solid ${colors.border.light}`,
                borderRadius: 8,
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.medium,
                fontFamily: typography.fontFamily.primary,
                maxWidth: 480,
              }}
            />
          </Stack>
          <Stack style={{ gap: spacing.md }}>
            {selectedReform.parameters.map((parameter) => {
              const baseline = getCurrentValue(parameters?.[parameter.name]?.values);
              const unit = parameters?.[parameter.name]?.unit ?? null;
              return (
                <Stack
                  key={parameter.name}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}
                >
                  <Text
                    title={resolveBreadcrumb(parameter.name)}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      fontSize: typography.fontSize.sm,
                      color: colors.text.primary,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {formatCompactBreadcrumb(resolveBreadcrumb(parameter.name))}
                  </Text>
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
                      setEditedValues((current) => ({ ...current, [parameter.name]: next }))
                    }
                    ariaLabel={`New value for ${parameter.name}`}
                  />
                </Stack>
              );
            })}
          </Stack>
          {saveMutation.isError && (
            <Text style={{ fontSize: typography.fontSize.sm, color: colors.error }}>
              Could not save the changes. Try again.
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
            <Button
              onClick={() =>
                runReport.run(
                  selectedReform.label || 'Untitled reform',
                  SOURCE_LABELS[selectedReform.provenance.source],
                  reformProvisions(selectedReform)
                )
              }
              disabled={runReport.isRunning}
            >
              <IconChartBar size={16} />
              {runReport.isRunning ? 'Starting report…' : 'View full impact report'}
            </Button>
            <Button
              variant="outline"
              disabled={!isDirty(selectedReform) || saveMutation.isPending}
              onClick={() => saveMutation.mutate(selectedReform)}
            >
              <IconDeviceFloppy size={16} />
              Save changes
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                loadReformIntoDraft(selectedReform, (path) => ({
                  breadcrumb: resolveBreadcrumb(path),
                  unit: parameters?.[path]?.unit ?? null,
                  baselineValue: getCurrentValue(parameters?.[path]?.values),
                }));
                nav.push(`/${countryId}/build`);
              }}
            >
              <IconSearch size={16} />
              Add parameters in Build
            </Button>
            <Button
              variant="outline"
              disabled={duplicateMutation.isPending}
              onClick={() => duplicateMutation.mutate(selectedReform)}
            >
              <IconCopy size={16} />
              Duplicate
            </Button>
            <Button
              variant="outline"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(selectedReform.id!)}
            >
              <IconTrash size={16} />
              Delete
            </Button>
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

  // ---- The browsing surface ----
  return (
    <WorkspaceLayout wide>
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

        <Stack style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
          {(
            [
              { id: 'bills', label: 'In Congress' },
              { id: 'yours', label: 'Yours' },
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
                style={{
                  border: 'none',
                  background: 'none',
                  padding: `0 0 ${spacing.xs}`,
                  cursor: 'pointer',
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
          <div style={{ flex: 1 }} />
          {tab === 'bills' && places.length > 1 && (
            <select
              value={placeFilter}
              onChange={(event) => setPlaceFilter(event.target.value)}
              aria-label="Filter by state"
              style={{
                padding: `${spacing.xs} ${spacing.sm}`,
                border: `1px solid ${colors.border.light}`,
                borderRadius: 8,
                fontSize: typography.fontSize.sm,
                fontFamily: typography.fontFamily.primary,
                background: colors.background.primary,
                color: colors.text.primary,
              }}
            >
              <option value="all">United States</option>
              {places.map((place) => (
                <option key={place} value={place}>
                  {place}
                </option>
              ))}
            </select>
          )}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.xs,
              padding: `${spacing.xs} ${spacing.md}`,
              border: `1px solid ${colors.border.light}`,
              borderRadius: 8,
              background: colors.background.primary,
              width: 220,
            }}
          >
            <IconSearch size={14} color={colors.text.secondary} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search"
              aria-label="Search reforms"
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
        </Stack>

        {tab === 'yours' && isPending && <Spinner />}
        {tab === 'yours' && isError && (
          <Text style={{ color: colors.error, fontSize: typography.fontSize.sm }}>
            Could not load your reforms. Try reloading the page.
          </Text>
        )}

        {tab === 'bills' && visibleBills.length === 0 && (
          <Text style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
            No bills match — adjust the search or place filter.
          </Text>
        )}
        {tab === 'yours' && !isPending && visibleReforms.length === 0 && (
          <Stack
            style={{
              padding: spacing['2xl'],
              border: `1px dashed ${colors.border.light}`,
              borderRadius: 12,
              alignItems: 'center',
              gap: spacing.sm,
            }}
          >
            <IconScale size={22} color={colors.text.secondary} />
            <Text style={{ color: colors.text.secondary, fontSize: typography.fontSize.sm }}>
              No saved reforms yet — build one, or ask a policy question.
            </Text>
          </Stack>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: spacing.md,
          }}
        >
          {tab === 'bills' &&
            visibleBills.map((bill) => (
              <Card
                key={bill.id}
                eyebrow={bill.jurisdiction}
                title={bill.title}
                body={bill.summary}
                linkUrl={bill.legiscanUrl}
                stats={billStats(bill)}
                onClick={() => setSelectedId(bill.id)}
              />
            ))}
          {tab === 'yours' &&
            visibleReforms.map((reform) => (
              <Card
                key={reform.id}
                eyebrow={`${reform.parameters.length} provision${reform.parameters.length === 1 ? '' : 's'}`}
                title={reform.label || 'Untitled reform'}
                body={SOURCE_LABELS[reform.provenance.source]}
                onClick={() => openReform(reform)}
              />
            ))}
        </div>

        {tab === 'bills' && !isLive && (
          <Text style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
            Showing illustrative samples — the live tracker feed connects via environment
            configuration.
          </Text>
        )}
      </Stack>
    </WorkspaceLayout>
  );
}
