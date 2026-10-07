import { IconCalendar, IconExternalLink, IconUser } from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { billRunYear, type TrackedBill } from '@/api/billFeed';
import { useCalibrationMatches } from '@/components/flagship/CalibrationMatches';
import ReportView from '@/components/flagship/report/ReportView';
import StoredImpactCharts from '@/components/flagship/report/StoredImpactCharts';
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
import { storedBillMetrics } from '@/libs/flagship/billMetrics';
import { billAlreadyCurrentLaw, billReportProvisions } from '@/libs/flagship/billProvisions';
import { RootState } from '@/store';

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

/** Why a bill has, or does not yet have, full results. */
type RunState = 'already-law' | 'no-provisions' | 'no-metadata' | BillEconomy['status'];

const UNAVAILABLE_COPY: Partial<Record<RunState, { title: string; detail: string }>> = {
  'already-law': {
    title: 'This bill is already current law.',
    detail:
      "Scored against current law it changes nothing, so there are no full results to show. The estimates here are the legislative tracker's, against the law before the bill.",
  },
  'no-provisions': {
    title: 'The full results cannot be calculated.',
    detail: 'None of this bill’s provisions are mapped to model parameters yet.',
  },
  'no-metadata': {
    title: 'The full results cannot be calculated.',
    detail: 'The model’s parameters could not be loaded. Reload the page to try again.',
  },
};

const STATUS_BOX = {
  gap: spacing.sm,
  padding: spacing.lg,
  border: `1px dashed ${colors.border.light}`,
  borderRadius: 12,
} as const;

/** Where the full run stands, for sections that need its results. */
function FullResultsStatus({ runState, economy }: { runState: RunState; economy: BillEconomy }) {
  const unavailable = UNAVAILABLE_COPY[runState];
  if (unavailable) {
    return (
      <Stack style={STATUS_BOX}>
        <Text style={{ fontSize: typography.fontSize.sm, color: colors.text.primary }}>
          {unavailable.title}
        </Text>
        <Caption>{unavailable.detail}</Caption>
      </Stack>
    );
  }
  if (runState === 'error') {
    return (
      <Stack style={{ ...STATUS_BOX, alignItems: 'flex-start' }}>
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
  // Strategy messages end in an ellipsis; the caption adds its own stop.
  const progress = economy.message?.replace(/[.…]+$/, '');
  return (
    <Stack role="status" aria-live="polite" style={{ ...STATUS_BOX, alignItems: 'center' }}>
      <Spinner size="sm" />
      <Text style={{ fontSize: typography.fontSize.sm, color: colors.text.primary }}>
        Calculating the full results…
      </Text>
      <Caption>
        {progress ? `${progress}. ` : ''}A bill&apos;s first full run can take several minutes;
        later visits load from the cache.
      </Caption>
    </Stack>
  );
}

const STORED_NOTE: Partial<Record<RunState, string>> = {
  'already-law': 'Estimates from the legislative tracker, against the law before this bill',
  'no-provisions': 'Stored estimates from the legislative tracker · full results unavailable',
  'no-metadata': 'Stored estimates from the legislative tracker · full results unavailable',
  error: 'Stored estimates from the legislative tracker · full results unavailable',
  pending: 'Stored estimates from the legislative tracker · full results calculating',
};

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
  const metadataError = useSelector((state: RootState) => state.metadata.error);
  const { bills, isLoading } = useTrackedBills(countryId);

  const bill: TrackedBill | undefined = bills.find((candidate) => candidate.id === billId);

  // A bill from a later year runs, and reads against the law, in its first year.
  const runYear = billRunYear(bill?.provisions ?? []);

  // An enacted bill already matches current law, so a run against current
  // law would score it as no change; keep the tracker's prior-law estimate,
  // and read its changes against the law the tracker compared it with.
  const alreadyCurrentLaw = billAlreadyCurrentLaw(bill?.provisions ?? [], parameters, runYear);
  const provisions = billReportProvisions(bill?.provisions ?? [], parameters, runYear, {
    priorLaw: alreadyCurrentLaw,
  });

  const billPaths = provisions.map((p) => p.path);
  const trackRecord = useModelTrackRecord(billPaths);
  // Wait for metadata so an enacted bill is recognized before any run starts.
  const economy = useBillEconomy(bill, { enabled: metadataLoaded && !alreadyCurrentLaw });
  const runState: RunState = alreadyCurrentLaw
    ? 'already-law'
    : provisions.length === 0
      ? 'no-provisions'
      : metadataError && !metadataLoaded
        ? 'no-metadata'
        : economy.status;
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
      // The title says which bill; no place-and-status line under it.
      sourceNote=""
      provisions={provisions}
      // The changes as scored: once a bill is law, today's values include it.
      changes={bill.changes}
      priorLawBaseline={alreadyCurrentLaw}
      year={economy.year}
      region={economy.region}
      reformPolicyId={economy.reformPolicyId}
      baselinePolicyId={economy.baselinePolicyId}
      output={runState === 'complete' ? economy.output : null}
      storedMetrics={storedBillMetrics(bill, countryId)}
      storedMetricsNote={STORED_NOTE[runState]}
      pending={<FullResultsStatus runState={runState} economy={economy} />}
      economyPending={
        <Stack style={{ gap: spacing.lg }}>
          <FullResultsStatus runState={runState} economy={economy} />
          <StoredImpactCharts impact={bill.impactData} />
        </Stack>
      }
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
