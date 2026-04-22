export const MIGRATION_ENTITIES = [
  'policies',
  'households',
  'regions',
  'simulations',
  'reports',
] as const;

export type MigrationEntity = (typeof MIGRATION_ENTITIES)[number];

export type MigrationMode = 'v1_only' | 'v1_primary_v2_shadow' | 'v2_primary_v1_shadow' | 'v2_only';

export const ENTITY_MIGRATION_MODE: Record<MigrationEntity, MigrationMode> = {
  policies: 'v1_primary_v2_shadow',
  households: 'v1_primary_v2_shadow',
  regions: 'v1_primary_v2_shadow',
  simulations: 'v1_only',
  reports: 'v1_only',
};

export function getMigrationMode(entity: MigrationEntity): MigrationMode {
  return ENTITY_MIGRATION_MODE[entity];
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
