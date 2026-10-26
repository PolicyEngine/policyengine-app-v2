import {
  createPublicApiClient,
  publicApiCountryId,
  requireResult,
  type PublicApiClient,
} from '@/api/publicApi/client';
import type { components } from '@/api/publicApi/schema';

/**
 * One level of v3's parameter tree, from `GET /v2/parameters/children`:
 * a node's direct children that a reform can change, with their labels,
 * how many changeable parameters each holds, and, for a parameter, its
 * summary. A bracket schedule is one node whose children are its brackets.
 */
export type ParameterChild = components['schemas']['MetadataParameterChild'];

/** The largest page the route serves. */
const CHILDREN_PAGE_SIZE = 500;
/** A generous bound so a misbehaving server cannot loop forever. */
const MAXIMUM_CHILDREN_PAGES = 50;

export async function fetchParameterChildren(
  countryId: string,
  policyengineVersion: string,
  parentPath: string,
  client: PublicApiClient = createPublicApiClient()
): Promise<ParameterChild[]> {
  const children: ParameterChild[] = [];
  for (let page = 0; page < MAXIMUM_CHILDREN_PAGES; page += 1) {
    const result = await requireResult(
      client.GET('/v2/parameters/children', {
        params: {
          query: {
            country_id: publicApiCountryId(countryId),
            policyengine_version: policyengineVersion,
            parent_path: parentPath,
            reform_changeable: true,
            offset: children.length,
            limit: CHILDREN_PAGE_SIZE,
          },
        },
      })
    );
    children.push(...result.items);
    if (!result.has_more || result.items.length === 0) {
      break;
    }
  }
  return children;
}
