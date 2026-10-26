import {
  createPublicApiClient,
  publicApiCountryId,
  requireBody,
  type PublicApiClient,
} from '@/api/publicApi/client';
import type { components } from '@/api/publicApi/schema';

/**
 * One catalog version's parameter search file (`GET /v2/parameters/search-file`):
 * every parameter a reform can change, with its label, unit, description
 * and whether a draft can edit its value by date; the labels of parameters
 * a reform cannot change; and every labelled node. It carries no values.
 * v3 searches it in its existing web worker (see libs/flagship/v2ParameterSearch).
 */
export type ParameterSearchFile = components['schemas']['MetadataParameterSearchFileContent'];
export type ParameterSearchFileParameter =
  components['schemas']['MetadataParameterSearchFileParameter'];

/** The file format this app reads; a later format needs code that reads it. */
export const SUPPORTED_SEARCH_FILE_FORMAT = 1;

/**
 * The search file for a catalog version. Naming the version lets the
 * browser keep the response (the API marks a named version's file as
 * long-lived, and it arrives gzip-encoded).
 */
export async function fetchParameterSearchFile(
  countryId: string,
  policyengineVersion: string,
  client: PublicApiClient = createPublicApiClient()
): Promise<ParameterSearchFile> {
  const file = await requireBody(
    client.GET('/v2/parameters/search-file', {
      params: {
        query: {
          country_id: publicApiCountryId(countryId),
          policyengine_version: policyengineVersion,
        },
      },
    })
  );
  if (file.format !== SUPPORTED_SEARCH_FILE_FORMAT) {
    throw new Error(
      `The Public API sent search file format ${file.format}; this app reads format ${SUPPORTED_SEARCH_FILE_FORMAT}.`
    );
  }
  return file;
}
