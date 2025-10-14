import { render, screen, userEvent } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import IngredientCreationStartView from '@/components/IngredientCreationStartView';
import {
  INGREDIENT_CREATION_STRINGS,
  createTestInput,
} from '@/tests/fixtures/components/IngredientCreationStartViewMocks';

// Mock useCancelFlow hook
const mockHandleCancel = vi.fn();
vi.mock('@/hooks/useCancelFlow', () => ({
  useCancelFlow: vi.fn(() => ({ handleCancel: mockHandleCancel })),
}));

// Import after mock to get mocked version
import { useCancelFlow } from '@/hooks/useCancelFlow';

describe('IngredientCreationStartView', () => {
  const mockSubmissionHandler = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('given title then renders title correctly', () => {
    // Given/When
    render(
      <IngredientCreationStartView
        title={INGREDIENT_CREATION_STRINGS.TITLE}
        submissionHandler={mockSubmissionHandler}
        ingredientType="policy"
      />
    );

    // Then
    expect(screen.getByRole('heading', { name: INGREDIENT_CREATION_STRINGS.TITLE })).toBeInTheDocument();
  });

  test('given form inputs then renders inputs', () => {
    // Given
    const testInput = createTestInput();

    // When
    render(
      <IngredientCreationStartView
        title={INGREDIENT_CREATION_STRINGS.TITLE}
        formInputs={testInput}
        submissionHandler={mockSubmissionHandler}
        ingredientType="policy"
      />
    );

    // Then
    expect(screen.getByTestId('test-input')).toBeInTheDocument();
  });

  test('given custom submit button text then uses custom text', () => {
    // Given/When
    render(
      <IngredientCreationStartView
        title={INGREDIENT_CREATION_STRINGS.TITLE}
        submitButtonText={INGREDIENT_CREATION_STRINGS.SUBMIT_TEXT}
        submissionHandler={mockSubmissionHandler}
        ingredientType="policy"
      />
    );

    // Then
    expect(screen.getByRole('button', { name: INGREDIENT_CREATION_STRINGS.SUBMIT_TEXT })).toBeInTheDocument();
  });

  test('given no custom submit text then defaults to title', () => {
    // Given/When
    render(
      <IngredientCreationStartView
        title={INGREDIENT_CREATION_STRINGS.TITLE}
        submissionHandler={mockSubmissionHandler}
        ingredientType="policy"
      />
    );

    // Then
    expect(screen.getByRole('button', { name: INGREDIENT_CREATION_STRINGS.TITLE })).toBeInTheDocument();
  });

  test('given user clicks submit button then calls submission handler', async () => {
    // Given
    const user = userEvent.setup();

    render(
      <IngredientCreationStartView
        title={INGREDIENT_CREATION_STRINGS.TITLE}
        submissionHandler={mockSubmissionHandler}
        ingredientType="policy"
      />
    );

    // When
    const submitButton = screen.getByRole('button', { name: INGREDIENT_CREATION_STRINGS.TITLE });
    await user.click(submitButton);

    // Then
    expect(mockSubmissionHandler).toHaveBeenCalledTimes(1);
  });

  test('given user clicks cancel button then calls useCancelFlow hook', async () => {
    // Given
    const user = userEvent.setup();

    render(
      <IngredientCreationStartView
        title={INGREDIENT_CREATION_STRINGS.TITLE}
        submissionHandler={mockSubmissionHandler}
        ingredientType="policy"
      />
    );

    // When
    const cancelButton = screen.getByRole('button', { name: INGREDIENT_CREATION_STRINGS.CANCEL_BUTTON });
    await user.click(cancelButton);

    // Then
    expect(mockHandleCancel).toHaveBeenCalledTimes(1);
  });

  test('given ingredientType policy then useCancelFlow called with policy', () => {
    // Given/When
    render(
      <IngredientCreationStartView
        title={INGREDIENT_CREATION_STRINGS.TITLE}
        submissionHandler={mockSubmissionHandler}
        ingredientType="policy"
      />
    );

    // Then
    expect(useCancelFlow).toHaveBeenCalledWith('policy');
  });

  test('given ingredientType population then useCancelFlow called with population', () => {
    // Given/When
    render(
      <IngredientCreationStartView
        title={INGREDIENT_CREATION_STRINGS.TITLE}
        submissionHandler={mockSubmissionHandler}
        ingredientType="population"
      />
    );

    // Then
    expect(useCancelFlow).toHaveBeenCalledWith('population');
  });

  test('given ingredientType simulation then useCancelFlow called with simulation', () => {
    // Given/When
    render(
      <IngredientCreationStartView
        title={INGREDIENT_CREATION_STRINGS.TITLE}
        submissionHandler={mockSubmissionHandler}
        ingredientType="simulation"
      />
    );

    // Then
    expect(useCancelFlow).toHaveBeenCalledWith('simulation');
  });

  test('given ingredientType report then useCancelFlow called with report', () => {
    // Given/When
    render(
      <IngredientCreationStartView
        title={INGREDIENT_CREATION_STRINGS.TITLE}
        submissionHandler={mockSubmissionHandler}
        ingredientType="report"
      />
    );

    // Then
    expect(useCancelFlow).toHaveBeenCalledWith('report');
  });

  test('given component renders then displays both cancel and submit buttons', () => {
    // Given/When
    render(
      <IngredientCreationStartView
        title={INGREDIENT_CREATION_STRINGS.TITLE}
        submissionHandler={mockSubmissionHandler}
        ingredientType="policy"
      />
    );

    // Then
    expect(screen.getByRole('button', { name: INGREDIENT_CREATION_STRINGS.CANCEL_BUTTON })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: INGREDIENT_CREATION_STRINGS.TITLE })).toBeInTheDocument();
  });
});
