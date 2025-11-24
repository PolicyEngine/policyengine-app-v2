/**
 * StandalonePolicyViewMode - Enum for standalone policy creation pathway view states
 *
 * This is used by the standalone PolicyPathwayWrapper.
 * For policy modes used within composite pathways (Report, Simulation),
 * see PolicyViewMode in SharedViewModes.ts
 *
 * Maps to the frames in PolicyCreationFlow:
 * - LABEL: PolicyCreationFrame (enter policy name)
 * - PARAMETER_SELECTOR: PolicyParameterSelectorFrame (select and configure parameters)
 * - SUBMIT: PolicySubmitFrame (review and submit policy)
 */
export enum StandalonePolicyViewMode {
  LABEL = 'LABEL',
  PARAMETER_SELECTOR = 'PARAMETER_SELECTOR',
  SUBMIT = 'SUBMIT',
}
