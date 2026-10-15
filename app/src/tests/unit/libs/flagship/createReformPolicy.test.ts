import { beforeEach, describe, expect, test, vi } from 'vitest';
import { createReformPolicy } from '@/libs/flagship/runReport';
import type { ParameterMetadataCollection } from '@/types/metadata/parameterMetadata';

const mockCreatePolicy = vi.fn();
vi.mock('@/api/policy', () => ({
  createPolicy: (...args: unknown[]) => mockCreatePolicy(...args),
}));

const PARAMETERS = {
  'gov.irs.credits.ctc.amount.base[0].amount': {
    type: 'parameter',
    unit: 'currency-USD',
    values: { '2025-01-01': 2200 },
  },
  'gov.irs.credits.ctc.phase_out.threshold.JOINT': {
    type: 'parameter',
    unit: 'currency-USD',
    values: { '2025-01-01': 400000 },
  },
  'gov.usda.snap.emergency_allotment.allowed': {
    type: 'parameter',
    unit: 'bool',
    values: { '2020-01-01': false },
  },
} as unknown as ParameterMetadataCollection;

const sentData = () => mockCreatePolicy.mock.calls[0][1].data;

describe('createReformPolicy', () => {
  beforeEach(() => {
    mockCreatePolicy.mockReset();
    mockCreatePolicy.mockResolvedValue({ result: { policy_id: 7 } });
  });

  test('given numeric text and infinity then they are sent as v2 sends them', async () => {
    await createReformPolicy(
      'us',
      'CTC',
      [
        {
          path: 'gov.irs.credits.ctc.amount.base[0].amount',
          value: '3000',
          intervals: [{ startDate: '2026-01-01', endDate: '2100-12-31', value: '3000' }],
        },
        {
          path: 'gov.irs.credits.ctc.phase_out.threshold.JOINT',
          value: Infinity,
          intervals: [{ startDate: '2026-01-01', endDate: '2100-12-31', value: Infinity }],
        },
      ],
      PARAMETERS
    );

    expect(sentData()).toEqual({
      'gov.irs.credits.ctc.amount.base[0].amount': { '2026-01-01.2100-12-31': 3000 },
      'gov.irs.credits.ctc.phase_out.threshold.JOINT': { '2026-01-01.2100-12-31': 'Infinity' },
    });
  });

  test('given a value of the wrong kind then the policy is not created', async () => {
    await expect(
      createReformPolicy(
        'us',
        'SNAP',
        [
          {
            path: 'gov.usda.snap.emergency_allotment.allowed',
            value: 'maybe',
            intervals: [{ startDate: '2026-01-01', endDate: '2100-12-31', value: 'maybe' }],
          },
        ],
        PARAMETERS
      )
    ).rejects.toThrow();
    expect(mockCreatePolicy).not.toHaveBeenCalled();
  });

  test("given a parameter the metadata lacks (a bill's switch) then its value is sent as it is", async () => {
    await createReformPolicy(
      'us',
      'Bill',
      [
        {
          path: 'gov.contrib.states.mt.hb1.in_effect',
          value: true,
          intervals: [{ startDate: '2026-01-01', endDate: '2100-12-31', value: true }],
        },
      ],
      PARAMETERS
    );

    expect(sentData()).toEqual({
      'gov.contrib.states.mt.hb1.in_effect': { '2026-01-01.2100-12-31': true },
    });
  });
});
