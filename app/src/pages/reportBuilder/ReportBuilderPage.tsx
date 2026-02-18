/**
 * ReportBuilderPage - Setup mode for creating a new report
 *
 * Composes ReportBuilderShell with:
 * - Blank state initialization
 * - useReportSubmission for create-only submission
 * - Auto-add second simulation when geography is selected
 * - Single "Run" top bar action
 */

import { useEffect, useMemo, useState } from 'react';
import { IconPlayerPlay } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { CURRENT_YEAR } from '@/constants';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { initializeSimulationState } from '@/utils/pathwayState/initializeSimulationState';
import { getReportOutputPath } from '@/utils/reportRouting';
import { ReportBuilderShell, SimulationBlockFull } from './components';
import { useReportSubmission } from './hooks/useReportSubmission';
import type { IngredientPickerState, ReportBuilderState, TopBarAction } from './types';

export default function ReportBuilderPage() {
  const countryId = useCurrentCountry() as 'us' | 'uk';
  const navigate = useNavigate();

  // State initialization (setup mode: blank)
  const initialSim = initializeSimulationState();
  initialSim.label = 'Baseline simulation';

  const [reportState, setReportState] = useState<ReportBuilderState>({
    label: null,
    year: CURRENT_YEAR,
    simulations: [initialSim],
  });

  const [pickerState, setPickerState] = useState<IngredientPickerState>({
    isOpen: false,
    simulationIndex: 0,
    ingredientType: 'policy',
  });

  // Submission logic (extracted hook)
  const { handleSubmit, isSubmitting, isReportConfigured } = useReportSubmission({
    reportState,
    countryId,
    onSuccess: (userReportId) => {
      navigate(getReportOutputPath(countryId, userReportId));
    },
  });

  // Auto-add second simulation when geography is selected (setup mode only)
  const isGeographySelected = !!reportState.simulations[0]?.population?.geography?.id;

  useEffect(() => {
    if (!reportState.id && isGeographySelected && reportState.simulations.length === 1) {
      const newSim = initializeSimulationState();
      newSim.label = 'Reform simulation';
      newSim.population = { ...reportState.simulations[0].population };
      setReportState((prev) => ({ ...prev, simulations: [...prev.simulations, newSim] }));
    }
  }, [reportState.id, isGeographySelected, reportState.simulations]);

  // Top bar actions (setup mode: just "Run")
  const topBarActions: TopBarAction[] = useMemo(
    () => [
      {
        key: 'run',
        label: 'Run',
        icon: <IconPlayerPlay size={16} />,
        onClick: handleSubmit,
        variant: 'primary',
        disabled: !isReportConfigured,
        loading: isSubmitting,
        loadingLabel: 'Running...',
      },
    ],
    [handleSubmit, isReportConfigured, isSubmitting]
  );

  return (
    <ReportBuilderShell
      title="Report builder"
      actions={topBarActions}
      reportState={reportState}
      setReportState={setReportState}
      pickerState={pickerState}
      setPickerState={setPickerState}
      BlockComponent={SimulationBlockFull}
    />
  );
}
