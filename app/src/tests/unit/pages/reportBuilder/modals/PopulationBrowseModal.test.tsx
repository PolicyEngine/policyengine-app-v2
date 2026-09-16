import { render, screen, userEvent } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import { PopulationBrowseModal } from '@/pages/reportBuilder/modals/PopulationBrowseModal';
import { CORRECTED_REPORT_YEAR } from '@/tests/fixtures/pages/reportBuilder/useReportSubmissionMocks';

vi.mock('@/hooks/useCurrentCountry', () => ({ useCurrentCountry: () => 'us' }));
vi.mock('@/hooks/useUserHousehold', () => ({
  useUserHouseholds: () => ({ data: [], isLoading: false }),
}));
vi.mock('@/hooks/useRegions', () => ({ useRegions: () => ({ data: [] }) }));

describe('PopulationBrowseModal population types', () => {
  test('given the other simulation is a geography then offers geography selection and no household creation', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(
      <PopulationBrowseModal
        isOpen
        onClose={vi.fn()}
        onSelect={onSelect}
        onCreateNew={vi.fn()}
        reportYear={CORRECTED_REPORT_YEAR}
        allowedPopulationType="geography"
      />
    );

    expect(
      screen.getByText('Choose a geographic region to match the other simulation')
    ).toBeVisible();
    expect(screen.queryByText('My households')).not.toBeInTheDocument();
    expect(screen.queryByText('Create new household')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Nationwide/ }));
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'geography', household: null })
    );
  });

  test('given the other simulation is a household then offers households and no geography selection', async () => {
    const onCreateNew = vi.fn();
    const user = userEvent.setup();
    render(
      <PopulationBrowseModal
        isOpen
        onClose={vi.fn()}
        onSelect={vi.fn()}
        onCreateNew={onCreateNew}
        reportYear={CORRECTED_REPORT_YEAR}
        allowedPopulationType="household"
      />
    );

    expect(
      screen.getByText('Choose or create a household to match the other simulation')
    ).toBeVisible();
    expect(screen.queryByText('Nationwide')).not.toBeInTheDocument();
    expect(screen.queryByText('States and territories')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Create new household' }));
    expect(onCreateNew).toHaveBeenCalledOnce();
  });
});
