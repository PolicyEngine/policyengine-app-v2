import { IconExternalLink, IconFlask, IconGavel, IconPencil } from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import ReformPreviewCard from '@/components/flagship/ReformPreviewCard';
import { Button, Stack, Text, Title } from '@/components/ui';
import { WEBSITE_URL } from '@/constants';
import { SAMPLE_BILLS, SampleBill } from '@/data/flagship/sampleBills';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import {
  addDraftProvision,
  clearDraftReform,
  setDraftLabel,
  useDraftReform,
} from '@/libs/draftReform';
import { RootState } from '@/store';
import { formatLabelParts, getHierarchicalLabels } from '@/utils/parameterLabels';
import { formatValue, getCurrentValue } from '@/utils/parameterValues';

/**
 * Tracker — the legislative feed of the flagship shell.
 *
 * Currently renders sample bills (clearly labeled) to demonstrate the
 * feed and the bill → editable reform bridge; the live feed lands when
 * the tracker exposes its API. The existing proxied tracker remains
 * linked for real data.
 */
export default function TrackerPage() {
  const countryId = useCurrentCountry();
  const draft = useDraftReform();
  const parameters = useSelector((state: RootState) => state.metadata.parameters);

  const bills = SAMPLE_BILLS.filter((bill) => bill.countryId === countryId);

  const openAsDraft = (bill: SampleBill) => {
    clearDraftReform();
    bill.provisions.forEach((provision) => {
      const metadata = parameters?.[provision.path];
      const breadcrumb = metadata
        ? formatLabelParts(getHierarchicalLabels(provision.path, parameters!))
        : provision.fallbackBreadcrumb;
      addDraftProvision(
        countryId,
        {
          path: provision.path,
          breadcrumb,
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

  return (
    <Stack style={{ maxWidth: 720, margin: '0 auto', gap: spacing['2xl'] }}>
      <Stack style={{ gap: spacing.md, marginTop: spacing['3xl'] }}>
        <Title order={1}>Legislative tracker</Title>
        <Text style={{ color: colors.text.secondary }}>
          Real bills, scored with the PolicyEngine model. Open any bill as an editable reform to
          explore variations.
        </Text>
      </Stack>

      <Stack
        style={{
          flexDirection: 'row',
          gap: spacing.md,
          padding: spacing.md,
          background: colors.warning ? `${colors.warning}22` : colors.gray[50],
          borderRadius: 8,
          alignItems: 'flex-start',
        }}
      >
        <IconFlask size={16} color={colors.text.secondary} style={{ flexShrink: 0 }} />
        <Text style={{ fontSize: typography.fontSize.xs, color: colors.text.primary }}>
          Sample preview — these bills are illustrative. The live feed connects when the tracker API
          is available; the full tracker below has real data today.
        </Text>
      </Stack>

      {bills.length === 0 && (
        <Text style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
          No sample bills for this country yet — open the full tracker below.
        </Text>
      )}

      {bills.map((bill) => (
        <Stack
          key={bill.id}
          style={{
            gap: spacing.sm,
            padding: spacing.lg,
            border: `1px solid ${colors.border.light}`,
            borderRadius: 12,
            background: colors.background.primary,
          }}
        >
          <Stack style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md }}>
            <Text
              style={{
                fontSize: typography.fontSize.xs,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: colors.text.secondary,
                fontWeight: typography.fontWeight.semibold,
              }}
            >
              {bill.jurisdiction}
            </Text>
            <Text
              style={{
                fontSize: typography.fontSize.xs,
                color: colors.primary[700],
                background: colors.primary[50],
                padding: `2px ${spacing.sm}`,
                borderRadius: 999,
                whiteSpace: 'nowrap',
              }}
            >
              {bill.status}
            </Text>
          </Stack>
          <Text style={{ fontWeight: typography.fontWeight.semibold, color: colors.text.primary }}>
            {bill.title}
          </Text>
          <Text style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
            {bill.summary}
          </Text>
          {bill.provisions.map((provision) => {
            const metadata = parameters?.[provision.path];
            const baseline = getCurrentValue(metadata?.values);
            return (
              <Text
                key={provision.path}
                style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}
              >
                {metadata
                  ? formatLabelParts(getHierarchicalLabels(provision.path, parameters!))
                  : provision.fallbackBreadcrumb}
                : {formatValue(baseline, metadata?.unit ?? null)} →{' '}
                {formatValue(provision.proposedValue, metadata?.unit ?? null)}
              </Text>
            );
          })}
          <Stack style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs }}>
            <Button size="sm" onClick={() => openAsDraft(bill)}>
              <IconPencil size={14} />
              Open as draft reform
            </Button>
          </Stack>
        </Stack>
      ))}

      {draft && draft.countryId === countryId && draft.provisions.length > 0 && (
        <ReformPreviewCard draft={draft} />
      )}

      <Stack
        style={{
          gap: spacing.lg,
          padding: spacing['2xl'],
          border: `1px solid ${colors.border.light}`,
          borderRadius: 12,
          background: colors.background.primary,
          alignItems: 'flex-start',
        }}
      >
        <IconGavel size={28} color={colors.primary[600]} />
        <Text style={{ fontSize: typography.fontSize.sm, color: colors.text.primary }}>
          The full tracker has live state legislation with PolicyEngine cost and distributional
          estimates.
        </Text>
        <Button variant="outline" asChild>
          <a href={`${WEBSITE_URL}/${countryId}/bill-tracker`} target="_blank" rel="noreferrer">
            Open the bill tracker
            <IconExternalLink size={16} />
          </a>
        </Button>
      </Stack>
    </Stack>
  );
}
