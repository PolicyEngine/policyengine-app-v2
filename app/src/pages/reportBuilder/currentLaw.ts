import type { PolicyStateProps } from '@/types/pathwayState';

export const CURRENT_LAW_ID = 'current-law' as const;

export const CURRENT_LAW_LABEL = 'Current law';

export function isCurrentLaw(policyId: string | undefined): boolean {
  return policyId === CURRENT_LAW_ID;
}

export function createCurrentLawPolicy(): PolicyStateProps {
  return { id: CURRENT_LAW_ID, label: CURRENT_LAW_LABEL, parameters: [] };
}

export function toApiPolicyId(localId: string, currentLawId: number): string {
  return localId === CURRENT_LAW_ID ? currentLawId.toString() : localId;
}

export function fromApiPolicyId(apiId: string, currentLawId: number): string {
  return apiId === currentLawId.toString() ? CURRENT_LAW_ID : apiId;
}
