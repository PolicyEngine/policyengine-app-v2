/**
 * Test fixtures for VariableRow component
 * Re-exports common mocks from variableInputMocks and adds row-specific fixtures
 */

import { vi } from 'vitest';

// Re-export shared mocks
export {
  MOCK_FLOAT_VARIABLE,
  MOCK_INT_VARIABLE,
  MOCK_BOOL_VARIABLE,
  MOCK_ENUM_VARIABLE,
  MOCK_INPUT_METADATA,
  MOCK_INPUT_HOUSEHOLD,
  createMockOnChange,
} from './variableInputMocks';

// Helper to create mock onRemove handler
export const createMockOnRemove = () => vi.fn();
