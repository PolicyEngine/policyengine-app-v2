import type { UKAreaImpact } from './UKAreaImpact';

export interface ReportOutputSocietyWideByConstituency {
  [constituencyName: string]: UKAreaImpact;
}
