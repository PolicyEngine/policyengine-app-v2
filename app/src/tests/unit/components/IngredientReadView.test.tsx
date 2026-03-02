import { render, screen, userEvent } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import IngredientReadView from '@/components/IngredientReadView';
import {
  EMPTY_DATA,
  MOCK_COLUMNS,
  MOCK_DATA,
  MOCK_INGREDIENT,
} from '@/tests/fixtures/components/IngredientReadViewMocks';

describe('IngredientReadView', () => {
  test('given data then displays table headers', () => {
    // When
    render(
      <IngredientReadView
        ingredient={MOCK_INGREDIENT.NAME}
        title={MOCK_INGREDIENT.TITLE}
        subtitle={MOCK_INGREDIENT.SUBTITLE}
        isLoading={false}
        isError={false}
        data={MOCK_DATA}
        columns={MOCK_COLUMNS}
      />
    );

    // Then
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  test('given empty data then displays empty state', () => {
    // When
    render(
      <IngredientReadView
        ingredient={MOCK_INGREDIENT.NAME}
        title={MOCK_INGREDIENT.TITLE}
        subtitle={MOCK_INGREDIENT.SUBTITLE}
        isLoading={false}
        isError={false}
        data={EMPTY_DATA}
        columns={MOCK_COLUMNS}
      />
    );

    // Then
    expect(screen.getByText(/no policy found/i)).toBeInTheDocument();
  });

  test('given loading state then displays loader', () => {
    // When
    render(
      <IngredientReadView
        ingredient={MOCK_INGREDIENT.NAME}
        title={MOCK_INGREDIENT.TITLE}
        isLoading
        isError={false}
        data={EMPTY_DATA}
        columns={MOCK_COLUMNS}
      />
    );

    // Then — Spinner component renders with role="status"
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  test('given error state then displays error message', () => {
    // When
    const error = new Error('Failed to load');
    render(
      <IngredientReadView
        ingredient={MOCK_INGREDIENT.NAME}
        title={MOCK_INGREDIENT.TITLE}
        isLoading={false}
        isError
        error={error}
        data={EMPTY_DATA}
        columns={MOCK_COLUMNS}
      />
    );

    // Then
    expect(screen.getByText(/error.*failed to load/i)).toBeInTheDocument();
  });

  test('given onBuild callback then displays new button with lowercase ingredient', () => {
    // Given
    const onBuild = vi.fn();

    // When
    render(
      <IngredientReadView
        ingredient={MOCK_INGREDIENT.NAME}
        title={MOCK_INGREDIENT.TITLE}
        onBuild={onBuild}
        isLoading={false}
        isError={false}
        data={MOCK_DATA}
        columns={MOCK_COLUMNS}
      />
    );

    // Then
    expect(screen.getByRole('button', { name: /new policy/i })).toBeInTheDocument();
  });

  test('given user clicks new button then callback is invoked', async () => {
    // Given
    const user = userEvent.setup();
    const onBuild = vi.fn();

    // When
    render(
      <IngredientReadView
        ingredient={MOCK_INGREDIENT.NAME}
        title={MOCK_INGREDIENT.TITLE}
        onBuild={onBuild}
        isLoading={false}
        isError={false}
        data={MOCK_DATA}
        columns={MOCK_COLUMNS}
      />
    );
    await user.click(screen.getByRole('button', { name: /new policy/i }));

    // Then
    expect(onBuild).toHaveBeenCalled();
  });

  test('given selection enabled then displays checkboxes', () => {
    // When
    render(
      <IngredientReadView
        ingredient={MOCK_INGREDIENT.NAME}
        title={MOCK_INGREDIENT.TITLE}
        isLoading={false}
        isError={false}
        data={MOCK_DATA}
        columns={MOCK_COLUMNS}
        enableSelection
      />
    );

    // Then
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(2); // One for each record
  });

  test('given user clicks checkbox then selection callback is invoked', async () => {
    // Given
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();

    // When
    render(
      <IngredientReadView
        ingredient={MOCK_INGREDIENT.NAME}
        title={MOCK_INGREDIENT.TITLE}
        isLoading={false}
        isError={false}
        data={MOCK_DATA}
        columns={MOCK_COLUMNS}
        enableSelection
        onSelectionChange={onSelectionChange}
      />
    );
    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[0]);

    // Then
    expect(onSelectionChange).toHaveBeenCalledWith('1', true);
  });
});
