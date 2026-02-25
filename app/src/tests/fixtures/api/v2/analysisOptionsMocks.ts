import { vi } from 'vitest';
import type { ModuleOption } from '@/api/v2/analysisOptions';

export const mockModuleOption = (overrides?: Partial<ModuleOption>): ModuleOption => ({
  name: 'decile_impacts',
  label: 'Decile impacts',
  description: 'Income changes by decile',
  response_fields: ['decile_impacts'],
  ...overrides,
});

export const mockModuleOptionList = (): ModuleOption[] => [
  mockModuleOption(),
  mockModuleOption({
    name: 'poverty',
    label: 'Poverty',
    description: 'Poverty rate changes',
    response_fields: ['poverty'],
  }),
  mockModuleOption({
    name: 'inequality',
    label: 'Inequality',
    description: 'Inequality metric changes',
    response_fields: ['inequality'],
  }),
];

export const mockSuccessResponse = (data: any) => ({
  ok: true,
  status: 200,
  json: vi.fn().mockResolvedValue(data),
  text: vi.fn().mockResolvedValue(JSON.stringify(data)),
});

export const mockErrorResponse = (status: number, errorText = 'Server error') => ({
  ok: false,
  status,
  json: vi.fn().mockRejectedValue(new Error('Not JSON')),
  text: vi.fn().mockResolvedValue(errorText),
});

export const ANALYSIS_OPTIONS_ERROR_MESSAGES = {
  FETCH_FAILED: (status: number, text: string) =>
    `Failed to fetch analysis options: ${status} ${text}`,
} as const;
