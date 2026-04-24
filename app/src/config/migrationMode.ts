export const MIGRATION_ENTITIES = [
  'policies',
  'households',
  'regions',
  'saved_geographies',
  'simulations',
  'reports',
] as const;

export type MigrationEntity = (typeof MIGRATION_ENTITIES)[number];

export type MigrationMode = 'v1_only' | 'v1_primary_v2_shadow' | 'v2_primary_v1_shadow' | 'v2_only';

export type MigrationEntityResponsibility =
  | 'entity_and_association_writes'
  | 'canonical_region_source_and_shadow_resolution'
  | 'association_writes';

/**
 * Supported migration modes by entity.
 *
 * `regions` governs canonical region sourcing and shadow region resolution.
 * `saved_geographies` governs persisted user geography-association writes.
 */
export const ENTITY_SUPPORTED_MODES: Record<MigrationEntity, readonly MigrationMode[]> = {
  policies: ['v1_only', 'v1_primary_v2_shadow'],
  households: ['v1_only', 'v1_primary_v2_shadow'],
  regions: ['v1_only', 'v1_primary_v2_shadow', 'v2_primary_v1_shadow', 'v2_only'],
  saved_geographies: ['v1_only'],
  simulations: ['v1_only'],
  reports: ['v1_only'],
};

export const ENTITY_MIGRATION_MODE: Record<MigrationEntity, MigrationMode> = {
  policies: 'v1_primary_v2_shadow',
  households: 'v1_primary_v2_shadow',
  regions: 'v1_primary_v2_shadow',
  saved_geographies: 'v1_only',
  simulations: 'v1_only',
  reports: 'v1_only',
};

export const MIGRATION_ENTITY_RESPONSIBILITIES: Record<
  MigrationEntity,
  MigrationEntityResponsibility
> = {
  policies: 'entity_and_association_writes',
  households: 'entity_and_association_writes',
  regions: 'canonical_region_source_and_shadow_resolution',
  saved_geographies: 'association_writes',
  simulations: 'entity_and_association_writes',
  reports: 'entity_and_association_writes',
};

export function getMigrationMode(entity: MigrationEntity): MigrationMode {
  return ENTITY_MIGRATION_MODE[entity];
}

export function getMigrationEntityResponsibility(
  entity: MigrationEntity
): MigrationEntityResponsibility {
  return MIGRATION_ENTITY_RESPONSIBILITIES[entity];
}

export function getSupportedMigrationModes(entity: MigrationEntity): readonly MigrationMode[] {
  return ENTITY_SUPPORTED_MODES[entity];
}

export function isV1OnlyMode(mode: MigrationMode): boolean {
  return mode === 'v1_only';
}

export function isV1PrimaryV2ShadowMode(mode: MigrationMode): boolean {
  return mode === 'v1_primary_v2_shadow';
}

export function isV2PrimaryMode(mode: MigrationMode): boolean {
  return mode === 'v2_primary_v1_shadow' || mode === 'v2_only';
}

export function isV2OnlyMode(mode: MigrationMode): boolean {
  return mode === 'v2_only';
}

export function usesV2ShadowMode(mode: MigrationMode): boolean {
  return mode === 'v1_primary_v2_shadow';
}

export function usesV1ShadowMode(mode: MigrationMode): boolean {
  return mode === 'v2_primary_v1_shadow';
}

export function isV1Only(entity: MigrationEntity): boolean {
  return isV1OnlyMode(getMigrationMode(entity));
}

export function isV1PrimaryV2Shadow(entity: MigrationEntity): boolean {
  return isV1PrimaryV2ShadowMode(getMigrationMode(entity));
}

export function isV2Primary(entity: MigrationEntity): boolean {
  return isV2PrimaryMode(getMigrationMode(entity));
}

export function isV2Only(entity: MigrationEntity): boolean {
  return isV2OnlyMode(getMigrationMode(entity));
}

export function usesV2Shadow(entity: MigrationEntity): boolean {
  return usesV2ShadowMode(getMigrationMode(entity));
}

export function usesV1Shadow(entity: MigrationEntity): boolean {
  return usesV1ShadowMode(getMigrationMode(entity));
}

export function governsAssociationWrites(entity: MigrationEntity): boolean {
  const responsibility = getMigrationEntityResponsibility(entity);
  return (
    responsibility === 'entity_and_association_writes' || responsibility === 'association_writes'
  );
}

export function governsCanonicalRegionSource(entity: MigrationEntity): boolean {
  return (
    getMigrationEntityResponsibility(entity) === 'canonical_region_source_and_shadow_resolution'
  );
}

export function assertSupportedMode(
  entity: MigrationEntity,
  supportedModes: readonly MigrationMode[],
  context?: string
): MigrationMode {
  const mode = getMigrationMode(entity);

  if (!supportedModes.includes(mode)) {
    const supported = supportedModes.join(', ');
    const location = context ? ` in ${context}` : '';
    throw new Error(
      `[MigrationMode] Unsupported mode "${mode}" for ${entity}${location}. Supported modes: ${supported}`
    );
  }

  return mode;
}
