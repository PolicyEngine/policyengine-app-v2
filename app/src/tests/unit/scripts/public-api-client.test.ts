// @vitest-environment node
import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import {
  ECONOMY_OPTIONS_DOCUMENT,
  GENERATION_TIMEOUT_MS,
} from '@/tests/fixtures/scripts/publicApiClientMocks';
import {
  compareGeneratedTypes,
  GENERATED_SCHEMA_PATH,
  generatePublicApiTypes,
  OPENAPI_DOCUMENT_PATH,
  openapiDocumentLocation,
  serializeOpenapiDocument,
} from '../../../../scripts/public-api-client';

describe('public-api-client', () => {
  it(
    'given an OpenAPI document then the types name its routes and schemas',
    async () => {
      // When
      const generated = await generatePublicApiTypes(ECONOMY_OPTIONS_DOCUMENT);

      // Then
      expect(generated).toContain('Do not edit');
      expect(generated).toContain("'/v2/economy-options'");
      expect(generated).toContain('EconomyOptionsResponse');
      expect(generated).toContain('current_law_id: number');
    },
    GENERATION_TIMEOUT_MS
  );

  it(
    'given types generated from the same document then they are up to date',
    async () => {
      // Given
      const generated = await generatePublicApiTypes(ECONOMY_OPTIONS_DOCUMENT);

      // When
      const comparison = await compareGeneratedTypes(ECONOMY_OPTIONS_DOCUMENT, generated);

      // Then
      expect(comparison.upToDate).toBe(true);
    },
    GENERATION_TIMEOUT_MS
  );

  it(
    'given types from an older document then they are out of date',
    async () => {
      // Given: the types before the API added a field
      const olderTypes = await generatePublicApiTypes(ECONOMY_OPTIONS_DOCUMENT);
      const newerDocument = structuredClone(ECONOMY_OPTIONS_DOCUMENT);
      const result = (newerDocument.components!.schemas!.EconomyOptionsResponse as any).properties
        .result;
      result.properties.policyengine_version = { type: 'string' };

      // When
      const comparison = await compareGeneratedTypes(newerDocument, olderTypes);

      // Then
      expect(comparison.upToDate).toBe(false);
      expect(comparison.expected).toContain('policyengine_version');
    },
    GENERATION_TIMEOUT_MS
  );

  it('given an API origin then the document is read from its v2 route', () => {
    expect(openapiDocumentLocation('https://api.policyengine.org')).toBe(
      'https://api.policyengine.org/v2/openapi.json'
    );
    expect(openapiDocumentLocation('https://api.test.org/v2/openapi.json')).toBe(
      'https://api.test.org/v2/openapi.json'
    );
    expect(openapiDocumentLocation('/tmp/openapi.json')).toBe('/tmp/openapi.json');
  });

  it(
    'given the checked-in document then the checked-in types match it',
    async () => {
      // Given
      const checkedInDocument = JSON.parse(await readFile(OPENAPI_DOCUMENT_PATH, 'utf8'));
      const checkedInTypes = await readFile(GENERATED_SCHEMA_PATH, 'utf8');

      // When
      const comparison = await compareGeneratedTypes(checkedInDocument, checkedInTypes);

      // Then
      expect(serializeOpenapiDocument(checkedInDocument)).toBe(
        await readFile(OPENAPI_DOCUMENT_PATH, 'utf8')
      );
      expect(comparison.upToDate).toBe(true);
    },
    GENERATION_TIMEOUT_MS
  );
});
