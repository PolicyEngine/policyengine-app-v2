import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { useV1Migration } from '@/hooks/useV1Migration';

// Mock dependencies
vi.mock('@/hooks/useUserId', () => ({
  useUserId: () => 'test-user-123',
}));

const mockMigrate = vi.fn().mockResolvedValue(true);
const mockIsMigrationComplete = vi.fn().mockReturnValue(false);
const mockHasLocalStorageData = vi.fn().mockReturnValue(true);

vi.mock('@/libs/v1Migration', () => ({
  isMigrationComplete: () => mockIsMigrationComplete(),
  hasLocalStorageData: () => mockHasLocalStorageData(),
  migrateV1AssociationsToV2: (...args: any[]) => mockMigrate(...args),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useV1Migration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsMigrationComplete.mockReturnValue(false);
    mockHasLocalStorageData.mockReturnValue(true);
    mockMigrate.mockResolvedValue(true);
  });

  test('given migration already complete then does not call migrate', async () => {
    mockIsMigrationComplete.mockReturnValue(true);

    renderHook(() => useV1Migration(), { wrapper: createWrapper() });

    // Allow effect to run
    await waitFor(() => {
      expect(mockMigrate).not.toHaveBeenCalled();
    });
  });

  test('given no localStorage data then does not call migrate', async () => {
    mockHasLocalStorageData.mockReturnValue(false);

    renderHook(() => useV1Migration(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(mockMigrate).not.toHaveBeenCalled();
    });
  });

  test('given localStorage data then triggers migration with user ID', async () => {
    renderHook(() => useV1Migration(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(mockMigrate).toHaveBeenCalledWith('test-user-123');
    });
  });

  test('given migration fails then does not throw', async () => {
    mockMigrate.mockRejectedValue(new Error('Network failure'));

    // Should not throw
    renderHook(() => useV1Migration(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(mockMigrate).toHaveBeenCalled();
    });
  });
});
