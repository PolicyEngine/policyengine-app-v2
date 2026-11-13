import { describe, expect, test } from 'vitest';
import {
  ALLOWED_OPERATIONS,
  CACHE_CONTROL,
  matchAllowedOperation,
} from '@/libs/publicApiRoute/allowList';

const SAVED_RECORD_ID = '3f2c8b62-4a43-4d4f-9a5c-0d1b8ad8b7e1';

// Every operation the calculator sends to the Public API, by the module
// that sends it (app/src/api/), with the allow-list entry that covers it.
const CALCULATOR_OPERATIONS: ReadonlyArray<[string, string, string]> = [
  ['GET', '/us/metadata', 'metadata'],
  ['GET', '/uk/metadata', 'metadata'],
  ['POST', '/us/household', 'household creation'],
  ['GET', '/us/household/12345', 'household'],
  ['GET', '/uk/household/12345/policy/2', 'household under a policy'],
  ['POST', '/us/calculate-full', 'household calculation with variations'],
  ['POST', '/us/policy', 'policy creation'],
  ['GET', '/us/policy/98765', 'policy'],
  ['POST', '/us/simulation', 'simulation creation and update'],
  ['PATCH', '/us/simulation', 'simulation creation and update'],
  ['GET', '/us/simulation/4321', 'simulation'],
  ['POST', '/uk/report', 'report creation and update'],
  ['PATCH', '/uk/report', 'report creation and update'],
  ['GET', '/uk/report/777', 'report'],
  ['GET', '/us/economy/98765/over/2', 'economy comparison'],
  ['DELETE', '/us/economy/98765/over/2', 'economy comparison'],
  ['GET', '/us/economy/98765/over/2/budget-window', 'budget-window economy comparison'],
  ['GET', '/v2/model-catalog', 'model catalog'],
  ['GET', '/v2/model-catalog/parameters', 'catalog parameters'],
  ['GET', '/v2/model-catalog/variables', 'catalog variables'],
  ['GET', '/v2/parameters/children', 'parameter children'],
  ['GET', '/v2/parameters/search-file', 'parameter search file'],
  ['POST', '/v2/policies', 'v2 policy creation'],
  ['GET', `/v2/policies/${SAVED_RECORD_ID}`, 'v2 policy'],
  ['GET', '/v2/me', 'account'],
  ['DELETE', '/v2/me', 'account'],
  ['GET', '/v2/me/export', 'account export'],
  ['POST', '/v2/me/upgrade', 'account upgrade'],
  ['GET', `/v2/shared-reports/${SAVED_RECORD_ID}`, 'shared report'],
  ['GET', '/v2/user-policies', 'saved policies'],
  ['POST', '/v2/user-policies', 'saved policies'],
  ['GET', `/v2/user-policies/${SAVED_RECORD_ID}`, 'saved policy'],
  ['PATCH', `/v2/user-policies/${SAVED_RECORD_ID}`, 'saved policy'],
  ['DELETE', `/v2/user-policies/${SAVED_RECORD_ID}`, 'saved policy'],
  ['GET', '/v2/user-reports', 'saved reports'],
  ['POST', '/v2/user-reports', 'saved reports'],
  ['GET', `/v2/user-reports/${SAVED_RECORD_ID}`, 'saved report'],
  ['PATCH', `/v2/user-reports/${SAVED_RECORD_ID}`, 'saved report'],
  ['GET', '/v2/user-households', 'saved households'],
  ['POST', '/v2/user-households', 'saved households'],
  ['GET', '/v2/admin/users', 'admin users'],
  ['GET', `/v2/admin/users/${SAVED_RECORD_ID}`, 'admin user'],
  ['PATCH', `/v2/admin/users/${SAVED_RECORD_ID}`, 'admin user'],
  ['GET', `/v2/admin/users/${SAVED_RECORD_ID}/user-type-changes`, 'admin user type changes'],
];

// Requests the calculator never sends, many of them neighbours of ones it
// does: each must find no operation.
const REFUSED_REQUESTS: ReadonlyArray<[string, string]> = [
  ['POST', '/us/calculate'],
  ['GET', '/deployment'],
  ['GET', '/simulation-gateway-check'],
  ['GET', '/health'],
  ['GET', '/'],
  ['GET', '/fr/metadata'],
  ['GET', '/US/metadata'],
  ['POST', '/us/metadata'],
  ['GET', '/us/household'],
  ['GET', '/us/household/not-a-number'],
  ['GET', '/us/policy'],
  ['DELETE', '/us/policy/98765'],
  ['PUT', '/us/report'],
  ['DELETE', '/us/report/777'],
  ['GET', '/us/economy/98765/over/2/extra'],
  ['DELETE', '/us/economy/98765/over/2/budget-window'],
  ['GET', '/v2/economy-options'],
  ['GET', '/v2/variables'],
  ['GET', '/v2/parameters'],
  ['GET', '/v2/policies'],
  ['GET', '/v2/user-simulations'],
  ['PATCH', '/v2/me'],
  ['DELETE', `/v2/user-reports/${SAVED_RECORD_ID}`],
  ['GET', `/v2/user-households/${SAVED_RECORD_ID}`],
  ['GET', '/v2/shared-reports/not-a-uuid'],
  ['GET', '/v2/user-policies/'],
  ['GET', '/us/metadata/'],
  ['GET', '/us%2Fmetadata'],
  ['GET', '/v2/model-catalog?country_id=us'],
  ['POST', '/v2/admin/users'],
  ['DELETE', `/v2/admin/users/${SAVED_RECORD_ID}`],
  ['GET', `/v2/admin/users/${SAVED_RECORD_ID}/saved-items`],
  ['GET', '/v2/admin/users/not-a-uuid'],
  ['PATCH', `/v2/admin/users/${SAVED_RECORD_ID}/user-type-changes`],
];

describe('matchAllowedOperation', () => {
  test.each(CALCULATOR_OPERATIONS)(
    'given %s %s, which the calculator sends, then it matches the %s operation',
    (method, path, operationName) => {
      // When
      const operation = matchAllowedOperation(method, path);

      // Then
      expect(operation?.name).toBe(operationName);
    }
  );

  test.each(REFUSED_REQUESTS)(
    'given %s %s, which the calculator never sends, then it matches nothing',
    (method, path) => {
      // When
      const operation = matchAllowedOperation(method, path);

      // Then
      expect(operation).toBeNull();
    }
  );

  test('given every method of every operation then the calculator sends it', () => {
    // Then
    const allowedPairs = ALLOWED_OPERATIONS.flatMap((operation) =>
      operation.methods.map((method) => `${method} ${operation.name}`)
    );
    const sentPairs = new Set(
      CALCULATOR_OPERATIONS.map(([method, , operationName]) => `${method} ${operationName}`)
    );
    expect(allowedPairs.sort()).toEqual([...sentPairs].sort());
  });

  test('given every operation then it is one the calculator sends', () => {
    // Then
    const usedNames = new Set(CALCULATOR_OPERATIONS.map(([, , operationName]) => operationName));
    expect(ALLOWED_OPERATIONS.map((operation) => operation.name).sort()).toEqual(
      [...usedNames].sort()
    );
  });
});

describe('CACHE_CONTROL', () => {
  test('given a saved record, a calculation or an economy comparison then no cache may keep it', () => {
    // When
    const cachedNames = ALLOWED_OPERATIONS.filter(
      (operation) => CACHE_CONTROL[operation.cache] !== undefined
    ).map((operation) => operation.name);

    // Then
    expect(cachedNames.sort()).toEqual(
      [
        'catalog parameters',
        'catalog variables',
        'metadata',
        'model catalog',
        'parameter children',
        'parameter search file',
      ].sort()
    );
  });
});
