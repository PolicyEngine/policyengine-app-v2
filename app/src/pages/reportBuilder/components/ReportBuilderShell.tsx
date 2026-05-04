/**
 * ReportBuilderShell - Reusable visual shell for the report builder
 *
 * Renders the page layout: header + TopBar (with ReportMetaPanel + actions) + SimulationCanvas.
 * Accepts all logic via props so different modes (setup, modify) can compose it.
 */
import { BackBreadcrumb } from '@/components/common/BackBreadcrumb';
import { styles } from '../styles';
import type {
  IngredientPickerState,
  ReportBuilderState,
  SimulationBlockProps,
  TopBarAction,
} from '../types';
import { ReportMetaPanel } from './ReportMetaPanel';
import { SimulationBlockFull } from './SimulationBlockFull';
import { SimulationCanvas } from './SimulationCanvas';
import { TopBar } from './TopBar';

interface ReportBuilderShellProps {
  title: string;
  actions: TopBarAction[];
  reportState: ReportBuilderState;
  setReportState: React.Dispatch<React.SetStateAction<ReportBuilderState>>;
  pickerState: IngredientPickerState;
  setPickerState: React.Dispatch<React.SetStateAction<IngredientPickerState>>;
  BlockComponent?: React.ComponentType<SimulationBlockProps>;
  isReadOnly?: boolean;
  backPath?: string;
  backLabel?: string;
}

export function ReportBuilderShell({
  title,
  actions,
  reportState,
  setReportState,
  pickerState,
  setPickerState,
  BlockComponent = SimulationBlockFull,
  isReadOnly,
  backPath,
  backLabel,
}: ReportBuilderShellProps) {
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

      <SimulationCanvas
        reportYear={reportState.year}
        reportState={reportState}
        setReportState={setReportState}
        pickerState={pickerState}
        setPickerState={setPickerState}
        BlockComponent={BlockComponent}
        isReadOnly={isReadOnly}
      />
    </div>
  );
}
