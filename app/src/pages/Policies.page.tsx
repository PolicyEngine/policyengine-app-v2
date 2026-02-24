import { useState } from 'react';
import { IconInfoCircle, IconPencil } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { Stack } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { ColumnConfig, IngredientRecord, TextValue } from '@/components/columns';
import { RenameIngredientModal } from '@/components/common/RenameIngredientModal';
import IngredientReadView from '@/components/IngredientReadView';
import { MOCK_USER_ID } from '@/constants';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useUpdatePolicyAssociation, useUserPolicies } from '@/hooks/useUserPolicy';
import { PolicyCreationModal } from '@/pages/reportBuilder/modals/PolicyCreationModal';
import type { EditorMode } from '@/pages/reportBuilder/modals/policyCreation/types';
import { PolicyStateProps } from '@/types/pathwayState';
import { countPolicyModifications } from '@/utils/countParameterChanges';
import { formatDate } from '@/utils/dateUtils';

export default function PoliciesPage() {
  const userId = MOCK_USER_ID.toString(); // TODO: Replace with actual user ID retrieval logic
  const { data, isLoading, isError, error } = useUserPolicies(userId);
  const navigate = useNavigate();
  const countryId = useCurrentCountry();

  const [searchValue, setSearchValue] = useState('');

  // Rename modal state
  const [renamingPolicyId, setRenamingPolicyId] = useState<string | null>(null);
  const [renameOpened, { open: openRename, close: closeRename }] = useDisclosure(false);
  const [renameError, setRenameError] = useState<string | null>(null);

  // Policy editor modal state
  const [editingPolicy, setEditingPolicy] = useState<PolicyStateProps | null>(null);
  const [editorMode, setEditorMode] = useState<EditorMode>('edit');
  const [editorOpened, { open: openEditor, close: closeEditor }] = useDisclosure(false);

  // Rename mutation hook
  const updateAssociation = useUpdatePolicyAssociation();

  const handleBuildPolicy = () => {
    navigate(`/${countryId}/policies/create`);
  };

  const handleOpenEditor = (recordId: string, mode: EditorMode = 'edit') => {
    const item = data?.find((p) => p.association.id?.toString() === recordId);
    if (item) {
      setEditingPolicy({
        id: item.association.policyId.toString(),
        label: item.association.label || `Policy #${item.association.policyId}`,
        parameters: item.policy?.parameters || [],
      });
      setEditorMode(mode);
      openEditor();
    }
  };

  const handleOpenRename = (userPolicyId: string) => {
    setRenamingPolicyId(userPolicyId);
    setRenameError(null); // Clear any previous error
    openRename();
  };

  const handleCloseRename = () => {
    closeRename();
    setRenamingPolicyId(null);
    setRenameError(null); // Clear error on close
  };

  const handleRename = async (newLabel: string) => {
    if (!renamingPolicyId) {
      return;
    }

    try {
      await updateAssociation.mutateAsync({
        userPolicyId: renamingPolicyId,
        updates: { label: newLabel },
      });
      handleCloseRename();
    } catch (error) {
      console.error('[PoliciesPage] Failed to rename policy:', error);
      setRenameError('Failed to rename policy. Please try again.');
    }
  };

  // Find the policy being renamed for current label
  const renamingPolicy = data?.find((item) => item.association.id === renamingPolicyId);
  const currentLabel =
    renamingPolicy?.association.label || `Policy #${renamingPolicy?.association.policyId}`;

  // Define column configurations for policies
  const policyColumns: ColumnConfig[] = [
    {
      key: 'policyName',
      header: 'Policy name',
      type: 'text',
    },
    {
      key: 'dateCreated',
      header: 'Date created',
      type: 'text',
    },
    {
      key: 'provisions',
      header: 'Parameter changes',
      type: 'text',
    },
    {
      key: 'actions',
      header: '',
      type: 'actions',
      actions: [
        { action: 'view', tooltip: 'View policy setup', icon: <IconInfoCircle size={16} /> },
        { action: 'edit', tooltip: 'Edit policy', icon: <IconPencil size={16} /> },
      ],
      onAction: (action: string, recordId: string) => {
        if (action === 'view') {
          handleOpenEditor(recordId, 'display');
        }
        if (action === 'edit') {
          handleOpenEditor(recordId, 'edit');
        }
      },
    },
  ];

  // Transform the data to match the new structure
  const transformedData: IngredientRecord[] =
    data?.map((item) => {
      const paramCount = countPolicyModifications(item.policy);

      return {
        id: item.association.id?.toString() || item.association.policyId.toString(), // Use user association ID, not base policy ID
        policyName: {
          text: item.association.label || `Policy #${item.association.policyId}`,
        } as TextValue,
        dateCreated: {
          text: item.association.createdAt
            ? formatDate(
                item.association.createdAt,
                'short-month-day-year',
                item.association.countryId,
                true
              )
            : '',
        } as TextValue,
        provisions: {
          text: `${paramCount} parameter change${paramCount !== 1 ? 's' : ''}`,
        } as TextValue,
      };
    }) || [];

  return (
    <>
      <Stack gap="md">
        <IngredientReadView
          ingredient="policy"
          title="Your saved policies"
          subtitle="Create a policy reform or find and save existing policies to use in your simulation configurations."
          onBuild={handleBuildPolicy}
          isLoading={isLoading}
          isError={isError}
          error={error}
          data={transformedData}
          columns={policyColumns}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
        />
      </Stack>

      <RenameIngredientModal
        opened={renameOpened}
        onClose={handleCloseRename}
        currentLabel={currentLabel}
        onRename={handleRename}
        isLoading={updateAssociation.isPending}
        ingredientType="policy"
        submissionError={renameError}
      />

      <PolicyCreationModal
        isOpen={editorOpened}
        onClose={() => {
          closeEditor();
          setEditingPolicy(null);
        }}
        onPolicyCreated={() => {
          closeEditor();
          setEditingPolicy(null);
        }}
        simulationIndex={0}
        initialPolicy={editingPolicy ?? undefined}
        initialEditorMode={editorMode}
      />
    </>
  );
}
