import { BASE_URL } from '@/constants';

export interface HouseholdPayload {
  taxYear: string;
  maritalStatus: string;
  numChildren: number;
  children: { age: string; income: string }[];
}

export async function createHousehold(data: HouseholdPayload) {
  const url = `${BASE_URL}/us/household`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error('Failed to create household');
  }

  return res.json();
}
