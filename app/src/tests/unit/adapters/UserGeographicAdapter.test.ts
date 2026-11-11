import { describe, expect, test } from 'vitest';
import { UserGeographicAdapter } from '@/adapters/UserGeographicAdapter';
import {
  LEGACY_NORTHERN_IRELAND_REGION_CODE,
  NORTHERN_IRELAND_LABEL,
  NORTHERN_IRELAND_REGION_CODE,
} from '@/tests/fixtures/models/regionMocks';

describe('UserGeographicAdapter', () => {
  test('given a saved geography for country/ni then it reads country/northern_ireland', () => {
    // Given
    const savedGeography = {
      user_id: 'user-123',
      geography_id: LEGACY_NORTHERN_IRELAND_REGION_CODE,
      country_id: 'uk',
      label: NORTHERN_IRELAND_LABEL,
      scope: 'subnational',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    };

    // When
    const geography = UserGeographicAdapter.fromApiResponse(savedGeography);

    // Then
    expect(geography.geographyId).toBe(NORTHERN_IRELAND_REGION_CODE);
    expect(geography.id).toBe(NORTHERN_IRELAND_REGION_CODE);
  });
});
