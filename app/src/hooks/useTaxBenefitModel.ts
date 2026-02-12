import { useQuery } from '@tanstack/react-query';
import { fetchTaxBenefitModels, getModelName, TaxBenefitModel } from '@/api/v2/taxBenefitModels';

/**
 * Hook to get the TaxBenefitModel ID for a country
 */
export function useTaxBenefitModelId(countryId: string) {
  const modelName = getModelName(countryId);

  const query = useQuery({
    queryKey: ['taxBenefitModels'],
    queryFn: fetchTaxBenefitModels,
    staleTime: 1000 * 60 * 60, // 1 hour - models don't change often
    select: (models: TaxBenefitModel[]) => {
      const model = models.find((m) => m.name === modelName);
      return model?.id ?? null;
    },
  });

  return {
    taxBenefitModelId: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
  };
}
