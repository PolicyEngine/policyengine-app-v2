/**
 * TypeScript types for the Public API's v2 routes (policyengine-api),
 * generated from its OpenAPI document (`GET /v2/openapi.json`).
 *
 * The document is checked in beside the generated types, so a build never
 * calls the API, and CI can check that the types match the document:
 *
 *   bun run public-api:generate            writes schema.d.ts from openapi.json
 *   bun run public-api:check               fails when schema.d.ts is out of date
 *   bun run public-api:refresh <source>    copies the document from a URL or a
 *                                          file, then writes schema.d.ts
 *
 * <source> is an API origin (https://api.policyengine.org), a full URL of
 * the document, or a path to a saved copy of it.
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import openapiTS, { astToString, type OpenAPI3 } from 'openapi-typescript';
import prettier from 'prettier';

const SCRIPT_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const CLIENT_DIRECTORY = path.resolve(SCRIPT_DIRECTORY, '../src/api/publicApi');

export const OPENAPI_DOCUMENT_PATH = path.join(CLIENT_DIRECTORY, 'openapi.json');
export const GENERATED_SCHEMA_PATH = path.join(CLIENT_DIRECTORY, 'schema.d.ts');

const GENERATED_HEADER = `/**
 * Generated from src/api/publicApi/openapi.json by scripts/public-api-client.ts.
 * Do not edit: run \`bun run public-api:generate\` (or \`public-api:refresh\`).
 */
`;

/** The path the API serves its v2 OpenAPI document at. */
const OPENAPI_DOCUMENT_ROUTE = '/v2/openapi.json';

/** The generated, formatted types for an OpenAPI document. */
export async function generatePublicApiTypes(openapiDocument: OpenAPI3): Promise<string> {
  const syntaxTree = await openapiTS(openapiDocument);
  const source = `${GENERATED_HEADER}\n${astToString(syntaxTree)}`;
  const prettierConfig = (await prettier.resolveConfig(GENERATED_SCHEMA_PATH)) ?? {};
  return prettier.format(source, { ...prettierConfig, filepath: GENERATED_SCHEMA_PATH });
}

export interface SchemaComparison {
  upToDate: boolean;
  expected: string;
}

/** Whether checked-in types equal what the document generates. */
export async function compareGeneratedTypes(
  openapiDocument: OpenAPI3,
  checkedInTypes: string
): Promise<SchemaComparison> {
  const expected = await generatePublicApiTypes(openapiDocument);
  return { upToDate: expected === checkedInTypes, expected };
}

/** Where to read the document from: an origin gets the v2 route appended. */
export function openapiDocumentLocation(source: string): string {
  if (!/^https?:\/\//.test(source)) {
    return source;
  }
  const url = new URL(source);
  if (url.pathname === '/' || url.pathname === '') {
    url.pathname = OPENAPI_DOCUMENT_ROUTE;
  }
  return url.toString();
}

/** The document as checked in: two-space JSON with a final newline. */
export function serializeOpenapiDocument(openapiDocument: OpenAPI3): string {
  return `${JSON.stringify(openapiDocument, null, 2)}\n`;
}

async function readOpenapiDocument(location: string): Promise<OpenAPI3> {
  if (/^https?:\/\//.test(location)) {
    const response = await fetch(location, { headers: { Accept: 'application/json' } });
    if (!response.ok) {
      throw new Error(`GET ${location} returned ${response.status}`);
    }
    return (await response.json()) as OpenAPI3;
  }
  return JSON.parse(await readFile(location, 'utf8')) as OpenAPI3;
}

async function writeGeneratedTypes(): Promise<void> {
  const openapiDocument = await readOpenapiDocument(OPENAPI_DOCUMENT_PATH);
  await writeFile(GENERATED_SCHEMA_PATH, await generatePublicApiTypes(openapiDocument));
  console.info(`Wrote ${path.relative(process.cwd(), GENERATED_SCHEMA_PATH)}`);
}

async function checkGeneratedTypes(): Promise<boolean> {
  const openapiDocument = await readOpenapiDocument(OPENAPI_DOCUMENT_PATH);
  const checkedInTypes = await readFile(GENERATED_SCHEMA_PATH, 'utf8');
  const { upToDate } = await compareGeneratedTypes(openapiDocument, checkedInTypes);
  if (upToDate) {
    console.info('The generated Public API types match openapi.json.');
    return true;
  }
  console.error(
    'src/api/publicApi/schema.d.ts does not match src/api/publicApi/openapi.json.\n' +
      'Run `bun run public-api:generate` in app/ and commit the result.'
  );
  return false;
}

async function refreshOpenapiDocument(source: string | undefined): Promise<void> {
  if (!source) {
    throw new Error('Name the document to copy: an API origin, a URL or a file path.');
  }
  const location = openapiDocumentLocation(source);
  const openapiDocument = await readOpenapiDocument(location);
  await writeFile(OPENAPI_DOCUMENT_PATH, serializeOpenapiDocument(openapiDocument));
  console.info(`Copied ${location} to ${path.relative(process.cwd(), OPENAPI_DOCUMENT_PATH)}`);
  await writeGeneratedTypes();
}

async function main(commandLineArguments: string[]): Promise<number> {
  const [command, source] = commandLineArguments;
  switch (command) {
    case 'generate':
      await writeGeneratedTypes();
      return 0;
    case 'check':
      return (await checkGeneratedTypes()) ? 0 : 1;
    case 'refresh':
      await refreshOpenapiDocument(source);
      return 0;
    default:
      console.error('Usage: public-api-client.ts generate | check | refresh <source>');
      return 2;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).then(
    (exitCode) => process.exit(exitCode),
    (error: unknown) => {
      console.error(error instanceof Error ? error.message : error);
      process.exit(1);
    }
  );
}
