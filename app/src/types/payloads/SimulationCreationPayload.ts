/**
 * Payload format for creating a simulation.
 *
 * Uses V2 API semantics: `region` for geographic populations,
 * `household_id` for household populations. Exactly one of
 * `region` or `household_id` must be set.
 *
 * The API call layer translates this to V1 wire format
 * (`population_id`/`population_type`) until simulation creation
 * is fully migrated to V2.
 */
export interface SimulationCreationPayload {
  region?: string; // V2 region code (e.g., "state/ca", "us")
  household_id?: string; // Household ID for household simulations
  policy_id: number;
}
