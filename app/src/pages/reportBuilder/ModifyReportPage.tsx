import { useEffect, useMemo, useState } from 'react';
import { IconDeviceFloppy, IconPlayerPlay, IconRefresh, IconX } from '@tabler/icons-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Container, Grid, Modal, Stack, Text, TextInput } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { spacing } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { getReportOutputPath } from '@/utils/reportRouting';
import { ReportBuilderShell, SimulationBlockFull } from './components';
import { useModifyReportSubmission } from './hooks/useModifyReportSubmission';
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

  const { handleSaveAsNew, handleReplace, isSavingNew, isReplacing } = useModifyReportSubmission({
    reportState: reportState ?? { label: null, year: '', simulations: [] },
    countryId,
    existingUserReportId: userReportId ?? '',
    onSuccess: (resultUserReportId) => {
      navigate(getReportOutputPath(countryId, resultUserReportId));
    },
  });

  // "Save as new" naming modal
  const [saveModalOpened, { open: openSaveModal, close: closeSaveModal }] = useDisclosure(false);
  const [newReportLabel, setNewReportLabel] = useState('');

  // Pre-fill modal label when opened
  useEffect(() => {
    if (saveModalOpened) {
      const base = reportState?.label || 'Untitled report';
      setNewReportLabel(`${base} (modified)`);
    }
  }, [saveModalOpened, reportState?.label]);

  const handleSaveModalSubmit = () => {
    const trimmed = newReportLabel.trim();
    if (!trimmed) {
      return;
    }
    handleSaveAsNew(trimmed);
    closeSaveModal();
  };

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

  const isEitherSubmitting = isSavingNew || isReplacing;

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
        onClick: openSaveModal,
        variant: 'primary' as const,
        loading: isSavingNew,
        loadingLabel: 'Creating report...',
        disabled: isReplacing,
      },
      {
        key: 'replace',
        label: 'Replace existing report',
        icon: <IconRefresh size={16} />,
        onClick: handleReplace,
        variant: 'secondary' as const,
        loading: isReplacing,
        loadingLabel: 'Replacing report...',
        disabled: isSavingNew,
      },
      {
        key: 'cancel',
        label: 'Cancel',
        icon: <IconX size={16} />,
        onClick: () => navigate(getReportOutputPath(countryId, userReportId!)),
        variant: 'secondary' as const,
        disabled: isEitherSubmitting,
      },
    ];
  }, [
    hasSubstantiveChanges,
    countryId,
    userReportId,
    navigate,
    openSaveModal,
    handleReplace,
    isSavingNew,
    isReplacing,
    isEitherSubmitting,
  ]);

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
    <>
      <ReportBuilderShell
        title="Modify report"
        actions={topBarActions}
        reportState={reportState}
        setReportState={setReportState as React.Dispatch<React.SetStateAction<ReportBuilderState>>}
        pickerState={pickerState}
        setPickerState={setPickerState}
        BlockComponent={SimulationBlockFull}
      />

      <Modal
        opened={saveModalOpened}
        onClose={closeSaveModal}
        title={<strong>Save as new report</strong>}
        centered
      >
        <Stack gap={spacing.md}>
          <TextInput
            label="Report name"
            placeholder="Enter report name"
            value={newReportLabel}
            onChange={(e) => setNewReportLabel(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSaveModalSubmit();
              }
            }}
            disabled={isSavingNew}
            data-autofocus
          />

          <Grid mt={spacing.md}>
            <Grid.Col span={6}>
              <Button onClick={closeSaveModal} variant="default" disabled={isSavingNew} fullWidth>
                Cancel
              </Button>
            </Grid.Col>
            <Grid.Col span={6}>
              <Button
                onClick={handleSaveModalSubmit}
                variant="filled"
                loading={isSavingNew}
                disabled={!newReportLabel.trim()}
                fullWidth
              >
                Save
              </Button>
            </Grid.Col>
          </Grid>
        </Stack>
      </Modal>
    </>
  );
}
