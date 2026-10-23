import { render, screen, userEvent } from '@test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import AddParameterBar from '@/components/flagship/reform/AddParameterBar';
import { clearDraftReform } from '@/libs/draftReform';
import { clearMetadata } from '@/reducers/metadataReducer';
import { store } from '@/store';
import { seedDeductionMetadata } from '@/tests/fixtures/components/flagship/draftEditorFixtures';
import { mockScreenWidth, SCREEN_WIDTHS } from '@/tests/fixtures/hooks/useMediaQueryMocks';

const search = () => screen.getByRole('combobox', { name: 'Search parameters' });

describe('AddParameterBar placeholder', () => {
  beforeEach(() => {
    clearDraftReform();
    seedDeductionMetadata();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    store.dispatch(clearMetadata());
  });

  test('given a wide screen then the bar asks with an example', () => {
    // Given
    mockScreenWidth(SCREEN_WIDTHS.DESKTOP);

    // When
    render(<AddParameterBar onPick={vi.fn()} />);

    // Then — the default, as before
    expect(search()).toHaveAttribute(
      'placeholder',
      'Add a parameter — search by name, e.g. child tax credit'
    );
  });

  test('given a phone then the bar only asks, without the example', () => {
    // Given
    mockScreenWidth(SCREEN_WIDTHS.PHONE);

    // When
    render(<AddParameterBar onPick={vi.fn()} />);

    // Then
    expect(search()).toHaveAttribute('placeholder', 'Add a parameter');
  });

  test('given a phone and the bar at the foot of the reform then it asks for another', () => {
    // Given
    mockScreenWidth(SCREEN_WIDTHS.PHONE);

    // When
    render(<AddParameterBar onPick={vi.fn()} inTable />);

    // Then
    expect(search()).toHaveAttribute('placeholder', 'Add another parameter');
  });
});

describe('AddParameterBar analytics', () => {
  beforeEach(() => {
    clearDraftReform();
    seedDeductionMetadata();
    mockScreenWidth(SCREEN_WIDTHS.DESKTOP);
  });

  afterEach(() => {
    delete window.gtag;
    vi.restoreAllMocks();
    store.dispatch(clearMetadata());
  });

  test('given a search result picked then one event sends its rank and the query length, not the query', async () => {
    const user = userEvent.setup();
    const gtag = vi.fn();
    window.gtag = gtag;
    const onPick = vi.fn();
    render(<AddParameterBar onPick={onPick} autoFocus />);

    await user.type(search(), 'personal exemption');
    const options = await screen.findAllByRole('option');
    await user.click(options[0]);

    expect(onPick).toHaveBeenCalledTimes(1);
    expect(gtag.mock.calls).toEqual([
      [
        'event',
        'parameter_search_selected',
        { country_id: 'us', rank: 1, is_breakdown: false, in_folder: false, query_length: 18 },
      ],
    ]);
    expect(JSON.stringify(gtag.mock.calls)).not.toContain('exemption');
  });
});
