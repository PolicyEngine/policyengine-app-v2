import { IconCalendar, IconExternalLink, IconUser } from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import type { TrackedBill } from '@/api/billFeed';
import { useCalibrationMatches } from '@/components/flagship/CalibrationMatches';
import ReportView from '@/components/flagship/report/ReportView';
import {
  BillValidationSection,
  useModelTrackRecord,
  ValidationChip,
} from '@/components/flagship/ValidationPanel';
import { Button, Spinner, Stack, Text } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import { useBillEconomy, type BillEconomy } from '@/hooks/useBillEconomy';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useTrackedBills } from '@/hooks/useTrackedBills';
import { isAlreadyCurrentLaw, storedBillMetrics } from '@/libs/flagship/billMetrics';
import { RootState } from '@/store';
import { formatLabelParts, getHierarchicalLabels } from '@/utils/parameterLabels';
import { getCurrentValue } from '@/utils/parameterValues';

interface BillReportPageProps {
  /** Passed by the Next.js route bridge; react-router falls back to params. */
  billId?: string;
}

function formatDate(iso: string): string {
  const date = new Date(`${iso.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? iso
    : date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function Caption({ children }: { children: React.ReactNode }) {
  return (
    <Text style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
      {children}
    </Text>
  );
}

/** The bill's summary, sponsor, analysis date, bill text, and validation verdict. */
function BillOverviewLead({ bill }: { bill: TrackedBill }) {
  const billTextUrl = bill.sourceUrl ?? bill.legiscanUrl;
  return (
    <Stack style={{ gap: spacing.sm }}>
      {bill.validation && <ValidationChip validation={bill.validation} />}
      {bill.summary && (
        <Text
          style={{
            fontSize: typography.fontSize.base,
            color: colors.text.secondary,
            lineHeight: 1.6,
          }}
        >
          {bill.summary}
        </Text>
      )}
      {(bill.author || bill.date || billTextUrl) && (
        <Stack
          style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' }}
        >
          {bill.author && (
            <Stack style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
              <IconUser size={13} color={colors.text.secondary} />
              <Caption>Sponsored by {bill.author}</Caption>
            </Stack>
          )}
          {bill.date && (
            <Stack style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
              <IconCalendar size={13} color={colors.text.secondary} />
              <Caption>Analyzed {formatDate(bill.date)}</Caption>
            </Stack>
          )}
          {billTextUrl && (
            <a
              href={billTextUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                color: colors.text.secondary,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 2,
                fontSize: typography.fontSize.xs,
                fontFamily: typography.fontFamily.primary,
              }}
            >
              Bill text
              <IconExternalLink size={11} />
            </a>
          )}
        </Stack>
      )}
    </Stack>
  );
}

/** Where the full run stands, for sections that need its results. */
function FullResultsStatus({
  economy,
  alreadyCurrentLaw,
}: {
  economy: BillEconomy;
  alreadyCurrentLaw: boolean;
}) {
  if (alreadyCurrentLaw) {
    return (
      <Stack
        style={{
          gap: spacing.sm,
          padding: spacing.lg,
          border: `1px dashed ${colors.border.light}`,
          borderRadius: 12,
        }}
      >
        <Text style={{ fontSize: typography.fontSize.sm, color: colors.text.primary }}>
          This bill is already current law.
        </Text>
        <Caption>
          Scored against current law it changes nothing, so there are no full results to show. The
          overview shows the legislative tracker&apos;s estimate against the law before the bill.
        </Caption>
      </Stack>
    );
  }
  if (economy.status === 'error') {
    return (
      <Stack
        style={{
          gap: spacing.sm,
          padding: spacing.lg,
          border: `1px dashed ${colors.border.light}`,
          borderRadius: 12,
          alignItems: 'flex-start',
        }}
      >
        <Text style={{ fontSize: typography.fontSize.sm, color: colors.text.primary }}>
          The full results could not be calculated.
        </Text>
        {economy.message && <Caption>{economy.message}</Caption>}
        <Button size="sm" variant="outline" onClick={economy.retry}>
          Try again
        </Button>
      </Stack>
    );
  }
  return (
    <Stack
      role="status"
      aria-live="polite"
      style={{
        gap: spacing.sm,
        padding: spacing.lg,
        border: `1px dashed ${colors.border.light}`,
        borderRadius: 12,
        alignItems: 'center',
      }}
    >
      <Spinner size="sm" />
      <Text style={{ fontSize: typography.fontSize.sm, color: colors.text.primary }}>
        Calculating the full results…
      </Text>
      <Caption>
        {economy.message ? `${economy.message}. ` : ''}A bill&apos;s first full run can take several
        minutes; later visits load from the cache.
      </Caption>
    </Stack>
  );
}

/**
 * A tracked bill as a flagship report: the same layout as a saved report,
 * opening on the tracker's stored headline numbers while the full
 * society-wide results calculate, then filling in every section.
 */
export default function BillReportPage({ billId: propId }: BillReportPageProps) {
  const params = useParams<{ billId: string }>();
  const billId = propId ?? params.billId ?? '';
  const countryId = useCurrentCountry();
  const parameters = useSelector((state: RootState) => state.metadata.parameters);
  const metadataLoaded = useSelector((state: RootState) => state.metadata.version !== null);
  const { bills, isLoading } = useTrackedBills(countryId);

  const bill: TrackedBill | undefined = bills.find((candidate) => candidate.id === billId);

  const provisions = (bill?.provisions ?? []).map((provision) => {
    const metadata = parameters?.[provision.path];
    return {
      path: provision.path,
      breadcrumb: metadata
        ? formatLabelParts(getHierarchicalLabels(provision.path, parameters))
        : (provision.fallbackBreadcrumb ?? provision.path),
      unit: metadata?.unit ?? null,
      baselineValue: getCurrentValue(metadata?.values),
      value: provision.value,
    };
  });

  // An enacted bill already matches current law, so a run against current
  // law would score it as no change; keep the tracker's prior-law estimate.
  const alreadyCurrentLaw = isAlreadyCurrentLaw(provisions);

  const billPaths = provisions.map((p) => p.path);
  const trackRecord = useModelTrackRecord(billPaths);
  // Wait for metadata so an enacted bill is recognized before any run starts.
  const economy = useBillEconomy(bill, { enabled: metadataLoaded && !alreadyCurrentLaw });
  // A state bill's data check is against that state's calibration targets.
  const calibration = useCalibrationMatches(
    billPaths,
    bill?.state ? `state/${bill.state.toLowerCase()}` : undefined
  );

  if (!bill) {
    return (
      <Stack style={{ maxWidth: 760, margin: '0 auto', gap: spacing.lg }}>
        <Text style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
          {isLoading ? 'Loading the analysis…' : 'This bill is not in the current feed.'}
        </Text>
      </Stack>
    );
  }

  const provenance = bill.provenance;
  const provenanceNote =
    provenance &&
    [
      provenance.modelVersion && `policyengine-us ${provenance.modelVersion}`,
      provenance.dataset &&
        `${provenance.dataset}${provenance.datasetVersion ? ` ${provenance.datasetVersion}` : ''}`,
      provenance.computedAt && `computed ${formatDate(provenance.computedAt)}`,
    ]
      .filter(Boolean)
      .join(' · ');

  return (
    <ReportView
      title={bill.title}
      sourceNote={`${bill.jurisdiction} · ${bill.status}`}
      provisions={provisions}
      year={economy.year}
      region={economy.region}
      reformPolicyId={economy.reformPolicyId}
      baselinePolicyId={economy.baselinePolicyId}
      output={alreadyCurrentLaw ? null : economy.output}
      storedMetrics={storedBillMetrics(bill, countryId)}
      storedMetricsNote={
        alreadyCurrentLaw
          ? 'Estimates from the legislative tracker, against the law before this bill'
          : economy.status === 'error'
            ? 'Stored estimates from the legislative tracker · full results unavailable'
            : 'Stored estimates from the legislative tracker · full results calculating'
      }
      pending={<FullResultsStatus economy={economy} alreadyCurrentLaw={alreadyCurrentLaw} />}
      overviewLead={<BillOverviewLead bill={bill} />}
      calibration={calibration}
      trackRecord={trackRecord}
      validationLead={
        (bill.validation || provenanceNote) && (
          <Stack style={{ gap: spacing.sm }}>
            {bill.validation && (
              <BillValidationSection billId={bill.id} validation={bill.validation} />
            )}
            {provenanceNote && <Caption>Tracker estimate: {provenanceNote}</Caption>}
          </Stack>
        )
      }
    />
  );
}
