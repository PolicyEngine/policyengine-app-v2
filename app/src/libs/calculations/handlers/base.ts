import { QueryClient } from '@tanstack/react-query';
import { CalculationMeta } from '@/api/reportCalculations';
import { CalculationStatusResponse } from '../status';

export abstract class CalculationHandler {
  protected queryClient: QueryClient;

  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient;
  }

  abstract fetch(meta: CalculationMeta): Promise<CalculationStatusResponse>;
  abstract getStatus(reportId: string): CalculationStatusResponse | null;
  abstract startCalculation(reportId: string, meta: CalculationMeta): Promise<void>;

  getCacheKey(reportId: string): readonly string[] {
    return ['calculation', reportId] as const;
  }
}