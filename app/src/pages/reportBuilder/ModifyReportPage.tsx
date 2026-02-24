import { useCallback, useMemo, useState } from 'react';
import {
  IconChevronLeft,
  IconNewSection,
  IconPencil,
  IconStatusChange,
  IconX,
} from '@tabler/icons-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button, Container, Group, Modal, Stack, Text } from '@mantine/core';
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
  const location = useLocation();
  const startInEditMode = (location.state as { edit?: boolean } | null)?.edit === true;

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

  // View/edit mode state
  const [isEditing, setIsEditing] = useState(startInEditMode);
  const [showSameNameWarning, setShowSameNameWarning] = useState(false);

  const isEitherSubmitting = isSavingNew || isReplacing;

  // Same-name guard for "Save as new report"
  const handleSaveAsNewClick = useCallback(() => {
    const currentName = (reportState?.label || '').trim();
    const origName = (originalState?.label || '').trim();
    if (currentName && currentName === origName) {
      setShowSameNameWarning(true);
    } else {
      handleSaveAsNew(reportState?.label || 'Untitled report');
    }
  }, [reportState?.label, originalState?.label, handleSaveAsNew]);

  // Dynamic toolbar actions
  const topBarActions: TopBarAction[] = useMemo(() => {
    if (!isEditing) {
      return [
        {
          key: 'back',
          label: 'Back',
          icon: <IconChevronLeft size={16} />,
          onClick: () => navigate(getReportOutputPath(countryId, userReportId!)),
          variant: 'secondary' as const,
        },
        {
          key: 'edit',
          label: 'Edit report',
          icon: <IconPencil size={16} />,
          onClick: () => setIsEditing(true),
          variant: 'primary' as const,
        },
      ];
    }
    return [
      {
        key: 'cancel',
        label: 'Cancel',
        icon: <IconX size={16} />,
        onClick: () => {
          if (originalState) {
            setReportState(structuredClone(originalState) as ReportBuilderState);
          }
          setIsEditing(false);
        },
        variant: 'secondary' as const,
        disabled: isEitherSubmitting,
      },
      {
        key: 'replace',
        label: 'Update existing report',
        icon: <IconStatusChange size={16} />,
        onClick: handleReplace,
        variant: 'secondary' as const,
        loading: isReplacing,
        loadingLabel: 'Updating report...',
        disabled: isSavingNew,
      },
      {
        key: 'save-new',
        label: 'Save as new report',
        icon: <IconNewSection size={16} />,
        onClick: handleSaveAsNewClick,
        variant: 'primary' as const,
        loading: isSavingNew,
        loadingLabel: 'Creating report...',
        disabled: isReplacing,
      },
    ];
  }, [
    isEditing,
    countryId,
    userReportId,
    navigate,
    handleSaveAsNewClick,
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
        title={isEditing ? 'Edit report' : 'View report setup'}
        actions={topBarActions}
        reportState={reportState}
        setReportState={setReportState as React.Dispatch<React.SetStateAction<ReportBuilderState>>}
        pickerState={pickerState}
        setPickerState={setPickerState}
        BlockComponent={SimulationBlockFull}
        isReadOnly={!isEditing}
      />

      <Modal
        opened={showSameNameWarning}
        onClose={() => setShowSameNameWarning(false)}
        title="Same name"
        centered
        size="sm"
      >
        <Stack gap={spacing.md}>
          <Text size="sm">
            Both the original and new report will have the name &quot;
            {(reportState?.label || '').trim()}&quot;. Are you sure you want to save?
          </Text>
          <Group justify="flex-end" gap={spacing.sm}>
            <Button variant="subtle" color="gray" onClick={() => setShowSameNameWarning(false)}>
              Cancel
            </Button>
            <Button
              color="teal"
              onClick={() => {
                setShowSameNameWarning(false);
                handleSaveAsNew(reportState?.label || 'Untitled report');
              }}
            >
              Save anyway
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
