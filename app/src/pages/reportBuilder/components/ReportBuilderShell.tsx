/**
 * ReportBuilderShell - Reusable visual shell for the report builder
 *
 * Renders the page layout: header + TopBar (with ReportMetaPanel + actions) + SimulationCanvas.
 * Accepts all logic via props so different modes (setup, modify) can compose it.
 */
import { Box } from '@mantine/core';
import { styles } from '../styles';
import type { IngredientPickerState, ReportBuilderState, TopBarAction } from '../types';
import { ReportMetaPanel } from './ReportMetaPanel';
import type { SimulationBlockProps } from './SimulationBlock';
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
}: ReportBuilderShellProps) {
  return (
    <Box style={styles.pageContainer}>
      <Box style={styles.headerSection}>
        <h1 style={styles.mainTitle}>{title}</h1>
      </Box>

      <TopBar actions={actions}>
        <ReportMetaPanel
          reportState={reportState}
          setReportState={setReportState}
          isReadOnly={isReadOnly}
        />
      </TopBar>

      <SimulationCanvas
        reportState={reportState}
        setReportState={setReportState}
        pickerState={pickerState}
        setPickerState={setPickerState}
        BlockComponent={BlockComponent}
        isReadOnly={isReadOnly}
      />
    </Box>
  );
}
