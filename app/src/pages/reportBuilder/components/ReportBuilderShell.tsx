/**
 * ReportBuilderShell - Reusable visual shell for the report builder
 *
 * Renders the page layout: header + TopBar (with ReportMetaPanel + actions) + SimulationCanvas.
 * Accepts all logic via props so different modes (setup, modify) can compose it.
 */
import { IconChevronLeft } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { Group, Text } from '@/components/ui';
import { colors } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
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
  const navigate = useNavigate();
  const countryId = useCurrentCountry();

  return (
    <div style={styles.pageContainer}>
      {/* Back breadcrumb */}
      <Group
        gap="xs"
        align="center"
        style={{ marginBottom: 8, cursor: 'pointer' }}
        onClick={() => navigate(backPath || `/${countryId}/reports`)}
      >
        <IconChevronLeft size={14} color={colors.gray[500]} />
        <Text size="sm" c="dimmed">
          {backLabel ? `Back to ${backLabel}` : 'Back to reports'}
        </Text>
      </Group>

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
