import { render, screen } from '@test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import SPMGeographyChoice from '@/components/household/SPMGeographyChoice';
import { Household } from '@/models/Household';
import { clearMetadata } from '@/reducers/metadataReducer';
import { store } from '@/store';
import {
  modelCatalogEnvelope,
  US_MODEL_CATALOG_WITH_SPM,
} from '@/tests/fixtures/api/publicApi/modelCatalogMocks';
import {
  jsonResponse,
  stubPublicApiFetch,
} from '@/tests/fixtures/api/publicApi/publicApiFetchStub';
import { seedV2ModelCatalog } from '@/tests/fixtures/hooks/v3MetadataWrapper';

const YEAR = '2026';
const US_HOUSEHOLD = Household.starter('us', YEAR);
const SPM_GEOGRAPHY_CHOICE = { name: 'Supplemental Poverty Measure geography' };

function renderChoice() {
  return render(
    <SPMGeographyChoice
      household={US_HOUSEHOLD}
      year={YEAR}
      metadata={store.getState().metadata}
      onChange={() => {}}
    />
  );
}

describe('SPMGeographyChoice with the model metadata from the v2 routes', () => {
  afterEach(() => {
    store.dispatch(clearMetadata());
    vi.unstubAllGlobals();
  });

  describe('given a catalog version that offers SPM settings', () => {
    beforeEach(async () => {
      stubPublicApiFetch({
        '/v2/model-catalog': () => jsonResponse(modelCatalogEnvelope(US_MODEL_CATALOG_WITH_SPM)),
      });
      await seedV2ModelCatalog();
    });

    test('then the US household builder offers the SPM geography choice', () => {
      // When
      renderChoice();

      // Then
      expect(screen.getByRole('combobox', SPM_GEOGRAPHY_CHOICE)).toBeEnabled();
    });
  });

  describe('given a catalog version without SPM settings', () => {
    beforeEach(async () => {
      stubPublicApiFetch();
      await seedV2ModelCatalog();
    });

    test('then no SPM geography choice is offered', () => {
      // When
      renderChoice();

      // Then
      expect(screen.queryByRole('combobox', SPM_GEOGRAPHY_CHOICE)).not.toBeInTheDocument();
    });
  });
});
