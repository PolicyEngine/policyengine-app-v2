import { render, screen, userEvent } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import IngredientSubmissionView from '@/components/IngredientSubmissionView';
// Import after mock to get mocked version
import { useCancelFlow } from '@/hooks/useCancelFlow';
import {
  INGREDIENT_SUBMISSION_STRINGS,
  mockSummaryBoxes,
  mockTextList,
} from '@/tests/fixtures/components/IngredientSubmissionViewMocks';

// Mock useCancelFlow hook
const mockHandleCancel = vi.fn();
vi.mock('@/hooks/useCancelFlow', () => ({
  useCancelFlow: vi.fn(() => ({ handleCancel: mockHandleCancel })),
}));

describe('IngredientSubmissionView', () => {
  const mockSubmissionHandler = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('given title then renders title correctly', () => {
    // Given/When
    render(
      <IngredientSubmissionView
        title={INGREDIENT_SUBMISSION_STRINGS.TITLE}
        submissionHandler={mockSubmissionHandler}
        ingredientType="policy"
      />
    );

    // Then
    expect(
      screen.getByRole('heading', { name: INGREDIENT_SUBMISSION_STRINGS.TITLE })
    ).toBeInTheDocument();
  });

  test('given subtitle then renders subtitle correctly', () => {
    // Given/When
    render(
      <IngredientSubmissionView
        title={INGREDIENT_SUBMISSION_STRINGS.TITLE}
        subtitle={INGREDIENT_SUBMISSION_STRINGS.SUBTITLE}
        submissionHandler={mockSubmissionHandler}
        ingredientType="policy"
      />
    );

    // Then
    expect(screen.getByText(INGREDIENT_SUBMISSION_STRINGS.SUBTITLE)).toBeInTheDocument();
  });

  test('given custom submit button text then uses custom text', () => {
    // Given/When
    render(
      <IngredientSubmissionView
        title={INGREDIENT_SUBMISSION_STRINGS.TITLE}
        submitButtonText={INGREDIENT_SUBMISSION_STRINGS.SUBMIT_TEXT}
        submissionHandler={mockSubmissionHandler}
        ingredientType="policy"
      />
    );

    // Then
    expect(
      screen.getByRole('button', { name: INGREDIENT_SUBMISSION_STRINGS.SUBMIT_TEXT })
    ).toBeInTheDocument();
  });

  test('given no custom submit text then defaults to title', () => {
    // Given/When
    render(
      <IngredientSubmissionView
        title={INGREDIENT_SUBMISSION_STRINGS.TITLE}
        submissionHandler={mockSubmissionHandler}
        ingredientType="policy"
      />
    );

    // Then
    expect(
      screen.getByRole('button', { name: INGREDIENT_SUBMISSION_STRINGS.TITLE })
    ).toBeInTheDocument();
  });

  test('given summary boxes then renders all boxes', () => {
    // Given/When
    render(
      <IngredientSubmissionView
        title={INGREDIENT_SUBMISSION_STRINGS.TITLE}
        summaryBoxes={mockSummaryBoxes}
        submissionHandler={mockSubmissionHandler}
        ingredientType="policy"
      />
    );

    // Then
    expect(screen.getByText('Policy Name')).toBeInTheDocument();
    expect(screen.getByText('Test Policy')).toBeInTheDocument();
    expect(screen.getByText('Parameters')).toBeInTheDocument();
    expect(screen.getByText('5 parameters selected')).toBeInTheDocument();
  });

  test('given text list then renders all items', () => {
    // Given/When
    render(
      <IngredientSubmissionView
        title={INGREDIENT_SUBMISSION_STRINGS.TITLE}
        textList={mockTextList}
        submissionHandler={mockSubmissionHandler}
        ingredientType="policy"
      />
    );

    // Then
    expect(screen.getByText('Parameter 1: Value 1')).toBeInTheDocument();
    expect(screen.getByText('Parameter 2: Value 2')).toBeInTheDocument();
  });

  test('given user clicks submit button then calls submission handler', async () => {
    // Given
    const user = userEvent.setup();

    render(
      <IngredientSubmissionView
        title={INGREDIENT_SUBMISSION_STRINGS.TITLE}
        submissionHandler={mockSubmissionHandler}
        ingredientType="policy"
      />
    );

    // When
    const submitButton = screen.getByRole('button', { name: INGREDIENT_SUBMISSION_STRINGS.TITLE });
    await user.click(submitButton);

    // Then
    expect(mockSubmissionHandler).toHaveBeenCalledTimes(1);
  });

  test('given user clicks cancel button then calls useCancelFlow hook', async () => {
    // Given
    const user = userEvent.setup();

    render(
      <IngredientSubmissionView
        title={INGREDIENT_SUBMISSION_STRINGS.TITLE}
        submissionHandler={mockSubmissionHandler}
        ingredientType="policy"
      />
    );

    // When
    const cancelButton = screen.getByRole('button', {
      name: INGREDIENT_SUBMISSION_STRINGS.CANCEL_BUTTON,
    });
    await user.click(cancelButton);

    // Then
    expect(mockHandleCancel).toHaveBeenCalledTimes(1);
  });

  test('given submitButtonLoading true then submit button shows loading state', () => {
    // Given/When
    render(
      <IngredientSubmissionView
        title={INGREDIENT_SUBMISSION_STRINGS.TITLE}
        submissionHandler={mockSubmissionHandler}
        submitButtonLoading
        ingredientType="policy"
      />
    );

    // Then
    const submitButton = screen.getByRole('button', { name: INGREDIENT_SUBMISSION_STRINGS.TITLE });
    expect(submitButton).toHaveAttribute('data-loading', 'true');
  });

  test('given ingredientType policy then useCancelFlow called with policy', () => {
    // Given/When
    render(
      <IngredientSubmissionView
        title={INGREDIENT_SUBMISSION_STRINGS.TITLE}
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
      <IngredientSubmissionView
        title={INGREDIENT_SUBMISSION_STRINGS.TITLE}
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
      <IngredientSubmissionView
        title={INGREDIENT_SUBMISSION_STRINGS.TITLE}
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
      <IngredientSubmissionView
        title={INGREDIENT_SUBMISSION_STRINGS.TITLE}
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
      <IngredientSubmissionView
        title={INGREDIENT_SUBMISSION_STRINGS.TITLE}
        submissionHandler={mockSubmissionHandler}
        ingredientType="policy"
      />
    );

    // Then
    expect(
      screen.getByRole('button', { name: INGREDIENT_SUBMISSION_STRINGS.CANCEL_BUTTON })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: INGREDIENT_SUBMISSION_STRINGS.TITLE })
    ).toBeInTheDocument();
  });
});
