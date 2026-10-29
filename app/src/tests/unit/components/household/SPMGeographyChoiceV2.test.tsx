import { render, screen } from '@test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import SPMGeographyChoice from '@/components/household/SPMGeographyChoice';
import { Household } from '@/models/Household';
import { clearMetadata } from '@/reducers/metadataReducer';
import { store } from '@/store';
import {
  modelCatalogEnvelope,
  US_MODEL_CATALOG_RESULT,
} from '@/tests/fixtures/api/publicApi/modelCatalogMocks';
import {
  jsonResponse,
  stubPublicApiFetch,
} from '@/tests/fixtures/api/publicApi/publicApiFetchStub';
import { seedV2ModelCatalog } from '@/tests/fixtures/hooks/v3MetadataWrapper';

const YEAR = '2026';
const US_HOUSEHOLD = Household.starter('us', YEAR);

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
      stubPublicApiFetch();
      await seedV2ModelCatalog();
    });

    test('then the US household builder offers the SPM geography choice', () => {
      renderChoice();

      expect(
        screen.getByRole('combobox', { name: 'Supplemental Poverty Measure geography' })
      ).toBeEnabled();
    });
  });

  describe('given a catalog version without SPM settings', () => {
    beforeEach(async () => {
      stubPublicApiFetch({
        '/v2/model-catalog': () =>
          jsonResponse(
            modelCatalogEnvelope({
              ...US_MODEL_CATALOG_RESULT,
              spm: { available: false, settings_schema: null, defaults: null },
            })
          ),
      });
      await seedV2ModelCatalog();
    });

    test('then no SPM geography choice is offered', () => {
      renderChoice();

      expect(
        screen.queryByRole('combobox', { name: 'Supplemental Poverty Measure geography' })
      ).not.toBeInTheDocument();
    });
  });
});
