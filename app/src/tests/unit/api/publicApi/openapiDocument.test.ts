import { describe, expect, test } from 'vitest';
import openapiDocument from '@/api/publicApi/openapi.json';

/**
 * The checked-in OpenAPI document, from which the generated client's types
 * come: v3's household code calls these routes and reads these fields.
 */
interface OpenapiOperation {
  requestBody?: { content?: Record<string, { schema?: unknown }> };
}

interface OpenapiSchema {
  required?: string[];
  properties?: Record<string, unknown>;
}

const paths = openapiDocument.paths as unknown as Record<string, Record<string, OpenapiOperation>>;
const schemas = openapiDocument.components.schemas as unknown as Record<string, OpenapiSchema>;

/** The routes v3's household calculations and household reports use, with their methods. */
const HOUSEHOLD_ROUTES: [method: string, path: string][] = [
  ['post', '/v2/household-calculations'],
  ['get', '/v2/household-calculations/{calculation_id}'],
  ['post', '/v2/households'],
  ['get', '/v2/households/{household_id}'],
  ['post', '/v2/reports'],
  ['get', '/v2/reports/{report_id}'],
  ['post', '/v2/user-reports'],
  ['get', '/v2/shared-reports/{association_id}'],
];

describe('the Public API OpenAPI document', () => {
  test.each(HOUSEHOLD_ROUTES)(
    'given v3 households then the document declares %s %s',
    (method, path) => {
      expect(paths[path]?.[method]).toBeDefined();
    }
  );

  test('given a household report then POST /v2/reports takes the household kind', () => {
    const body = JSON.stringify(paths['/v2/reports']?.post?.requestBody ?? {});

    expect(body).toContain('#/components/schemas/HouseholdReportCreateRequest');
  });

  test('given a household calculation then its request takes axes and add_missing_variables', () => {
    expect(Object.keys(schemas.HouseholdCalculationRequest?.properties ?? {})).toEqual(
      expect.arrayContaining(['household_id', 'policy_id', 'axes', 'add_missing_variables'])
    );
  });

  test('given the model catalog then it says whether the version offers SPM settings', () => {
    expect(schemas.MetadataModelCatalogResult?.required).toContain('spm');
  });
});
