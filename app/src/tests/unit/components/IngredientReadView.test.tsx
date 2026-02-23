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
    const { container } = render(
      <IngredientReadView
        ingredient={MOCK_INGREDIENT.NAME}
        title={MOCK_INGREDIENT.TITLE}
        isLoading
        isError={false}
        data={EMPTY_DATA}
        columns={MOCK_COLUMNS}
      />
    );

    // Then - Mantine Loader uses a span, so just check it's rendered
    const loader = container.querySelector('.mantine-Loader-root');
    expect(loader).toBeInTheDocument();
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
});
