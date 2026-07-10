import type { ExecutionReceipt } from '@/types/calculation';

export const MOCK_EXECUTION_HASH = 'a'.repeat(64);

export const mockExecutionReceipt = (): ExecutionReceipt => ({
  schema_version: 1,
  requested: {
    engine: 'policyengine',
    model: 'latest',
    numeric_mode: 'numpy-native',
  },
  resolved: {
    runtime: {
      name: 'policyengine',
      version: '4.20.3',
      git_sha: null,
      artifact: null,
    },
    numeric_mode: 'numpy-native',
    model: {
      actual: {
        name: 'policyengine-us',
        version: '1.768.3',
      },
      certified: {
        name: 'policyengine-us',
        version: '1.768.3',
      },
    },
    data: null,
    ruleset_artifact: null,
    population_artifact: null,
    certified_release: null,
    bundle_trace: null,
  },
  run_id: 'run-123',
  created_at: '2026-07-09T20:00:00Z',
  request_sha256: MOCK_EXECUTION_HASH,
  result_sha256: MOCK_EXECUTION_HASH,
});
