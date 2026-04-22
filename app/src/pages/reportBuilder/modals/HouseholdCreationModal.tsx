import { useCallback, useEffect, useMemo, useState } from 'react';
import { IconChevronLeft, IconHome, IconX } from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Group } from '@/components/ui/Group';
import { Spinner } from '@/components/ui/Spinner';
import { Stack } from '@/components/ui/Stack';
import { Text } from '@/components/ui/Text';
import { colors, spacing } from '@/designTokens';
import { useCreateHousehold } from '@/hooks/useCreateHousehold';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useUpdateHouseholdAssociation } from '@/hooks/useUserHousehold';
import { getBasicInputFields } from '@/libs/metadataUtils';
import { Household as HouseholdModel } from '@/models/Household';
import type { AppHouseholdInputEnvelope } from '@/models/household/appTypes';
import { EditableLabel } from '@/pages/reportBuilder/components/EditableLabel';
import { RootState } from '@/store';
import type { UserHouseholdPopulation } from '@/types/ingredients/UserPopulation';
import { PopulationStateProps } from '@/types/pathwayState';
import { HouseholdBuilder } from '@/utils/HouseholdBuilder';
import {
  deriveHouseholdBuilderComposition,
  updateHouseholdBuilderChildCount,
  updateHouseholdBuilderMaritalStatus,
} from '@/utils/householdBuilderComposition';
import { cloneHousehold } from '@/utils/householdDataAccess';
import { HouseholdValidation } from '@/utils/HouseholdValidation';
import { BROWSE_MODAL_CONFIG, FONT_SIZES, INGREDIENT_COLORS } from '../constants';
import { HouseholdCreationContent } from './population';

type HouseholdEditorMode = 'create' | 'display' | 'edit';
type PendingUnnamedAction = 'create' | 'save-as-new' | 'update-existing' | null;

interface HouseholdCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBack?: () => void;
  onHouseholdSaved: (population: PopulationStateProps) => void;
  reportYear: string;
  initialPopulation?: PopulationStateProps;
  initialAssociation?: UserHouseholdPopulation;
  initialEditorMode?: HouseholdEditorMode;
  forceReadOnly?: boolean;
}

function buildStarterHousehold(
  countryId: 'us' | 'uk',
  reportYear: string
): AppHouseholdInputEnvelope {
  const builder = new HouseholdBuilder(countryId, reportYear);
  builder.addAdult('you', 30, { employment_income: 0 });
  return builder.build();
}

function cloneHouseholdWithLabel(
  household: AppHouseholdInputEnvelope,
  label: string | null
): AppHouseholdInputEnvelope {
  return {
    ...cloneHousehold(household),
    label,
  };
}

function isHouseholdWithToAppInput(
  household: unknown
): household is { toAppInput: () => AppHouseholdInputEnvelope } {
  return (
    typeof household === 'object' &&
    household !== null &&
    'toAppInput' in household &&
    typeof (household as { toAppInput?: unknown }).toAppInput === 'function'
  );
}

function normalizeAppHouseholdInput(
  household: AppHouseholdInputEnvelope | { toAppInput: () => AppHouseholdInputEnvelope }
): AppHouseholdInputEnvelope {
  if (isHouseholdWithToAppInput(household)) {
    return household.toAppInput();
  }

  return household;
}

export function HouseholdCreationModal({
  isOpen,
  onClose,
  onBack = onClose,
  onHouseholdSaved,
  reportYear,
  initialPopulation,
  initialAssociation,
  initialEditorMode,
  forceReadOnly = false,
}: HouseholdCreationModalProps) {
  const countryId = useCurrentCountry() as 'us' | 'uk';
  const metadata = useSelector((state: RootState) => state.metadata);
  const basicInputFields = useSelector(getBasicInputFields);
  const updateHouseholdAssociation = useUpdateHouseholdAssociation();

  const normalizedInitialHousehold = useMemo(() => {
    const initialHousehold = initialPopulation?.household;
    if (!initialHousehold) {
      return null;
    }

    const appInputHousehold = normalizeAppHouseholdInput(
      initialHousehold as
        | AppHouseholdInputEnvelope
        | { toAppInput: () => AppHouseholdInputEnvelope }
    );

    return cloneHouseholdWithLabel(
      appInputHousehold,
      initialPopulation?.label ?? appInputHousehold.label ?? null
    );
  }, [initialPopulation]);

  const resolvedInitialEditorMode: HouseholdEditorMode = forceReadOnly
    ? 'display'
    : initialEditorMode || (normalizedInitialHousehold ? 'edit' : 'create');
  const [editorMode, setEditorMode] = useState<HouseholdEditorMode>(resolvedInitialEditorMode);
  const effectiveEditorMode: HouseholdEditorMode = forceReadOnly ? 'display' : editorMode;
  const isReadOnly = effectiveEditorMode === 'display';

  const [household, setHousehold] = useState<AppHouseholdInputEnvelope | null>(null);
  const [validation, setValidation] = useState<ReturnType<
    typeof HouseholdValidation.isReadyForSimulation
  > | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [pendingUnnamedAction, setPendingUnnamedAction] = useState<PendingUnnamedAction>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setEditorMode(resolvedInitialEditorMode);
    setPendingUnnamedAction(null);
    setValidation(null);
    setHousehold(
      normalizedInitialHousehold
        ? cloneHouseholdWithLabel(
            normalizedInitialHousehold,
            normalizedInitialHousehold.label ?? null
          )
        : buildStarterHousehold(countryId, reportYear)
    );
  }, [countryId, isOpen, normalizedInitialHousehold, reportYear, resolvedInitialEditorMode]);

  const { createHousehold, isPending: isCreating } = useCreateHousehold(
    household?.label || undefined
  );

  const basicNonPersonFields = useMemo(
    () =>
      Object.entries(basicInputFields)
        .filter(([key]) => key !== 'person')
        .flatMap(([, fields]) => fields),
    [basicInputFields]
  );

  const composition = useMemo(
    () => (household ? deriveHouseholdBuilderComposition(household, reportYear) : undefined),
    [household, reportYear]
  );
  const maritalStatus = composition?.maritalStatus ?? 'single';
  const numChildren = composition?.numChildren ?? 0;
  const memberCount = composition?.people.length ?? 0;

  useEffect(() => {
    if (!isOpen || !household || isReadOnly) {
      setValidation(null);
      return;
    }

    setValidation(null);
    const timeoutId = setTimeout(() => {
      setValidation(HouseholdValidation.isReadyForSimulation(household, reportYear));
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [household, isOpen, isReadOnly, reportYear]);

  const validationMessage = isReadOnly ? null : (validation?.errors[0]?.message ?? null);

  const hasChanges = useMemo(() => {
    if (!household) {
      return false;
    }
    if (!normalizedInitialHousehold) {
      return true;
    }

    return !HouseholdModel.fromAppInput(household).isEqual(
      HouseholdModel.fromAppInput(normalizedInitialHousehold)
    );
  }, [household, normalizedInitialHousehold]);

  const isValidationBlocking =
    !isReadOnly && (!household || validation === null || validation.isValid === false);

  const handleHouseholdChange = useCallback((nextHousehold: AppHouseholdInputEnvelope) => {
    setValidation(null);
    setHousehold(nextHousehold);
  }, []);

  const handleHouseholdLabelChange = useCallback((label: string) => {
    setHousehold((prev) => (prev ? { ...prev, label: label.trim() ? label : null } : prev));
  }, []);

  const handleMaritalStatusChange = useCallback(
    (newStatus: 'single' | 'married') => {
      if (!household) {
        return;
      }

      setValidation(null);
      setHousehold(updateHouseholdBuilderMaritalStatus(household, reportYear, newStatus));
    },
    [household, reportYear]
  );

  const handleNumChildrenChange = useCallback(
    (newCount: number) => {
      if (!household) {
        return;
      }

      setValidation(null);
      setHousehold(updateHouseholdBuilderChildCount(household, reportYear, newCount));
    },
    [household, reportYear]
  );

  const persistCreatedHousehold = useCallback(
    (savedHousehold: AppHouseholdInputEnvelope) => {
      onHouseholdSaved({
        geography: null,
        household: savedHousehold,
        label: savedHousehold.label ?? null,
        type: 'household',
      });
      onClose();
    },
    [onClose, onHouseholdSaved]
  );

  const handleCreateNewHousehold = useCallback(async () => {
    if (!household) {
      return;
    }

    const nextValidation = HouseholdValidation.isReadyForSimulation(household, reportYear);
    setValidation(nextValidation);
    if (!nextValidation.isValid) {
      return;
    }

    try {
      const payload = HouseholdModel.fromAppInput(household).toV1CreationPayload();
      const result = await createHousehold(payload);
      const householdId = String(result.result.household_id);
      const savedHousehold = HouseholdModel.fromAppInput(household)
        .withId(householdId)
        .withLabel(household.label ?? null)
        .toAppInput();
      persistCreatedHousehold(savedHousehold);
    } catch (error) {
      console.error('Failed to create household:', error);
    }
  }, [createHousehold, household, persistCreatedHousehold, reportYear]);

  const handleUpdateExistingHousehold = useCallback(async () => {
    if (!household || !initialAssociation?.id) {
      return;
    }

    const nextValidation = HouseholdValidation.isReadyForSimulation(household, reportYear);
    setValidation(nextValidation);
    if (!nextValidation.isValid) {
      return;
    }

    setIsUpdating(true);
    try {
      let updatedAssociation = await updateHouseholdAssociation.mutateAsync({
        userHouseholdId: initialAssociation.id,
        updates: {},
        association: initialAssociation,
        nextHousehold: household,
      });

      const desiredLabel = household.label ?? undefined;
      if ((updatedAssociation.label ?? undefined) !== desiredLabel) {
        updatedAssociation = await updateHouseholdAssociation.mutateAsync({
          userHouseholdId: initialAssociation.id,
          updates: { label: desiredLabel },
        });
      }

      const savedHousehold = HouseholdModel.fromAppInput(household)
        .withId(updatedAssociation.householdId)
        .withLabel(updatedAssociation.label ?? desiredLabel ?? null)
        .toAppInput();

      persistCreatedHousehold(savedHousehold);
    } catch (error) {
      console.error('Failed to update household:', error);
    } finally {
      setIsUpdating(false);
    }
  }, [
    household,
    initialAssociation,
    persistCreatedHousehold,
    reportYear,
    updateHouseholdAssociation,
  ]);

  const runPendingUnnamedAction = useCallback(() => {
    const action = pendingUnnamedAction;
    setPendingUnnamedAction(null);

    if (action === 'create' || action === 'save-as-new') {
      void handleCreateNewHousehold();
    } else if (action === 'update-existing') {
      void handleUpdateExistingHousehold();
    }
  }, [handleCreateNewHousehold, handleUpdateExistingHousehold, pendingUnnamedAction]);

  const requestSaveAction = useCallback(
    (action: Exclude<PendingUnnamedAction, null>) => {
      if (!household) {
        return;
      }

      if (!household.label?.trim()) {
        setPendingUnnamedAction(action);
        return;
      }

      if (action === 'create' || action === 'save-as-new') {
        void handleCreateNewHousehold();
      } else {
        void handleUpdateExistingHousehold();
      }
    },
    [handleCreateNewHousehold, handleUpdateExistingHousehold, household]
  );

  const colorConfig = INGREDIENT_COLORS.population;
  const footerLoading = isCreating || isUpdating;
  const modalTitle =
    effectiveEditorMode === 'display'
      ? 'Household details'
      : effectiveEditorMode === 'edit'
        ? 'Edit household'
        : 'Create new household';

  return (
    <>
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) {
            onClose();
          }
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="tw:sm:max-w-none tw:p-0 tw:gap-0"
          style={{
            width: BROWSE_MODAL_CONFIG.width,
            maxWidth: BROWSE_MODAL_CONFIG.maxWidth,
            height: BROWSE_MODAL_CONFIG.height,
            maxHeight: BROWSE_MODAL_CONFIG.maxHeight,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <DialogTitle className="tw:sr-only">{modalTitle}</DialogTitle>
          <DialogDescription className="tw:sr-only">
            Create, review, or edit a household configuration.
          </DialogDescription>

          <div
            style={{
              padding: spacing.md,
              paddingLeft: spacing.xl,
              paddingRight: spacing.xl,
              borderBottom: `1px solid ${colors.border.light}`,
            }}
          >
            <Group justify="space-between" align="center" wrap="nowrap" style={{ width: '100%' }}>
              <Group gap="md" align="center" wrap="nowrap" style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: spacing.radius.container,
                    background: `linear-gradient(135deg, ${colorConfig.bg} 0%, ${colors.white} 100%)`,
                    border: `1px solid ${colorConfig.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <IconHome size={18} color={colorConfig.icon} />
                </div>
                <Text
                  fw={600}
                  style={{
                    fontSize: FONT_SIZES.normal,
                    color: colors.gray[800],
                    flexShrink: 0,
                  }}
                >
                  {modalTitle}
                </Text>
                <div
                  style={{
                    minWidth: 280,
                    flex: 1,
                    border: `1px solid ${colors.border.light}`,
                    background: colors.gray[50],
                    borderRadius: spacing.radius.container,
                    padding: `${spacing.xs} ${spacing.sm}`,
                  }}
                >
                  <EditableLabel
                    value={household?.label ?? ''}
                    onChange={handleHouseholdLabelChange}
                    placeholder="Enter household name..."
                    emptyStateText="Click to name your household..."
                    readOnly={isReadOnly}
                  />
                </div>
              </Group>
              <Group gap="md" align="center" wrap="nowrap" style={{ flexShrink: 0 }}>
                <Group gap="xs" align="center" wrap="nowrap">
                  {memberCount > 0 && (
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: colors.primary[500],
                      }}
                    />
                  )}
                  <Text style={{ fontSize: FONT_SIZES.small, color: colors.gray[600] }}>
                    {memberCount > 0
                      ? `${memberCount} household member${memberCount !== 1 ? 's' : ''}`
                      : 'No household members yet'}
                  </Text>
                </Group>
                <Button variant="ghost" size="icon-sm" onClick={onClose} style={{ flexShrink: 0 }}>
                  <IconX size={18} />
                </Button>
              </Group>
            </Group>
          </div>

          <div
            style={{
              flex: 1,
              minHeight: 0,
              overflow: 'hidden',
              display: 'flex',
              paddingLeft: spacing.xl,
              paddingRight: spacing.xl,
              paddingTop: spacing.lg,
            }}
          >
            <HouseholdCreationContent
              householdDraft={household}
              metadata={metadata}
              reportYear={reportYear}
              maritalStatus={maritalStatus}
              numChildren={numChildren}
              basicPersonFields={basicInputFields.person || []}
              basicNonPersonFields={basicNonPersonFields}
              isCreating={footerLoading}
              validationMessage={validationMessage}
              isReadOnly={isReadOnly}
              onChange={handleHouseholdChange}
              onMaritalStatusChange={handleMaritalStatusChange}
              onNumChildrenChange={handleNumChildrenChange}
            />
          </div>

          <div
            style={{
              borderTop: `1px solid ${colors.border.light}`,
              padding: spacing.md,
              paddingLeft: spacing.xl,
              paddingRight: spacing.xl,
              background: colors.white,
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'auto 1fr auto',
                alignItems: 'center',
                width: '100%',
              }}
            >
              <Group gap="sm">
                <Button variant="ghost" onClick={onBack}>
                  <IconChevronLeft size={16} />
                  Back
                </Button>
                <Button variant="ghost" onClick={onClose}>
                  Cancel
                </Button>
              </Group>
              <div />
              <Group gap="sm" justify="end">
                {!forceReadOnly && effectiveEditorMode === 'display' && (
                  <Button variant="outline" onClick={() => setEditorMode('edit')}>
                    Edit this household
                  </Button>
                )}
                {effectiveEditorMode === 'create' && (
                  <Button
                    onClick={() => requestSaveAction('create')}
                    disabled={footerLoading || isValidationBlocking}
                  >
                    {footerLoading && <Spinner size="sm" />}
                    Create household
                  </Button>
                )}
                {!forceReadOnly && effectiveEditorMode === 'edit' && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => requestSaveAction('update-existing')}
                      disabled={
                        footerLoading ||
                        isValidationBlocking ||
                        !hasChanges ||
                        !initialAssociation?.id
                      }
                    >
                      {isUpdating && <Spinner size="sm" />}
                      Update existing household
                    </Button>
                    <Button
                      onClick={() => requestSaveAction('save-as-new')}
                      disabled={footerLoading || isValidationBlocking || !hasChanges}
                    >
                      {isCreating && <Spinner size="sm" />}
                      Save as new household
                    </Button>
                  </>
                )}
              </Group>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={pendingUnnamedAction !== null}
        onOpenChange={(open) => !open && setPendingUnnamedAction(null)}
      >
        <DialogContent>
          <DialogTitle>Unnamed household</DialogTitle>
          <DialogDescription className="tw:sr-only">
            Confirm saving a household without a name
          </DialogDescription>
          <Stack gap="md">
            <Text size="sm">
              This household has no name. Are you sure you want to save it without a name?
            </Text>
            <Group justify="end" gap="sm">
              <Button variant="outline" onClick={() => setPendingUnnamedAction(null)}>
                Cancel
              </Button>
              <Button onClick={runPendingUnnamedAction}>Save anyway</Button>
            </Group>
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  );
}
