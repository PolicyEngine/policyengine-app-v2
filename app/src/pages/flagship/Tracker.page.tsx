import { useMemo, useState } from 'react';
import {
  IconChevronDown,
  IconChevronRight,
  IconExternalLink,
  IconFlask,
  IconPencil,
  IconSearch,
} from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import WorkspaceLayout from '@/components/flagship/WorkspaceLayout';
import { Button, Stack, Text, Title } from '@/components/ui';
import { WEBSITE_URL } from '@/constants';
import { SAMPLE_BILLS, SampleBill } from '@/data/flagship/sampleBills';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { addDraftProvision, clearDraftReform, setDraftLabel } from '@/libs/draftReform';
import { RootState } from '@/store';
import {
  formatCompactBreadcrumb,
  formatLabelParts,
  getHierarchicalLabels,
} from '@/utils/parameterLabels';
import { formatValue, getCurrentValue } from '@/utils/parameterValues';

const STATUS_COLORS: Record<string, { color: string; background: string }> = {
  Enacted: { color: colors.primary[700], background: colors.primary[50] },
  'Passed chamber': { color: '#1E6B8A', background: '#E8F4FA' },
  'In committee': { color: '#8A6D1E', background: '#FBF3DC' },
  Introduced: { color: colors.gray[700], background: colors.gray[50] },
};

/**
 * Tracker — the legislative feed of the flagship shell.
 *
 * Dense, scannable rows built for a real feed of dozens of bills:
 * search + status/jurisdiction filters up top, one compact row per
 * bill, details and actions expand in place. Sample bills (clearly
 * labeled) stand in until the tracker API is exposed.
 */
export default function TrackerPage() {
  const countryId = useCurrentCountry();
  const parameters = useSelector((state: RootState) => state.metadata.parameters);

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [jurisdictionFilter, setJurisdictionFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const bills = useMemo(
    () => SAMPLE_BILLS.filter((bill) => bill.countryId === countryId),
    [countryId]
  );
  const jurisdictions = useMemo(
    () => [...new Set(bills.map((bill) => bill.jurisdiction))].sort(),
    [bills]
  );
  const statuses = useMemo(() => [...new Set(bills.map((bill) => bill.status))], [bills]);

  const visibleBills = useMemo(() => {
    const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return bills.filter((bill) => {
      const haystack = `${bill.title} ${bill.jurisdiction} ${bill.summary}`.toLowerCase();
      return (
        (statusFilter === 'all' || bill.status === statusFilter) &&
        (jurisdictionFilter === 'all' || bill.jurisdiction === jurisdictionFilter) &&
        tokens.every((token) => haystack.includes(token))
      );
    });
  }, [bills, query, statusFilter, jurisdictionFilter]);

  const resolveBreadcrumb = (path: string, fallback: string) =>
    parameters?.[path] ? formatLabelParts(getHierarchicalLabels(path, parameters)) : fallback;

  const openAsDraft = (bill: SampleBill) => {
    clearDraftReform();
    bill.provisions.forEach((provision) => {
      const metadata = parameters?.[provision.path];
      addDraftProvision(
        countryId,
        {
          path: provision.path,
          breadcrumb: resolveBreadcrumb(provision.path, provision.fallbackBreadcrumb),
          unit: metadata?.unit ?? null,
          baselineValue: getCurrentValue(metadata?.values),
          value: provision.proposedValue,
        },
        'bill',
        bill.id
      );
    });
    setDraftLabel(bill.title);
  };

  const selectStyle: React.CSSProperties = {
    padding: `${spacing.xs} ${spacing.sm}`,
    border: `1px solid ${colors.border.light}`,
    borderRadius: 6,
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.primary,
    background: colors.background.primary,
    color: colors.text.primary,
  };

  return (
    <WorkspaceLayout>
      <Stack style={{ gap: spacing.lg }}>
        <Stack style={{ gap: spacing.xs }}>
          <Title order={1}>Legislative tracker</Title>
          <Text style={{ color: colors.text.secondary, fontSize: typography.fontSize.sm }}>
            Real bills, scored with the PolicyEngine model. Open any bill as an editable reform.
          </Text>
        </Stack>

        <Stack
          style={{
            flexDirection: 'row',
            gap: spacing.sm,
            padding: `${spacing.sm} ${spacing.md}`,
            background: colors.gray[50],
            borderRadius: 8,
            alignItems: 'center',
          }}
        >
          <IconFlask size={14} color={colors.text.secondary} style={{ flexShrink: 0 }} />
          <Text style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
            Sample preview — illustrative bills until the tracker API connects.
          </Text>
          <div style={{ flex: 1 }} />
          <a
            href={`${WEBSITE_URL}/${countryId}/bill-tracker`}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: typography.fontSize.xs,
              color: colors.primary[700],
              fontFamily: typography.fontFamily.primary,
              whiteSpace: 'nowrap',
            }}
          >
            Full tracker
            <IconExternalLink size={12} />
          </a>
        </Stack>

        <Stack
          style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center', flexWrap: 'wrap' }}
        >
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
              placeholder="Search bills"
              aria-label="Search bills"
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
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Status filter"
            style={selectStyle}
          >
            <option value="all">All statuses</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <select
            value={jurisdictionFilter}
            onChange={(event) => setJurisdictionFilter(event.target.value)}
            aria-label="Jurisdiction filter"
            style={selectStyle}
          >
            <option value="all">All jurisdictions</option>
            {jurisdictions.map((jurisdiction) => (
              <option key={jurisdiction} value={jurisdiction}>
                {jurisdiction}
              </option>
            ))}
          </select>
          <Text style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
            {visibleBills.length} of {bills.length} bills
          </Text>
        </Stack>

        <div
          style={{
            border: `1px solid ${colors.border.light}`,
            borderRadius: 12,
            background: colors.background.primary,
            overflow: 'hidden',
          }}
        >
          {visibleBills.length === 0 && (
            <Text
              style={{
                padding: spacing.xl,
                fontSize: typography.fontSize.sm,
                color: colors.text.secondary,
                textAlign: 'center',
              }}
            >
              No bills match — clear the search or filters.
            </Text>
          )}
          {visibleBills.map((bill, i) => {
            const isExpanded = expandedId === bill.id;
            const statusStyle = STATUS_COLORS[bill.status] ?? STATUS_COLORS.Introduced;
            const ChevronIcon = isExpanded ? IconChevronDown : IconChevronRight;
            return (
              <div
                key={bill.id}
                style={{ borderTop: i === 0 ? 'none' : `1px solid ${colors.border.light}` }}
              >
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : bill.id)}
                  aria-expanded={isExpanded}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing.md,
                    width: '100%',
                    padding: `${spacing.sm} ${spacing.lg}`,
                    border: 'none',
                    background: isExpanded ? colors.gray[50] : 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: typography.fontFamily.primary,
                  }}
                >
                  <ChevronIcon size={14} color={colors.text.secondary} style={{ flexShrink: 0 }} />
                  <span
                    style={{
                      fontSize: typography.fontSize.xs,
                      color: colors.text.secondary,
                      width: 110,
                      flexShrink: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {bill.jurisdiction}
                  </span>
                  <span
                    style={{
                      flex: 1,
                      fontSize: typography.fontSize.sm,
                      fontWeight: typography.fontWeight.medium,
                      color: colors.text.primary,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {bill.title}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      padding: '2px 8px',
                      borderRadius: 999,
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      ...statusStyle,
                    }}
                  >
                    {bill.status}
                  </span>
                </button>

                {isExpanded && (
                  <Stack style={{ gap: spacing.md, padding: `0 ${spacing.lg} ${spacing.lg} 40px` }}>
                    <Text
                      style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}
                    >
                      {bill.summary}
                    </Text>
                    <div
                      style={{
                        background: colors.gray[50],
                        borderRadius: 8,
                        padding: `${spacing.xs} 0`,
                      }}
                    >
                      {bill.provisions.map((provision) => {
                        const metadata = parameters?.[provision.path];
                        const baseline = getCurrentValue(metadata?.values);
                        const unit = metadata?.unit ?? null;
                        const fullBreadcrumb = resolveBreadcrumb(
                          provision.path,
                          provision.fallbackBreadcrumb
                        );
                        return (
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
                              title={fullBreadcrumb}
                              style={{
                                fontSize: typography.fontSize.sm,
                                color: colors.text.primary,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {formatCompactBreadcrumb(fullBreadcrumb)}
                            </Text>
                            <Text
                              style={{
                                fontSize: typography.fontSize.sm,
                                whiteSpace: 'nowrap',
                                flexShrink: 0,
                                color: colors.text.secondary,
                              }}
                            >
                              {formatValue(baseline, unit)} →{' '}
                              <span
                                style={{
                                  color: colors.primary[700],
                                  fontWeight: typography.fontWeight.semibold,
                                }}
                              >
                                {formatValue(provision.proposedValue, unit)}
                              </span>
                            </Text>
                          </div>
                        );
                      })}
                    </div>
                    <div>
                      <Button size="sm" onClick={() => openAsDraft(bill)}>
                        <IconPencil size={14} />
                        Open as draft reform
                      </Button>
                    </div>
                  </Stack>
                )}
              </div>
            );
          })}
        </div>
      </Stack>
    </WorkspaceLayout>
  );
}
