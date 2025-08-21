import { Policy } from '@/types/policy';

export interface PolicyCreationPayload {
  label?: string;
  data: Record<string, any>;
}

export function serializePolicyCreationPayload(policy: Policy): PolicyCreationPayload {
  const { label, params } = policy;

  // Fill payload with keys we already know
  const payload = {
    label,
    data: {} as Record<string, any>,
  };

  // Convert params and their valueIntervals into expected JSON format
  params.forEach((param) => {
    payload.data[param.name] = param.values.reduce((acc, cur) => {
      return { ...acc, [`${cur.startDate}.${cur.endDate}`]: cur.value };
    }, {});
  });

  return payload;
}
