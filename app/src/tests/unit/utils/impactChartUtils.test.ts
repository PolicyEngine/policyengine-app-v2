import { afterEach, describe, expect, test } from 'vitest';
import {
  CURRENT_UK_METADATA_REGIONS,
  LEGACY_NORTHERN_IRELAND_REGION_CODE,
  NORTHERN_IRELAND_LABEL,
  NORTHERN_IRELAND_REGION_CODE,
} from '@/tests/fixtures/models/regionMocks';
import { regionName } from '@/utils/impactChartUtils';

const UK_METADATA = { economyOptions: { region: CURRENT_UK_METADATA_REGIONS } };

function openPageWithRegion(regionCode: string) {
  window.history.pushState(
    {},
    '',
    `/uk/report-output/1?${new URLSearchParams({ region: regionCode })}`
  );
}

describe('regionName', () => {
  afterEach(() => {
    window.history.pushState({}, '', '/');
  });

  test.each([LEGACY_NORTHERN_IRELAND_REGION_CODE, NORTHERN_IRELAND_REGION_CODE])(
    'given the region query parameter %s then the chart title names Northern Ireland',
    (regionCode) => {
      // Given
      openPageWithRegion(regionCode);

      // When
      const name = regionName(UK_METADATA);

      // Then
      expect(name).toBe(NORTHERN_IRELAND_LABEL);
    }
  );

  test('given the whole UK then the chart title names no region', () => {
    // Given
    openPageWithRegion('uk');

    // When
    const name = regionName(UK_METADATA);

    // Then
    expect(name).toBeUndefined();
  });
});
