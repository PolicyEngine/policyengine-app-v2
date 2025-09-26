import { countryIds } from '@/libs/countries';
import { formatDate } from '@/utils/dateUtils';

/**
 * Format a date string consistently across all ingredient pages
 */
export function formatIngredientDate(
  date: string | Date | undefined | null,
  countryId: (typeof countryIds)[number] = 'us'
): string {
  if (!date) {
    return 'N/A';
  }
  const dateStr = typeof date === 'string' ? date : date.toISOString();
  return formatDate(dateStr, 'short-month-day-year', countryId, true);
}

/**
 * Get a placeholder text when a field is empty
 */
export function getPlaceholderText(type: 'description' | 'name' | 'label', id?: string | number) {
  switch (type) {
    case 'description':
      return 'No description';
    case 'name':
      return id ? `Item #${id}` : 'Unnamed item';
    case 'label':
      return id ? `Label #${id}` : 'No label';
    default:
      return 'N/A';
  }
}
