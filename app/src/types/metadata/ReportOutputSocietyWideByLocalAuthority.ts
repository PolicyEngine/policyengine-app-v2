import type { UKAreaImpact } from './UKAreaImpact';

export interface ReportOutputSocietyWideByLocalAuthority {
  [localAuthorityName: string]: UKAreaImpact;
}
