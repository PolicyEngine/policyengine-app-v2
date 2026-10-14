import { useState } from 'react';
import { IconCalendar, IconExternalLink } from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { billRunYear, type TrackedBill } from '@/api/billFeed';
import BillTrackerLink from '@/components/flagship/BillTrackerLink';
import { useCalibrationMatches } from '@/components/flagship/CalibrationMatches';
import BillReportStatus from '@/components/flagship/report/BillReportStatus';
import DistrictImpactCard, {
  type CongressionalMode,
} from '@/components/flagship/report/DistrictImpactCard';
import ReportView from '@/components/flagship/report/ReportView';
import RunProgress from '@/components/flagship/report/RunProgress';
import StoredImpactCharts from '@/components/flagship/report/StoredImpactCharts';
import { ErrorState } from '@/components/flagship/states';
import { BillExternalEstimates, useModelTrackRecord } from '@/components/flagship/ValidationPanel';
import { Button, Stack, Text } from '@/components/ui';
import { getDurationForCountry } from '@/constants/calculationDurations';
import { CongressionalDistrictDataProvider } from '@/contexts/CongressionalDistrictDataContext';
import { colors, spacing, typography } from '@/designTokens';
import { useBillEconomy, type BillEconomy } from '@/hooks/useBillEconomy';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useFlagshipMetadataStatus } from '@/hooks/useFlagshipMetadataStatus';
import { useStoredBillDistricts } from '@/hooks/useStoredBillDistricts';
import { useTrackedBills } from '@/hooks/useTrackedBills';
import { storedBillMetrics } from '@/libs/flagship/billMetrics';
import { billAlreadyCurrentLaw, billReportProvisions } from '@/libs/flagship/billProvisions';
import { findTrackedBill, trackerUrlForBillId } from '@/libs/flagship/billTracker';
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

/**
 * The bill's summary, analysis date, bill text, and tracker page. Its
 * validation verdict lives in Validation.
 */
function BillOverviewLead({ bill }: { bill: TrackedBill }) {
  const billTextUrl = bill.sourceUrl ?? bill.legiscanUrl;
  return (
    <Stack style={{ gap: spacing.sm }}>
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
      {(bill.date || billTextUrl || bill.trackerUrl) && (
        <Stack
          style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' }}
        >
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
          {bill.trackerUrl && <BillTrackerLink href={bill.trackerUrl} />}
        </Stack>
      )}
    </Stack>
  );
}

/** Why a bill has, or does not yet have, full results. */
type RunState =
  | 'already-law'
  | 'no-provisions'
  | 'no-metadata'
  | 'not-started'
  | BillEconomy['status'];

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
};

/** The tracker stores no relative income change by district, so that view is left out. */
const STORED_DISTRICT_MODES: CongressionalMode[] = ['absolute', 'winner-pct', 'loser-pct'];

const STATUS_BOX = {
  gap: spacing.sm,
  padding: spacing.lg,
  border: `1px dashed ${colors.border.light}`,
  borderRadius: 12,
} as const;

/** Where the full run stands, for sections that need its results. */
function FullResultsStatus({
  runState,
  economy,
  onStart,
}: {
  runState: RunState;
  economy: BillEconomy;
  onStart: () => void;
}) {
  const countryId = useCurrentCountry();
  const metadata = useFlagshipMetadataStatus();
  if (runState === 'no-metadata') {
    return (
      <Stack style={STATUS_BOX}>
        <ErrorState compact title="Could not load the parameters" onRetry={metadata.retry} />
      </Stack>
    );
  }
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
  if (runState === 'not-started') {
    return (
      <Stack style={{ ...STATUS_BOX, alignItems: 'flex-start' }}>
        <Text style={{ fontSize: typography.fontSize.sm, color: colors.text.primary }}>
          The full results are not loaded.
        </Text>
        {/* Whether they exist is unknown until asked: another reader may have run the bill. */}
        <Caption>
          This page shows the legislative tracker&apos;s stored estimates. The full results score
          the bill with today&apos;s model. If no one has run this bill yet, that takes several
          minutes.
        </Caption>
        <Button size="sm" onClick={onStart}>
          Load full results
        </Button>
      </Stack>
    );
  }
  if (runState === 'error') {
    return (
      <Stack style={STATUS_BOX}>
        <ErrorState
          compact
          title="The full results could not be calculated"
          description={economy.message}
          onRetry={economy.retry}
        />
      </Stack>
    );
  }
  // A queue position is worth a line; the strategy's other messages say only "running".
  const queued =
    typeof economy.queuePosition === 'number' && economy.queuePosition > 0
      ? `In queue, position ${economy.queuePosition}`
      : economy.message?.startsWith('In queue')
        ? economy.message.replace(/[.…]+$/, '')
        : undefined;
  return (
    <RunProgress
      title="Calculating the full results"
      progress={economy.progress}
      detail={queued}
      expectedMs={getDurationForCountry(countryId)}
      note="Later visits load from the cache."
    />
  );
}

const STORED_NOTE: Partial<Record<RunState, string>> = {
  'already-law': 'Estimates from the legislative tracker, against the law before this bill',
  'no-provisions': 'Stored estimates from the legislative tracker · full results unavailable',
  'no-metadata': 'Stored estimates from the legislative tracker · full results unavailable',
  'not-started': 'Stored estimates from the legislative tracker',
  error: 'Stored estimates from the legislative tracker · full results unavailable',
  pending: 'Stored estimates from the legislative tracker · full results calculating',
};

/**
 * A tracked bill as a flagship report: the same layout as a saved report,
 * opening on the tracker's stored headline numbers. The full society-wide
 * results calculate only when the reader asks — opening the page, or one
 * of its tabs, starts no run — and then fill in every section.
 */
export default function BillReportPage({ billId: propId }: BillReportPageProps) {
  const params = useParams<{ billId: string }>();
  const billId = propId ?? params.billId ?? '';
  const countryId = useCurrentCountry();
  const parameters = useSelector((state: RootState) => state.metadata.parameters);
  const metadataLoaded = useSelector((state: RootState) => state.metadata.version !== null);
  const metadataError = useSelector((state: RootState) => state.metadata.error);
  const feed = useTrackedBills(countryId);
  const { bills } = feed;
  // The bill whose full run the reader started; another bill starts unrun.
  const [runRequestedFor, setRunRequestedFor] = useState<string | null>(null);
  const runRequested = runRequestedFor === billId;

  // The tracker links here by its bill id; an encoded or upper-case id finds the same bill.
  const bill: TrackedBill | undefined = findTrackedBill(bills, billId);
  const { data: storedDistricts } = useStoredBillDistricts(bill?.id);

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
  // Only a reader's request starts the run, and it waits for metadata so an
  // enacted bill is recognized before any run starts.
  const economy = useBillEconomy(bill, {
    enabled: runRequested && metadataLoaded && !alreadyCurrentLaw,
  });
  const runState: RunState = alreadyCurrentLaw
    ? 'already-law'
    : provisions.length === 0
      ? 'no-provisions'
      : metadataError && !metadataLoaded
        ? 'no-metadata'
        : !runRequested
          ? 'not-started'
          : economy.status;
  const startRun = () => setRunRequestedFor(billId);
  // A state bill's data check is against that state's calibration targets.
  const calibration = useCalibrationMatches(
    billPaths,
    bill?.state ? `state/${bill.state.toLowerCase()}` : undefined
  );

  if (!bill) {
    return (
      <BillReportStatus
        isLoading={feed.isLoading}
        isError={feed.isError}
        isConfigured={feed.isConfigured}
        onRetry={feed.retry}
        trackerUrl={billId ? trackerUrlForBillId(billId) : undefined}
      />
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
      // Until the metadata arrives, provisions have no names or units.
      provisionsLoading={!metadataLoaded && !metadataError}
      year={economy.year}
      region={economy.region}
      reformPolicyId={economy.reformPolicyId}
      baselinePolicyId={economy.baselinePolicyId}
      output={runState === 'complete' ? economy.output : null}
      storedMetrics={storedBillMetrics(bill, countryId)}
      storedMetricsNote={STORED_NOTE[runState]}
      pending={<FullResultsStatus runState={runState} economy={economy} onStart={startRun} />}
      economyPending={
        <Stack style={{ gap: spacing.lg }}>
          <FullResultsStatus runState={runState} economy={economy} onStart={startRun} />
          <StoredImpactCharts impact={bill.impactData} />
        </Stack>
      }
      districtsPending={
        <Stack style={{ gap: spacing.lg }}>
          <FullResultsStatus runState={runState} economy={economy} onStart={startRun} />
          {storedDistricts && storedDistricts.length > 0 && (
            // The tracker's districts, until the full results bring their own.
            <CongressionalDistrictDataProvider
              reformPolicyId=""
              baselinePolicyId=""
              year={economy.year}
              region={economy.region}
            >
              <DistrictImpactCard districts={storedDistricts} modes={STORED_DISTRICT_MODES} />
            </CongressionalDistrictDataProvider>
          )}
        </Stack>
      }
      overviewLead={<BillOverviewLead bill={bill} />}
      calibration={calibration}
      trackRecord={trackRecord}
      externalEstimates={
        bill.validation && <BillExternalEstimates billId={bill.id} validation={bill.validation} />
      }
      externalEstimatesNote={
        provenanceNote && <Caption>Tracker estimate: {provenanceNote}</Caption>
      }
    />
  );
}
