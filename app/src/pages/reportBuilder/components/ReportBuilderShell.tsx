/**
 * ReportBuilderShell - Reusable visual shell for the report builder
 *
 * Renders the page layout: header + TopBar (with ReportMetaPanel + actions) + SimulationCanvas.
 * Accepts all logic via props so different modes (setup, modify) can compose it.
 */
import { BackBreadcrumb } from '@/components/common/BackBreadcrumb';
import { Text } from '@/components/ui';
import { getReportPopulationError } from '@/utils/ingredientAvailability';
import { useReportSPMSelectionError } from '../hooks/useReportIngredientAvailability';
import { styles } from '../styles';
import type { ReportBuilderState, SimulationBlockProps, TopBarAction } from '../types';
import { ReportMetaPanel } from './ReportMetaPanel';
import { SimulationBlockFull } from './SimulationBlockFull';
import { SimulationCanvas } from './SimulationCanvas';
import { TopBar } from './TopBar';

interface ReportBuilderShellProps {
  title: string;
  actions: TopBarAction[];
  reportState: ReportBuilderState;
  setReportState: React.Dispatch<React.SetStateAction<ReportBuilderState>>;
  BlockComponent?: React.ComponentType<SimulationBlockProps>;
  isReadOnly?: boolean;
  backPath?: string;
  backLabel?: string;
  submissionError?: Error | null;
}

export function ReportBuilderShell({
  title,
  actions,
  reportState,
  setReportState,
  BlockComponent = SimulationBlockFull,
  isReadOnly,
  backPath,
  backLabel,
  submissionError,
}: ReportBuilderShellProps) {
  const spmSelectionError = useReportSPMSelectionError(reportState);
  const populationError = getReportPopulationError(reportState.simulations);
  const submissionErrorCode =
    submissionError && 'code' in submissionError && typeof submissionError.code === 'string'
      ? submissionError.code
      : undefined;
  const submissionRecovery =
    submissionErrorCode === 'SPM_YEAR_UNAVAILABLE'
      ? 'Choose a supported report year and copy the household inputs to that year before submitting again.'
      : submissionErrorCode === 'SPM_GEOGRAPHY_REQUIRED' ||
          submissionErrorCode === 'SPM_GEOGRAPHY_UNAVAILABLE'
        ? 'Edit the household to review its county FIPS code or choose another SPM geography, then submit again.'
        : submissionErrorCode === 'SPM_COMPOSITION_REQUIRED'
          ? 'Edit the household to review its members and required inputs, then submit again.'
          : submissionErrorCode === 'SPM_SETTINGS_INVALID'
            ? 'Edit the household to choose its SPM settings again, then submit again.'
            : 'Your report inputs are still here. Correct them and submit again.';
  return (
    <div style={styles.pageContainer}>
      {/* Back breadcrumb */}
      <BackBreadcrumb
        className="tw:gap-xs tw:items-center tw:cursor-pointer"
        style={{ marginBottom: 8, cursor: 'pointer' }}
        backPath={backPath}
        backLabel={backLabel}
      />

      <div style={styles.headerSection}>
        <h1 style={styles.mainTitle}>{title}</h1>
      </div>

      <TopBar actions={actions}>
        <ReportMetaPanel
          reportState={reportState}
          setReportState={setReportState}
          isReadOnly={isReadOnly}
        />
      </TopBar>

      {submissionError && !isReadOnly && (
        <Text size="sm" role="alert" className="tw:my-md">
          {submissionError.message} {submissionErrorCode && `Error code: ${submissionErrorCode}. `}
          {submissionRecovery}
        </Text>
      )}
      {populationError && !isReadOnly && (
        <Text size="sm" role="alert" className="tw:my-md">
          {populationError}
        </Text>
      )}
      {spmSelectionError && !isReadOnly && (
        <Text size="sm" role="alert" className="tw:my-md">
          {spmSelectionError}
        </Text>
      )}

      <SimulationCanvas
        reportYear={reportState.year}
        reportState={reportState}
        setReportState={setReportState}
        BlockComponent={BlockComponent}
        isReadOnly={isReadOnly}
      />
    </div>
  );
}
