import { describe, expect, test } from 'vitest';
import type { UserPolicyCreateBody } from '@/types/v2User';

const V2_POLICY_ID = 'a1b2c3d4-0000-4000-8000-000000000001';
const V1_POLICY_ID = 95762;

describe('UserPolicyCreateBody', () => {
  // Checked by `bun run typecheck`: each body below compiles only if the
  // type requires a row to name a policy, as the API does.
  test('given a saved reform row then it names a v2 policy, a v1 policy or both', () => {
    // @ts-expect-error A row must name policy_id or legacy_policy_id.
    const withoutPolicy: UserPolicyCreateBody = { country_id: 'us' };
    const onV2Policy: UserPolicyCreateBody = { country_id: 'us', policy_id: V2_POLICY_ID };
    const onV1Policy: UserPolicyCreateBody = { country_id: 'us', legacy_policy_id: V1_POLICY_ID };
    const onLinkedPolicies: UserPolicyCreateBody = {
      country_id: 'us',
      policy_id: V2_POLICY_ID,
      legacy_policy_id: V1_POLICY_ID,
    };

    expect([withoutPolicy, onV2Policy, onV1Policy, onLinkedPolicies]).toHaveLength(4);
  });
});
