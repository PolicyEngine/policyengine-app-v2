import { describe, expect, test } from 'vitest';
import { UserPolicyAdapter } from '@/adapters/UserPolicyAdapter';
import {
  ASSOCIATION_IDS,
  LEGACY_IDS,
  PE_USER_ID,
  policyItem,
  TIMESTAMPS,
} from '@/tests/fixtures/api/v2UserMocks';

describe('UserPolicyAdapter', () => {
  test('given a policy association then the creation payload carries the numeric v1 id and no user id', () => {
    // When
    const payload = UserPolicyAdapter.toCreationPayload(
      { policyId: String(LEGACY_IDS.POLICY), label: 'My reform' },
      'uk'
    );

    // Then
    expect(payload).toEqual({
      country_id: 'uk',
      legacy_policy_id: LEGACY_IDS.POLICY,
      name: 'My reform',
    });
  });

  test('given no label then the creation payload omits the name', () => {
    // When
    const payload = UserPolicyAdapter.toCreationPayload({ policyId: '12' }, 'us');

    // Then
    expect(payload).toEqual({ country_id: 'us', legacy_policy_id: 12 });
  });

  test('given a non-numeric policy id then building the payload throws', () => {
    expect(() => UserPolicyAdapter.toCreationPayload({ policyId: 'policy-789' }, 'us')).toThrow();
  });

  test('given updates then only supplied fields are patched', () => {
    expect(UserPolicyAdapter.toUpdatePayload({ label: 'Renamed' })).toEqual({ name: 'Renamed' });
    expect(UserPolicyAdapter.toUpdatePayload({ policyId: '7' })).toEqual({ legacy_policy_id: 7 });
    expect(UserPolicyAdapter.toUpdatePayload({ label: '' })).toEqual({ name: null });
    expect(UserPolicyAdapter.toUpdatePayload({})).toEqual({});
  });

  test('given an API item then it maps to a UserPolicy with the UUID as id', () => {
    // When
    const policy = UserPolicyAdapter.fromApiItem(policyItem({ name: 'My reform' }));

    // Then
    expect(policy).toEqual({
      id: ASSOCIATION_IDS.POLICY,
      userId: PE_USER_ID,
      policyId: String(LEGACY_IDS.POLICY),
      countryId: 'us',
      label: 'My reform',
      createdAt: TIMESTAMPS.CREATED,
      updatedAt: TIMESTAMPS.UPDATED,
      isCreated: true,
    });
  });

  test('given an item without a name then the label is undefined', () => {
    expect(UserPolicyAdapter.fromApiItem(policyItem()).label).toBeUndefined();
  });

  test('given a v2-only row then it has no legacy policy', () => {
    expect(UserPolicyAdapter.hasLegacyPolicy(policyItem({ legacy_policy_id: null }))).toBe(false);
    expect(UserPolicyAdapter.hasLegacyPolicy(policyItem())).toBe(true);
  });
});
