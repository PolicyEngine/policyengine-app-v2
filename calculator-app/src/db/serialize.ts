import type { ReformMetadata } from "@/types/metadata/reformMetadata";
import type { ReformRow } from "./schema";

/** Convert a database row to the snake_case wire format the client stores expect. */
export function reformRowToMetadata(row: ReformRow): ReformMetadata {
  return {
    id: row.id,
    user_id: row.userId,
    country_id: row.countryId as ReformMetadata["country_id"],
    label: row.label,
    policy_id: row.policyId,
    parameters: row.parameters,
    baseline: row.baseline as ReformMetadata["baseline"],
    provenance: row.provenance,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  };
}
