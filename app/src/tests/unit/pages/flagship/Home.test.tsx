import { render, screen, userEvent } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { addDraftProvision, clearDraftReform, setDraftLabel } from '@/libs/draftReform';
import FlagshipHomePage from '@/pages/flagship/Home.page';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ countryId: 'us' }),
  };
});

describe('FlagshipHomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearDraftReform();
  });

  test('given the launcher renders then all four cards show with descriptions', () => {
    render(<FlagshipHomePage />);

    expect(screen.getByRole('button', { name: /ask/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /tracker/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /build/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /library/i })).toBeInTheDocument();
    expect(screen.getByText(/describe a reform in plain language/i)).toBeInTheDocument();
  });

  test('given a card is clicked then it navigates to that section', async () => {
    const user = userEvent.setup();
    render(<FlagshipHomePage />);

    await user.click(screen.getByRole('button', { name: /browse real bills/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/us/tracker');
  });

  test('given no draft then the resume banner does not show', () => {
    render(<FlagshipHomePage />);

    expect(screen.queryByText(/resume your draft reform/i)).not.toBeInTheDocument();
  });

  test('given a draft in progress then the resume banner shows and opens build', async () => {
    // Given
    const user = userEvent.setup();
    addDraftProvision('us', {
      path: 'gov.irs.credits.ctc.amount',
      breadcrumb: 'IRS → CTC → Amount',
      unit: 'currency-USD',
      baselineValue: 2000,
      value: 3600,
    });
    setDraftLabel('CTC expansion');
    render(<FlagshipHomePage />);

    // When
    await user.click(screen.getByText(/resume your draft reform/i));

    // Then
    expect(screen.getByText(/CTC expansion/)).toBeInTheDocument();
    expect(mockNavigate).toHaveBeenCalledWith('/us/build');
  });
});
