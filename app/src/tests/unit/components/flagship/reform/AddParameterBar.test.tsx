import { render, screen } from '@test-utils';
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
