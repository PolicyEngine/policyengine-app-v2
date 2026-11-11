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

/** Generating types for the whole document takes a few seconds on a slow runner. */
export const GENERATION_TIMEOUT_MS = 30000;
