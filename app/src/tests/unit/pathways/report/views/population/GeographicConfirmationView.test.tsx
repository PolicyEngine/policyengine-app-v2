import { render, screen, userEvent, waitFor } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import GeographicConfirmationView from '@/pathways/report/views/population/GeographicConfirmationView';
import type { PopulationStateProps } from '@/types/pathwayState';

const { mockCreateGeographicAssociation } = vi.hoisted(() => ({
  mockCreateGeographicAssociation: {
    mutateAsync: vi.fn(),
    isPending: false,
  },
}));

vi.mock('@/components/common/PathwayView', () => ({
  default: ({ title, content, primaryAction, backAction }: any) => (
    <div>
      <h1>{title}</h1>
      <div>{content}</div>
      {backAction ? (
        <button type="button" onClick={backAction.onClick}>
          Back
        </button>
      ) : null}
      <button type="button" onClick={primaryAction.onClick}>
        {primaryAction.label}
      </button>
    </div>
  ),
}));

vi.mock('@/hooks/useUserGeographic', () => ({
  useCreateGeographicAssociation: () => mockCreateGeographicAssociation,
}));

describe('GeographicConfirmationView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('given confirmed geography then creates the saved geography association through the guarded hook', async () => {
    const user = userEvent.setup();
    const onSubmitSuccess = vi.fn();
    const dateNowSpy = vi.spyOn(Date, 'now').mockReturnValue(1700000000000);
    mockCreateGeographicAssociation.mutateAsync.mockResolvedValue({
      geographyId: 'state/ca',
      label: 'California Population',
    });

    const population: PopulationStateProps = {
      label: 'California Population',
      type: 'geography',
      household: null,
      geography: {
        id: 'state/ca',
        countryId: 'us',
        scope: 'subnational',
        geographyId: 'state/ca',
        name: 'California',
      },
    };

    render(
      <GeographicConfirmationView population={population} onSubmitSuccess={onSubmitSuccess} />
    );

    await user.click(screen.getByRole('button', { name: 'Create household collection' }));

    await waitFor(() => {
      expect(mockCreateGeographicAssociation.mutateAsync).toHaveBeenCalledWith({
        id: 'anonymous-1700000000000',
        userId: 'anonymous',
        countryId: 'us',
        geographyId: 'state/ca',
        scope: 'subnational',
        label: 'California Population',
      });
    });
    expect(onSubmitSuccess).toHaveBeenCalledWith('state/ca', 'California Population');
    dateNowSpy.mockRestore();
  });
});
