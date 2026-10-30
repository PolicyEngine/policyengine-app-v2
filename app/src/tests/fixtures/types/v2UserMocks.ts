import type * as V2User from '@/types/v2User';

/**
 * No country the app offers lacks account storage. Setting
 * `withoutAccountStorage` makes `isAssociationCountry` answer false, standing
 * in for such a country so its branches stay covered. Reset it after each
 * test.
 */
export const accountStorage = { withoutAccountStorage: false };

/**
 * The `@/types/v2User` module with `isAssociationCountry` switched by
 * `accountStorage`. Use it from a test file's `vi.mock` factory:
 * `vi.mock('@/types/v2User', async (importOriginal) => (await import(
 * '@/tests/fixtures/types/v2UserMocks')).withSwitchableAccountStorage(await
 * importOriginal()))`.
 */
export function withSwitchableAccountStorage(actual: typeof V2User): typeof V2User {
  return {
    ...actual,
    isAssociationCountry: ((countryId: unknown) =>
      !accountStorage.withoutAccountStorage &&
      actual.isAssociationCountry(countryId)) as typeof actual.isAssociationCountry,
  };
}
