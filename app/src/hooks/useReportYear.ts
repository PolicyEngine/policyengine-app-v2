import { useSelector } from 'react-redux';
import { selectReportYear } from '@/reducers/reportReducer';

/**
 * Hook to access the current report year from Redux state
 *
 * @returns The current report year (e.g., '2025')
 *
 * @example
 * ```tsx
 * const reportYear = useReportYear();
 * console.log(`Calculating for year: ${reportYear}`);
 * ```
 */
export function useReportYear(): string {
  return useSelector(selectReportYear);
}
