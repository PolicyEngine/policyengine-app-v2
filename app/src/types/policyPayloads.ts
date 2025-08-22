import { Policy } from '@/types/ingredients/Policy';

export interface PolicyCreationPayload {
  data: Record<string, any>;
}

export function serializePolicyCreationPayload(
  policy: Policy,
): PolicyCreationPayload {
  const { parameters } = policy;

  // Fill payload with keys we already know
  const payload = {
    data: {} as Record<string, any>,
  };

  // Convert params and their valueIntervals into expected JSON format
  parameters.forEach((param: any) => {
    payload.data[param.name] = param.values.reduce((acc: any, cur: any) => {
      return { ...acc, [`${cur.startDate}.${cur.endDate}`]: cur.value };
    }, {});
  });

  return payload;
}
