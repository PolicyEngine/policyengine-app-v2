import { SummaryBoxItem, TextListItem } from '@/components/IngredientSubmissionView';

// Test constants for strings
export const INGREDIENT_SUBMISSION_STRINGS = {
  TITLE: 'Submit Your Policy',
  SUBTITLE: 'Review your policy details',
  SUBMIT_TEXT: 'Create Policy',
  CANCEL_BUTTON: 'Cancel',
} as const;

// Test data for summary boxes
export const mockSummaryBoxes: SummaryBoxItem[] = [
  { title: 'Policy Name', description: 'Test Policy', isFulfilled: true },
  { title: 'Parameters', description: '5 parameters selected', isFulfilled: true },
];

// Test data for text list
export const mockTextList: TextListItem[] = [
  { text: 'Parameter 1: Value 1' },
  { text: 'Parameter 2: Value 2' },
];
