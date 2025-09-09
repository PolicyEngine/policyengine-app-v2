import { vi } from 'vitest';

// Mock functions
export const mockResetIngredientFn = vi.fn();
export const mockResetIngredientsFn = vi.fn();

// Default mock return value
export const DEFAULT_USE_INGREDIENT_RESET_RETURN = {
  resetIngredient: mockResetIngredientFn,
  resetIngredients: mockResetIngredientsFn,
};
