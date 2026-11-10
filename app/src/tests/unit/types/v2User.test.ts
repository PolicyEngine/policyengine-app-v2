// @vitest-environment node
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import { isUserType, USER_TYPES, userTypeMeetsMinimum } from '@/types/v2User';

const OPENAPI_DOCUMENT_PATH = fileURLToPath(
  new URL('../../../api/publicApi/openapi.json', import.meta.url)
);

describe('USER_TYPES', () => {
  test('given the Public API document then the app lists its user types in the same order', async () => {
    // Given
    const openapiDocument = JSON.parse(await readFile(OPENAPI_DOCUMENT_PATH, 'utf8'));

    // When
    const documentUserTypes = openapiDocument.components.schemas.MeItem.properties.user_type.enum;

    // Then
    expect(USER_TYPES).toEqual(documentUserTypes);
  });
});

describe('isUserType', () => {
  test.each(['unauthenticated', 'standard', 'author', 'admin'])(
    'given the %s type then it is a user type',
    (userType) => {
      expect(isUserType(userType)).toBe(true);
    }
  );

  test.each(['owner', 'Admin', '', null, undefined, 3])(
    'given %j then it is not a user type',
    (value) => {
      expect(isUserType(value)).toBe(false);
    }
  );
});

describe('userTypeMeetsMinimum', () => {
  test.each([
    ['unauthenticated', 'unauthenticated'],
    ['standard', 'unauthenticated'],
    ['standard', 'standard'],
    ['author', 'unauthenticated'],
    ['author', 'standard'],
    ['author', 'author'],
    ['admin', 'unauthenticated'],
    ['admin', 'standard'],
    ['admin', 'author'],
    ['admin', 'admin'],
  ] as const)(
    'given the %s type and the %s minimum then the type meets it',
    (userType, minimum) => {
      expect(userTypeMeetsMinimum(userType, minimum)).toBe(true);
    }
  );

  test.each([
    ['unauthenticated', 'standard'],
    ['unauthenticated', 'author'],
    ['unauthenticated', 'admin'],
    ['standard', 'author'],
    ['standard', 'admin'],
    ['author', 'admin'],
  ] as const)(
    'given the %s type and the %s minimum then the type does not meet it',
    (userType, minimum) => {
      expect(userTypeMeetsMinimum(userType, minimum)).toBe(false);
    }
  );
});
