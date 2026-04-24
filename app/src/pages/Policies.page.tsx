import { useState } from 'react';
import { IconSettings } from '@tabler/icons-react';
import { ColumnConfig, IngredientRecord, TextValue } from '@/components/columns';
import IngredientReadView from '@/components/IngredientReadView';
import { Stack } from '@/components/ui';
import { CURRENT_YEAR, MOCK_USER_ID } from '@/constants';
import { useAppNavigate } from '@/contexts/NavigationContext';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useDisclosure } from '@/hooks/useDisclosure';
import { useUserPolicies } from '@/hooks/useUserPolicy';
import type { EditorMode } from '@/pages/reportBuilder/modals/policyCreation/types';
import { PolicyCreationModal } from '@/pages/reportBuilder/modals/PolicyCreationModal';
import { PolicyStateProps } from '@/types/pathwayState';
import { countPolicyModifications } from '@/utils/countParameterChanges';
import { formatDate } from '@/utils/dateUtils';

export default function PoliciesPage() {
  const userId = MOCK_USER_ID.toString(); // TODO: Replace with actual user ID retrieval logic
  const { data, isLoading, isError, error } = useUserPolicies(userId);
  const nav = useAppNavigate();
  const countryId = useCurrentCountry();

  const [searchValue, setSearchValue] = useState('');

  // Policy editor modal state
  const [editingPolicy, setEditingPolicy] = useState<PolicyStateProps | null>(null);
  const [editingAssociationId, setEditingAssociationId] = useState<string | null>(null);
  const [editorMode, setEditorMode] = useState<EditorMode>('edit');
  const [editorOpened, { open: openEditor, close: closeEditor }] = useDisclosure(false);

  const handleBuildPolicy = () => {
    nav.push(`/${countryId}/policies/create`);
  };

  const handleOpenEditor = (recordId: string, mode: EditorMode = 'edit') => {
    const item = data?.find((p) => p.association.id?.toString() === recordId);
    if (item) {
      setEditingPolicy({
        id: item.association.policyId.toString(),
        label: item.association.label || `Policy #${item.association.policyId}`,
        parameters: item.policy?.parameters || [],
      });
      setEditingAssociationId(recordId);
      setEditorMode(mode);
      openEditor();
    }
  };

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
      actions: [{ action: 'edit', tooltip: 'View/edit policy', icon: <IconSettings size={16} /> }],
      onAction: (action: string, recordId: string) => {
        if (action === 'edit') {
          handleOpenEditor(recordId, 'display');
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

      <PolicyCreationModal
        isOpen={editorOpened}
        onClose={() => {
          closeEditor();
          setEditingPolicy(null);
          setEditingAssociationId(null);
        }}
        onPolicyCreated={() => {
          closeEditor();
          setEditingPolicy(null);
          setEditingAssociationId(null);
        }}
        simulationIndex={0}
        reportYear={CURRENT_YEAR}
        initialPolicy={editingPolicy ?? undefined}
        initialEditorMode={editorMode}
        initialAssociationId={editingAssociationId ?? undefined}
      />
    </>
  );
}
