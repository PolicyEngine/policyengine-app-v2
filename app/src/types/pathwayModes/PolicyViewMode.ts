/**
 * PolicyViewMode - Enum for policy creation pathway view states
 *
 * Maps to the frames in PolicyCreationFlow:
 * - LABEL: PolicyCreationFrame (enter policy name)
 * - PARAMETER_SELECTOR: PolicyParameterSelectorFrame (select and configure parameters)
 * - SUBMIT: PolicySubmitFrame (review and submit policy)
 */
export enum PolicyViewMode {
  LABEL = 'LABEL',
  PARAMETER_SELECTOR = 'PARAMETER_SELECTOR',
  SUBMIT = 'SUBMIT',
}
