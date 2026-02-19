import { useMemo, useState } from 'react';
import { IconDeviceFloppy, IconPlayerPlay, IconRefresh, IconX } from '@tabler/icons-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Container, Stack, Text } from '@mantine/core';
import { spacing } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { getReportOutputPath } from '@/utils/reportRouting';
import { ReportBuilderShell, SimulationBlockFull } from './components';
import { useReportBuilderState } from './hooks/useReportBuilderState';
import type { IngredientPickerState, ReportBuilderState, TopBarAction } from './types';

export default function ModifyReportPage() {
  const { userReportId } = useParams<{ userReportId: string }>();
  const countryId = useCurrentCountry() as 'us' | 'uk';
  const navigate = useNavigate();

  const { reportState, setReportState, originalState, isLoading, error } = useReportBuilderState(
    userReportId ?? ''
  );

  const [pickerState, setPickerState] = useState<IngredientPickerState>({
    isOpen: false,
    simulationIndex: 0,
    ingredientType: 'policy',
  });

  // Change detection (exclude label)
  const hasSubstantiveChanges = useMemo(() => {
    if (!originalState || !reportState) {
      return false;
    }
    return (
      originalState.year !== reportState.year ||
      JSON.stringify(originalState.simulations) !== JSON.stringify(reportState.simulations)
    );
  }, [reportState, originalState]);

  // Dynamic toolbar actions
  const topBarActions: TopBarAction[] = useMemo(() => {
    if (!hasSubstantiveChanges) {
      return [
        {
          key: 'already-run',
          label: 'Already run',
          icon: <IconPlayerPlay size={16} />,
          onClick: () => {},
          variant: 'primary' as const,
          disabled: true,
        },
      ];
    }
    return [
      {
        key: 'save-new',
        label: 'Save as new report',
        icon: <IconDeviceFloppy size={16} />,
        onClick: () => console.info('Save as new report'),
        variant: 'primary' as const,
      },
      {
        key: 'replace',
        label: 'Replace existing report',
        icon: <IconRefresh size={16} />,
        onClick: () => console.info('Replace existing report'),
        variant: 'secondary' as const,
      },
      {
        key: 'cancel',
        label: 'Cancel',
        icon: <IconX size={16} />,
        onClick: () => navigate(getReportOutputPath(countryId, userReportId!)),
        variant: 'secondary' as const,
      },
    ];
  }, [hasSubstantiveChanges, countryId, userReportId, navigate]);

  if (isLoading || !reportState) {
    return (
      <Container size="xl" px={spacing.xl}>
        <Stack gap={spacing.xl}>
          <Text>Loading report...</Text>
        </Stack>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="xl" px={spacing.xl}>
        <Stack gap={spacing.xl}>
          <Text c="red">Error loading report: {error.message}</Text>
        </Stack>
      </Container>
    );
  }

  return (
    <ReportBuilderShell
      title="Modify report"
      actions={topBarActions}
      reportState={reportState}
      setReportState={setReportState as React.Dispatch<React.SetStateAction<ReportBuilderState>>}
      pickerState={pickerState}
      setPickerState={setPickerState}
      BlockComponent={SimulationBlockFull}
    />
  );
}
