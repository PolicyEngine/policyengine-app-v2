import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ReformAdapter } from '@/adapters/ReformAdapter';
import { ApiReformStore, LocalStorageReformStore } from '@/api/reformStore';
import type { Reform } from '@/types/ingredients/Reform';
import type { ReformMetadata } from '@/types/metadata/reformMetadata';

// Mock fetch
global.fetch = vi.fn();

const mockReformInput: Omit<Reform, 'id' | 'createdAt' | 'updatedAt'> = {
  userId: 'user-123',
  countryId: 'us',
  label: 'CTC to $3,600 for children under 6',
  parameters: [
    {
      name: 'gov.irs.credits.ctc.amount.base[0]',
      values: [{ startDate: '2026-01-01', endDate: '2026-12-31', value: 3600 }],
    },
  ],
  baseline: 'current-law',
  provenance: { source: 'chat', ref: 'session-1', confidence: 'exact' },
};

const mockApiResponse: ReformMetadata = {
  id: 'rf-1',
  user_id: 'user-123',
  country_id: 'us',
  label: 'CTC to $3,600 for children under 6',
  policy_id: null,
  parameters: [
    {
      name: 'gov.irs.credits.ctc.amount.base[0]',
      values: [{ start_date: '2026-01-01', end_date: '2026-12-31', value: 3600 }],
    },
  ],
  baseline: 'current-law',
  provenance: { source: 'chat', ref: 'session-1', confidence: 'exact' },
  created_at: '2026-08-01T00:00:00Z',
  updated_at: '2026-08-01T00:00:00Z',
};

describe('ReformAdapter', () => {
  it('given a reform, when converted to a creation payload, then keys are snake_case', () => {
    const payload = ReformAdapter.toCreationPayload(mockReformInput);

    expect(payload.user_id).toBe('user-123');
    expect(payload.country_id).toBe('us');
    expect(payload.parameters[0].values[0]).toEqual({
      start_date: '2026-01-01',
      end_date: '2026-12-31',
      value: 3600,
    });
    expect(payload.provenance).toEqual({ source: 'chat', ref: 'session-1', confidence: 'exact' });
  });

  it('given an API response, when converted to a Reform, then keys are camelCase and ids are strings', () => {
    const reform = ReformAdapter.fromApiResponse(mockApiResponse);

    expect(reform.id).toBe('rf-1');
    expect(reform.userId).toBe('user-123');
    expect(reform.policyId).toBeUndefined();
    expect(reform.parameters[0].values[0]).toEqual({
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      value: 3600,
    });
    expect(reform.provenance.source).toBe('chat');
  });

  it('given partial updates, when converted to an update payload, then only provided fields are included', () => {
    const payload = ReformAdapter.toUpdatePayload({ label: 'Renamed' });

    expect(payload).toEqual({ label: 'Renamed' });
  });
});

describe('ApiReformStore', () => {
  let store: ApiReformStore;

  beforeEach(() => {
    store = new ApiReformStore();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('given a reform, when created, then POSTs snake_case payload and returns the parsed reform', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    });

    const result = await store.create(mockReformInput);

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/reforms',
      expect.objectContaining({ method: 'POST' })
    );
    const body = JSON.parse((global.fetch as any).mock.calls[0][1].body);
    expect(body.user_id).toBe('user-123');
    expect(result.id).toBe('rf-1');
  });

  it('given a user id and country, when finding by user, then passes both as query params', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [mockApiResponse],
    });

    const result = await store.findByUser('user-123', 'us');

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/reforms?user_id=user-123&country_id=us',
      expect.anything()
    );
    expect(result).toHaveLength(1);
    expect(result[0].userId).toBe('user-123');
  });

  it('given a missing reform, when finding by id, then returns null on 404', async () => {
    (global.fetch as any).mockResolvedValueOnce({ ok: false, status: 404 });

    const result = await store.findById('rf-missing');

    expect(result).toBeNull();
  });

  it('given a failing API, when creating, then throws', async () => {
    (global.fetch as any).mockResolvedValueOnce({ ok: false, status: 500 });

    await expect(store.create(mockReformInput)).rejects.toThrow('Failed to create reform');
  });

  it('given updates, when updating, then PATCHes and returns the parsed reform', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ...mockApiResponse, label: 'Renamed' }),
    });

    const result = await store.update('rf-1', { label: 'Renamed' });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/reforms/rf-1',
      expect.objectContaining({ method: 'PATCH' })
    );
    expect(result.label).toBe('Renamed');
  });

  it('given a reform id, when deleting, then issues DELETE', async () => {
    (global.fetch as any).mockResolvedValueOnce({ ok: true });

    await store.delete('rf-1');

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/reforms/rf-1',
      expect.objectContaining({ method: 'DELETE' })
    );
  });
});

describe('LocalStorageReformStore', () => {
  let store: LocalStorageReformStore;

  beforeEach(() => {
    store = new LocalStorageReformStore();
    localStorage.clear();
  });

  it('given a reform, when created, then it is retrievable by user and by id', async () => {
    const created = await store.create(mockReformInput);

    expect(created.id).toBeDefined();
    expect(created.createdAt).toBeDefined();

    const byUser = await store.findByUser('user-123', 'us');
    expect(byUser).toHaveLength(1);

    const byId = await store.findById(created.id!);
    expect(byId?.label).toBe('CTC to $3,600 for children under 6');
  });

  it('given reforms from two countries, when filtering by country, then only matches are returned', async () => {
    await store.create(mockReformInput);
    await store.create({ ...mockReformInput, countryId: 'uk' });

    const usOnly = await store.findByUser('user-123', 'us');
    expect(usOnly).toHaveLength(1);
    expect(usOnly[0].countryId).toBe('us');
  });

  it('given an existing reform, when updated, then fields change and updatedAt advances', async () => {
    const created = await store.create(mockReformInput);

    const updated = await store.update(created.id!, { label: 'Renamed' });

    expect(updated.label).toBe('Renamed');
    expect(updated.userId).toBe('user-123');
  });

  it('given a missing reform, when updated, then throws', async () => {
    await expect(store.update('rf-missing', { label: 'x' })).rejects.toThrow(
      'Failed to update reform'
    );
  });

  it('given an existing reform, when deleted, then it is no longer retrievable', async () => {
    const created = await store.create(mockReformInput);

    await store.delete(created.id!);

    expect(await store.findById(created.id!)).toBeNull();
  });
});
