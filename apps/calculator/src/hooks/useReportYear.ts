import { useReportYearContext } from '@/contexts/ReportYearContext';

/**
 * Hook to access the current report year from context
 *
 * @returns The current report year (e.g., '2025') or null if not in a report pathway
 *
 * @example
 * ```tsx
 * const reportYear = useReportYear();
 * if (!reportYear) {
 *   return <div>No report year available</div>;
 * }
 * console.log(`Calculating for year: ${reportYear}`);
 * ```
 */
export function useReportYear(): string | null {
  return useReportYearContext();
}
