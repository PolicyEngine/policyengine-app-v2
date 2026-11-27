import type { OpenAPI3 } from 'openapi-typescript';

/** A one-route document in the shape the Public API publishes. */
export const ECONOMY_OPTIONS_DOCUMENT: OpenAPI3 = {
  openapi: '3.1.0',
  info: { title: 'PolicyEngine API', version: '0.0.0' },
  paths: {
    '/v2/economy-options': {
      get: {
        operationId: 'get_economy_options',
        parameters: [
          { name: 'country_id', in: 'query', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Successful Response',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/EconomyOptionsResponse' },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      EconomyOptionsResponse: {
        type: 'object',
        required: ['status', 'result'],
        properties: {
          status: { type: 'string', const: 'ok' },
          result: {
            type: 'object',
            required: ['current_law_id'],
            properties: { current_law_id: { type: 'integer' } },
          },
        },
      },
    },
  },
};

/** A report kind's schema: its `kind` is one constant, as the Public API publishes it. */
function reportKindSchema(kind: string) {
  return {
    type: 'object' as const,
    required: ['kind'],
    properties: { kind: { type: 'string' as const, const: kind, title: 'Kind' } },
  };
}

/**
 * A document whose report is a union told apart by `kind`, as the Public
 * API's report routes are.
 */
export const KIND_UNION_DOCUMENT: OpenAPI3 = {
  openapi: '3.1.0',
  info: { title: 'PolicyEngine API', version: '0.0.0' },
  paths: {},
  components: {
    schemas: {
      ReportResult: {
        type: 'object',
        required: ['item'],
        properties: {
          item: {
            type: 'object',
            oneOf: [
              { $ref: '#/components/schemas/EconomyReport' },
              { $ref: '#/components/schemas/HouseholdReport' },
            ],
            discriminator: {
              propertyName: 'kind',
              mapping: {
                economy: '#/components/schemas/EconomyReport',
                household: '#/components/schemas/HouseholdReport',
              },
            },
          },
        },
      },
      EconomyReport: reportKindSchema('economy'),
      HouseholdReport: reportKindSchema('household'),
    },
  },
};

/** Generating types for the whole document takes a few seconds on a slow runner. */
export const GENERATION_TIMEOUT_MS = 30000;
