import { useQueryNormalizer } from '@normy/react-query';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  useAllEntities,
  useManualNormalization,
  useNormalizedData,
  useSearchEntities,
} from './utils/normalizedUtils';

/**
 * Example hook demonstrating how to use @normy/react-query for
 * automatic normalization of ingredient data
 *
 * @normy/react-query automatically normalizes any objects with an 'id' field,
 * making them available across all queries without manual data management
 */

interface Ingredient {
  id: string;
  name: string;
  category: string;
  userId: string;
  createdAt: string;
  updatedAt?: string;
}

interface UserIngredient {
  id: string;
  userId: string;
  ingredientId: string;
  label?: string;
  ingredient?: Ingredient;
}

/**
 * Hook to fetch user ingredients
 * Data is automatically normalized by @normy/react-query
 */
export const useUserIngredients = (userId: string) => {
  return useQuery({
    queryKey: ['userIngredients', userId],
    queryFn: async () => {
      // Mock API call - replace with actual API
      const response = await fetch(`/api/users/${userId}/ingredients`);
      return response.json() as Promise<UserIngredient[]>;
    },
  });
};

/**
 * Hook to get a specific ingredient by ID from normalized store
 */
export const useIngredientById = (ingredientId: string) => {
  // This will return the ingredient from the normalized store
  // regardless of which query originally fetched it
  return useNormalizedData<Ingredient>('ingredients', ingredientId);
};

/**
 * Hook to get all ingredients from normalized store
 */
export const useAllIngredients = () => {
  return useAllEntities<Ingredient>('ingredients');
};

/**
 * Hook to search ingredients by name
 */
export const useSearchIngredients = (searchTerm: string) => {
  return useSearchEntities<Ingredient>('ingredients', 'name', searchTerm);
};

/**
 * Hook to create a new user ingredient association
 * The new data will be automatically normalized
 */
export const useCreateUserIngredient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<UserIngredient, 'id'>) => {
      // Mock API call - replace with actual API
      const response = await fetch('/api/user-ingredients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.json() as Promise<UserIngredient>;
    },
    onSuccess: (newIngredient) => {
      // The new ingredient is automatically normalized
      // Just invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: ['userIngredients', newIngredient.userId],
      });
    },
  });
};

/**
 * Hook to update an ingredient
 * Demonstrates manual normalization update
 */
export const useUpdateIngredient = () => {
  const { updateEntity } = useManualNormalization();

  return useMutation({
    mutationFn: async (ingredient: Ingredient) => {
      // Mock API call - replace with actual API
      const response = await fetch(`/api/ingredients/${ingredient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ingredient),
      });
      return response.json() as Promise<Ingredient>;
    },
    onSuccess: (updatedIngredient) => {
      // Manually update the normalized store
      // This will update the ingredient across all queries that reference it
      updateEntity('ingredients', updatedIngredient);
    },
  });
};

/**
 * Example of accessing normalized data directly
 */
export const useIngredientStats = () => {
  const queryNormalizer = useQueryNormalizer();

  // Get all ingredients from normalized store
  const ingredients = queryNormalizer.getNormalizedData('ingredients');

  if (!ingredients) {
    return { totalIngredients: 0, categories: [] };
  }

  const allIngredients = Object.values(ingredients) as Ingredient[];
  const categories = [...new Set(allIngredients.map((i) => i.category))];

  return {
    totalIngredients: allIngredients.length,
    categories,
  };
};
