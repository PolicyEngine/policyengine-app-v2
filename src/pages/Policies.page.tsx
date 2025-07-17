import IngredientReadView from '@/components/IngredientReadView';
import { usePolicies } from '@/hooks/usePolicies'; 
import { useCreatePolicy } from '@/hooks/useCreatePolicy'; // optional, for mutation

export default function PoliciesPage() {
  const { data, isLoading, isError, error } = usePolicies();
  const { mutate: createPolicy } = useCreatePolicy();

  const handleCreate = () => {
    createPolicy({ /* draft payload here */ });
  };

  const columns = [
    { key: 'id', header: 'ID' },
    { key: 'label', header: 'Label' },
    { key: 'country_id', header: 'Country' },
    { key: 'api_version', header: 'API Version' },
  ];

  return (
    <IngredientReadView
      title="Policies"
      onCreate={handleCreate}
      isLoading={isLoading}
      isError={isError}
      error={error}
      data={data || []}
      columns={columns}
    />
  );
}
