import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent, waitFor } from '@test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { LocalStorageHouseholdStore } from '@/api/householdAssociation';
import { HouseholdCreationModal } from '@/pages/reportBuilder/modals/HouseholdCreationModal';
import HouseholdBuilderView from '@/pathways/report/views/population/HouseholdBuilderView';
import { SPM_YEAR_ERROR } from '@/tests/fixtures/spm/reportErrorMocks';
import { SPM_TEST_YEAR } from '@/tests/fixtures/spm/spmMocks';
import {
  reviewAssociation,
  reviewHousehold,
  reviewMetadata,
  spmSaveErrors,
} from '@/tests/fixtures/spm/spmReviewMocks';
import type { MetadataState } from '@/types/metadata';

let mockMetadata: MetadataState = reviewMetadata;

vi.mock('react-redux', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-redux')>()),
  useSelector: (selector: (state: any) => unknown) => selector({ metadata: mockMetadata }),
}));
vi.mock('@/hooks/useReportYear', () => ({ useReportYear: () => SPM_TEST_YEAR }));

const mockFetch = vi.fn();
const clients: QueryClient[] = [];
function renderBuilder(
  mode: 'create' | 'replace' | 'pathway' | 'pathway-create',
  onSaved = vi.fn()
) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  clients.push(client);
  const population = {
    type: 'household' as const,
    household: reviewHousehold,
    geography: null,
    label: reviewHousehold.label,
  };
  const builder = () => (
    <QueryClientProvider client={client}>
      {mode.startsWith('pathway') ? (
        <HouseholdBuilderView
          population={mode === 'pathway-create' ? { ...population, household: null } : population}
          countryId="us"
          onSubmitSuccess={onSaved}
        />
      ) : (
        <HouseholdCreationModal
          isOpen
          onClose={vi.fn()}
          onHouseholdSaved={onSaved}
          reportYear={SPM_TEST_YEAR}
          initialPopulation={population}
          initialEditorMode={mode === 'replace' ? 'edit' : 'create'}
        />
      )}
    </QueryClientProvider>
  );
  const rendered = render(builder());
  return { ...rendered, refreshMetadata: () => rendered.rerender(builder()) };
}

describe('Household SPM save errors through the real API and builder UI', () => {
  beforeEach(() => {
    mockMetadata = reviewMetadata;
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockReset();
    vi.spyOn(LocalStorageHouseholdStore.prototype, 'findById').mockResolvedValue(reviewAssociation);
    vi.spyOn(LocalStorageHouseholdStore.prototype, 'create').mockResolvedValue(reviewAssociation);
    vi.spyOn(LocalStorageHouseholdStore.prototype, 'update').mockResolvedValue(reviewAssociation);
  });

  test.each(['create', 'pathway'] as const)(
    'given model metadata changes in the %s builder then immediately disables save and preserves the draft through failure and recovery',
    async (mode) => {
      const { refreshMetadata } = renderBuilder(mode);
      const save = screen.getByRole('button', {
        name: mode === 'create' ? 'Create household' : 'Save household',
      });
      await waitFor(() => expect(save).toBeEnabled());
      for (const state of [
        { ...reviewMetadata, loading: true },
        { ...reviewMetadata, error: 'Metadata failed' },
        { ...reviewMetadata, currentCountry: 'uk' },
        { ...reviewMetadata, version: null, spm: undefined },
      ]) {
        mockMetadata = state;
        refreshMetadata();
        expect(save).toBeDisabled();
        expect(
          screen
            .getAllByRole('status')
            .some((element) => /model information/i.test(element.textContent ?? ''))
        ).toBe(true);
        await userEvent.click(save);
        expect(mockFetch).not.toHaveBeenCalled();
      }
      mockMetadata = reviewMetadata;
      refreshMetadata();
      await waitFor(() => expect(save).toBeEnabled());
      expect(screen.getByLabelText('Supplemental Poverty Measure geography')).toHaveValue(
        'national'
      );
    }
  );
  afterEach(() => {
    clients.splice(0).forEach((client) => client.clear());
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  test.each(['create', 'replace', 'pathway', 'pathway-create'] as const)(
    'given a rejected %s save then shows the API code/message and allows an explicit corrected retry',
    async (mode) => {
      const user = userEvent.setup();
      const onSaved = vi.fn();
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ errors: [spmSaveErrors[0]] }), { status: 400 })
      );
      renderBuilder(mode, onSaved);
      if (mode === 'pathway-create') {
        await user.click(screen.getByText('Click to name your household...'));
        await user.type(
          screen.getByPlaceholderText('Enter household name...'),
          'Review household{Enter}'
        );
      }
      if (mode === 'replace' || mode === 'pathway-create') {
        await user.selectOptions(
          screen.getByLabelText('Supplemental Poverty Measure geography'),
          'county'
        );
        await user.type(screen.getByLabelText(/County FIPS code/), '06001');
      }
      const save = screen.getByRole('button', {
        name:
          mode === 'replace'
            ? 'Update existing household'
            : mode === 'pathway'
              ? 'Save household'
              : 'Create household',
      });
      await waitFor(() => expect(save).toBeEnabled());
      await user.click(save);
      expect(await screen.findByText(spmSaveErrors[0].message)).toBeVisible();
      expect(screen.getByText(`Error code: ${spmSaveErrors[0].code}`)).toBeVisible();
      expect(onSaved).not.toHaveBeenCalled();
      expect(LocalStorageHouseholdStore.prototype.update).not.toHaveBeenCalled();
      await user.click(screen.getByRole('button', { name: 'Choose SPM settings again' }));
      expect(screen.getByLabelText('Supplemental Poverty Measure geography')).toHaveValue('');
      expect(save).toBeDisabled();
      await user.selectOptions(
        screen.getByLabelText('Supplemental Poverty Measure geography'),
        'national'
      );
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ result: { household_id: 'corrected-household' } }), {
          status: 200,
        })
      );
      await waitFor(() => expect(save).toBeEnabled());
      await user.click(save);
      await waitFor(() => expect(onSaved).toHaveBeenCalled());
      const payload = JSON.parse(mockFetch.mock.calls[1][1].body);
      expect(payload.spm).toEqual({ geography_kind: 'national' });
      expect(payload.data.people).toEqual(reviewHousehold.toV1CreationPayload().data.people);
      expect(screen.queryByText(spmSaveErrors[0].message)).not.toBeInTheDocument();
    }
  );

  test.each(spmSaveErrors.slice(1))(
    'given $code then retains corrective API text and household inputs',
    async (detail) => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify({ errors: [detail] }), { status: 400 })
      );
      renderBuilder('create');
      const save = screen.getByRole('button', { name: 'Create household' });
      await waitFor(() => expect(save).toBeEnabled());
      await userEvent.click(save);
      expect(await screen.findByText(detail.message)).toBeVisible();
      expect(screen.getByText(`Error code: ${detail.code}`)).toBeVisible();
      expect(screen.getByLabelText('Supplemental Poverty Measure geography')).toHaveValue(
        'national'
      );
      expect(save).toBeEnabled();
    }
  );

  test.each(['create', 'replace', 'pathway', 'pathway-create'] as const)(
    'given an unsupported SPM year during %s then directs year correction and preserves geography without a reset control',
    async (mode) => {
      const user = userEvent.setup();
      const onSaved = vi.fn();
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ errors: [SPM_YEAR_ERROR] }), { status: 400 })
      );
      renderBuilder(mode, onSaved);
      if (mode === 'pathway-create') {
        await user.click(screen.getByText('Click to name your household...'));
        await user.type(
          screen.getByPlaceholderText('Enter household name...'),
          'Review household{Enter}'
        );
      }
      await user.selectOptions(
        screen.getByLabelText('Supplemental Poverty Measure geography'),
        'county'
      );
      await user.type(screen.getByLabelText(/County FIPS code/), '06001');
      const save = screen.getByRole('button', {
        name:
          mode === 'replace'
            ? 'Update existing household'
            : mode === 'pathway'
              ? 'Save household'
              : 'Create household',
      });
      await waitFor(() => expect(save).toBeEnabled());
      await user.click(save);

      expect(await screen.findByText(SPM_YEAR_ERROR.message)).toBeVisible();
      expect(screen.getByText(`Error code: ${SPM_YEAR_ERROR.code}`)).toBeVisible();
      expect(screen.getByText(/select a year supported by the SPM artifact/)).toBeVisible();
      expect(
        screen.queryByRole('button', { name: 'Choose SPM settings again' })
      ).not.toBeInTheDocument();
      expect(screen.getByLabelText('Supplemental Poverty Measure geography')).toHaveValue('county');
      expect(screen.getByLabelText(/County FIPS code/)).toHaveValue('06001');
      expect(onSaved).not.toHaveBeenCalled();
      expect(LocalStorageHouseholdStore.prototype.update).not.toHaveBeenCalled();
    }
  );
});
