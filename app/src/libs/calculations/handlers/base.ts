import { QueryClient } from '@tanstack/react-query';
import { CalculationMeta } from '@/api/reportCalculations';
import type { CalculationManager } from '../manager';
import { CalculationStatusResponse } from '../status';

export abstract class CalculationHandler {
  protected queryClient: QueryClient;
  protected manager?: CalculationManager;

  constructor(queryClient: QueryClient, manager?: CalculationManager) {
    this.queryClient = queryClient;
    this.manager = manager;
  }

  abstract fetch(meta: CalculationMeta): Promise<CalculationStatusResponse>;
  abstract getStatus(reportId: string): CalculationStatusResponse | null;
  abstract startCalculation(reportId: string, meta: CalculationMeta): Promise<void>;

  getCacheKey(reportId: string): readonly string[] {
    return ['calculation', reportId] as const;
  }
}
