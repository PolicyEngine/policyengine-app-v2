import { Policy } from '@/types/ingredients/Policy';
import { UserPolicy } from '@/types/ingredients/UserPolicy';
import { PolicyColumn } from '@/utils/policyTableHelpers';

export const MOCK_POLICY_BASELINE: Policy = {
  id: 'policy-1',
  countryId: 'us',
  label: 'Current Law',
  apiVersion: '1.0.0',
  parameters: [],
};

export const MOCK_POLICY_REFORM: Policy = {
  id: 'policy-2',
  countryId: 'us',
  label: 'Reform Policy',
  apiVersion: '1.0.0',
  parameters: [],
};

export const MOCK_USER_POLICY_BASELINE: UserPolicy = {
  id: 'user-policy-1',
  userId: 'user-123',
  policyId: 'policy-1',
  countryId: 'us',
  label: 'My Baseline',
  createdAt: '2024-01-01T00:00:00Z',
};

export const MOCK_USER_POLICY_REFORM: UserPolicy = {
  id: 'user-policy-2',
  userId: 'user-123',
  policyId: 'policy-2',
  countryId: 'us',
  label: 'My Reform',
  createdAt: '2024-01-01T00:00:00Z',
};

export const MOCK_POLICY_COLUMNS: PolicyColumn[] = [
  {
    label: 'Baseline',
    policies: [MOCK_POLICY_BASELINE],
    policyLabels: ['Current Law'],
  },
  {
    label: 'Reform',
    policies: [MOCK_POLICY_REFORM],
    policyLabels: ['Reform Policy'],
  },
];

export const MOCK_POLICY_COLUMNS_MERGED: PolicyColumn[] = [
  {
    label: 'Baseline / Reform',
    policies: [MOCK_POLICY_BASELINE, MOCK_POLICY_BASELINE],
    policyLabels: ['Current Law'],
  },
];
