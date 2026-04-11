import { useCallback, useMemo, useState } from 'react';
import { IconNewSection, IconPencil, IconStatusChange, IconX } from '@tabler/icons-react';
import {
  Button,
  Container,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Group,
  Stack,
  Text,
} from '@/components/ui';
import { useAppLocation } from '@/contexts/LocationContext';
import { useAppNavigate } from '@/contexts/NavigationContext';
import { spacing } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { getReportOutputPath } from '@/utils/reportRouting';
import { extractShareDataFromUrl } from '@/utils/shareUtils';
import { ReportBuilderShell, SimulationBlockFull } from './components';
import { useModifyReportSubmission } from './hooks/useModifyReportSubmission';
import { useReportBuilderState } from './hooks/useReportBuilderState';
import type { IngredientPickerState, ReportBuilderState, TopBarAction } from './types';

export default function ModifyReportPage({ userReportId }: { userReportId?: string }) {
  const countryId = useCurrentCountry() as 'us' | 'uk';
  const nav = useAppNavigate();
  const location = useAppLocation();
  const searchParams = new URLSearchParams(location.search);
  const shareData = extractShareDataFromUrl(searchParams);
  const isSharedSource = shareData !== null;
  const shareParam = searchParams.get('share');
  const sharedSearch = shareParam ? new URLSearchParams({ share: shareParam }).toString() : '';
  const reportOutputPath = userReportId
    ? `${getReportOutputPath(countryId, userReportId)}${sharedSearch ? `?${sharedSearch}` : ''}`
    : undefined;

  const { reportState, setReportState, originalState, isLoading, error } = useReportBuilderState(
    userReportId ?? '',
    { shareData }
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
      nav.push(getReportOutputPath(countryId, resultUserReportId));
    },
  });

  // View/edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [showSameNameWarning, setShowSameNameWarning] = useState(false);
  const isReadOnly = isSharedSource || !isEditing;

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
    if (isSharedSource) {
      return [];
    }
    if (!isEditing) {
      return [
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
    isSharedSource,
    isEditing,
    handleSaveAsNewClick,
    handleReplace,
    isSavingNew,
    isReplacing,
    isEitherSubmitting,
  ]);

  if (!reportState) {
    if (error) {
      return (
        <Container size="xl" style={{ paddingLeft: spacing.xl, paddingRight: spacing.xl }}>
          <Stack gap="xl">
            <Text c="red">Error loading report: {error.message}</Text>
          </Stack>
        </Container>
      );
    }

    return (
      <Container size="xl" style={{ paddingLeft: spacing.xl, paddingRight: spacing.xl }}>
        <Stack gap="xl">
          <Text>{isLoading ? 'Loading report...' : 'Report not found'}</Text>
        </Stack>
      </Container>
    );
  }

  return (
    <>
      <ReportBuilderShell
        title={isEditing && !isSharedSource ? 'Edit report' : 'View report setup'}
        backPath={reportOutputPath}
        backLabel={reportOutputPath ? 'report output' : undefined}
        actions={topBarActions}
        reportState={reportState}
        setReportState={setReportState as React.Dispatch<React.SetStateAction<ReportBuilderState>>}
        pickerState={pickerState}
        setPickerState={setPickerState}
        BlockComponent={SimulationBlockFull}
        isReadOnly={isReadOnly}
      />

      <Dialog
        open={showSameNameWarning}
        onOpenChange={(open) => !open && setShowSameNameWarning(false)}
      >
        <DialogContent className="tw:sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Same name</DialogTitle>
          </DialogHeader>
          <Stack gap="md">
            <Text size="sm">
              Both the original and new report will have the name &quot;
              {(reportState?.label || '').trim()}&quot;. Are you sure you want to save?
            </Text>
            <Group justify="end" gap="sm">
              <Button variant="ghost" onClick={() => setShowSameNameWarning(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setShowSameNameWarning(false);
                  handleSaveAsNew(reportState?.label || 'Untitled report');
                }}
              >
                Save anyway
              </Button>
            </Group>
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  );
}
