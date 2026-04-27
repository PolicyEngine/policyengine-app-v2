export const SIMULATION_CAPABILITIES = [
  'reads',
  'associations',
  'standalone_household_create',
  'standalone_economy_create',
  'report_linked_create',
] as const;

export type SimulationCapability = (typeof SIMULATION_CAPABILITIES)[number];

/**
 * Simulation migration capabilities are more granular than the top-level
 * entity migration mode because API v2 alpha exposes simulations unevenly:
 *
 * - read paths can migrate before create paths
 * - user associations can migrate before report-linked creation
 * - standalone household creation is cleaner than economy/report-linked creation
 */
export type SimulationCapabilityMode = 'v1_only' | 'mixed' | 'v2_enabled' | 'phase4_only';

export const SIMULATION_CAPABILITY_MODE: Record<SimulationCapability, SimulationCapabilityMode> = {
  reads: 'v1_only',
  associations: 'v1_only',
  standalone_household_create: 'v1_only',
  standalone_economy_create: 'phase4_only',
  report_linked_create: 'phase4_only',
};

export function getSimulationCapabilityMode(
  capability: SimulationCapability
): SimulationCapabilityMode {
  return SIMULATION_CAPABILITY_MODE[capability];
}

export function isSimulationCapabilityV1Only(capability: SimulationCapability): boolean {
  return getSimulationCapabilityMode(capability) === 'v1_only';
}

export function isSimulationCapabilityMixed(capability: SimulationCapability): boolean {
  return getSimulationCapabilityMode(capability) === 'mixed';
}

export function isSimulationCapabilityV2Enabled(capability: SimulationCapability): boolean {
  return getSimulationCapabilityMode(capability) === 'v2_enabled';
}

export function isSimulationCapabilityPhase4Only(capability: SimulationCapability): boolean {
  return getSimulationCapabilityMode(capability) === 'phase4_only';
}

export function assertSupportedSimulationCapabilityMode(
  capability: SimulationCapability,
  supportedModes: readonly SimulationCapabilityMode[],
  context?: string
): SimulationCapabilityMode {
  const mode = getSimulationCapabilityMode(capability);

  if (!supportedModes.includes(mode)) {
    const supported = supportedModes.join(', ');
    const location = context ? ` in ${context}` : '';
    throw new Error(
      `[SimulationCapability] Unsupported mode "${mode}" for ${capability}${location}. Supported modes: ${supported}`
    );
  }

  return mode;
}

export function assertReportLinkedSimulationCreateBoundary(
  context?: string
): SimulationCapabilityMode {
  return assertSupportedSimulationCapabilityMode(
    'report_linked_create',
    ['v1_only', 'phase4_only'],
    context
  );
}
