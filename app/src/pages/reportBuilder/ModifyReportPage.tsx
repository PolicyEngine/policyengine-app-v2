import { useEffect, useMemo, useRef, useState } from 'react';
import { IconDeviceFloppy, IconPlayerPlay, IconRefresh, IconX } from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { Container, Stack, Text } from '@mantine/core';
import { spacing } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useUserReportById } from '@/hooks/useUserReports';
import { RootState } from '@/store';
import { getReportOutputPath } from '@/utils/reportRouting';
import { ReportBuilderShell, SimulationBlockFull } from './components';
import type { IngredientPickerState, ReportBuilderState, TopBarAction } from './types';
import { hydrateReportBuilderState } from './utils/hydrateReportBuilderState';

export default function ModifyReportPage() {
  const { userReportId } = useParams<{ userReportId: string }>();
  const countryId = useCurrentCountry() as 'us' | 'uk';
  const navigate = useNavigate();
  const currentLawId = useSelector((state: RootState) => state.metadata.currentLawId);

  const data = useUserReportById(userReportId ?? '');

  const [reportState, setReportState] = useState<ReportBuilderState | null>(null);
  const originalStateRef = useRef<ReportBuilderState | null>(null);

  const [pickerState, setPickerState] = useState<IngredientPickerState>({
    isOpen: false,
    simulationIndex: 0,
    ingredientType: 'policy',
  });

  // Hydrate once data loads
  useEffect(() => {
    if (
      !data.isLoading &&
      !data.error &&
      data.userReport &&
      data.report &&
      data.simulations.length > 0 &&
      reportState === null
    ) {
      const hydrated = hydrateReportBuilderState({
        userReport: data.userReport,
        report: data.report,
        simulations: data.simulations,
        policies: data.policies,
        households: data.households,
        geographies: data.geographies,
        userSimulations: data.userSimulations,
        userPolicies: data.userPolicies,
        userHouseholds: data.userHouseholds,
        userGeographies: data.userGeographies,
        currentLawId,
      });
      setReportState(hydrated);
      originalStateRef.current = hydrated;
    }
  }, [
    data.isLoading,
    data.error,
    data.userReport,
    data.report,
    data.simulations,
    data.policies,
    data.households,
    data.geographies,
    data.userSimulations,
    data.userPolicies,
    data.userHouseholds,
    data.userGeographies,
    currentLawId,
    reportState,
  ]);

  // Change detection (exclude label)
  const hasSubstantiveChanges = useMemo(() => {
    if (!originalStateRef.current || !reportState) {
      return false;
    }
    const orig = originalStateRef.current;
    return (
      orig.year !== reportState.year ||
      JSON.stringify(orig.simulations) !== JSON.stringify(reportState.simulations)
    );
  }, [reportState]);

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

  if (data.isLoading || !reportState) {
    return (
      <Container size="xl" px={spacing.xl}>
        <Stack gap={spacing.xl}>
          <Text>Loading report...</Text>
        </Stack>
      </Container>
    );
  }

  if (data.error) {
    return (
      <Container size="xl" px={spacing.xl}>
        <Stack gap={spacing.xl}>
          <Text c="red">Error loading report: {data.error.message}</Text>
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
