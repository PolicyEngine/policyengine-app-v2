import { ComponentKey, FlowKey } from '@/flows/registry';
import { NavigationTarget } from '@/types/flow';

// Test constants for flow keys (matching actual registry)
export const VALID_FLOW_KEYS = {
  POLICY_CREATION: 'PolicyCreationFlow',
  POLICY_VIEW: 'PolicyViewFlow',
  POPULATION_CREATION: 'PopulationCreationFlow',
  SIMULATION_CREATION: 'SimulationCreationFlow',
  SIMULATION_VIEW: 'SimulationViewFlow',
} as const;

// Test constants for component keys (matching actual registry)
export const VALID_COMPONENT_KEYS = {
  POLICY_CREATION_FRAME: 'PolicyCreationFrame',
  POLICY_PARAMETER_SELECTOR: 'PolicyParameterSelectorFrame',
  POLICY_SUBMIT: 'PolicySubmitFrame',
  POLICY_READ_VIEW: 'PolicyReadView',
  SELECT_GEOGRAPHIC_SCOPE: 'SelectGeographicScopeFrame',
  SET_POPULATION_LABEL: 'SetPopulationLabelFrame',
  GEOGRAPHIC_CONFIRMATION: 'GeographicConfirmationFrame',
  HOUSEHOLD_BUILDER: 'HouseholdBuilderFrame',
  POPULATION_READ_VIEW: 'PopulationReadView',
  SIMULATION_CREATION: 'SimulationCreationFrame',
  SIMULATION_SETUP: 'SimulationSetupFrame',
  SIMULATION_SUBMIT: 'SimulationSubmitFrame',
  SIMULATION_SETUP_POLICY: 'SimulationSetupPolicyFrame',
  SIMULATION_SELECT_EXISTING_POLICY: 'SimulationSelectExistingPolicyFrame',
  SIMULATION_READ_VIEW: 'SimulationReadView',
  SIMULATION_SETUP_POPULATION: 'SimulationSetupPopulationFrame',
  SIMULATION_SELECT_EXISTING_POPULATION: 'SimulationSelectExistingPopulationFrame',
} as const;

// Test constants for invalid keys
export const INVALID_KEYS = {
  NON_EXISTENT_FLOW: 'NonExistentFlow',
  NON_EXISTENT_COMPONENT: 'NonExistentComponent',
  RANDOM_STRING: 'randomString123',
  EMPTY_STRING: '',
  SPECIAL_CHARS: '@#$%^&*()',
  NUMBER_STRING: '12345',
} as const;

// Test constants for special values
export const SPECIAL_VALUES = {
  NULL: null,
  UNDEFINED: undefined,
  RETURN_KEYWORD: '__return__',
} as const;

// Mock navigation objects
export const VALID_NAVIGATION_OBJECT = {
  flow: VALID_FLOW_KEYS.POLICY_CREATION as FlowKey,
  returnTo: VALID_COMPONENT_KEYS.POLICY_READ_VIEW as ComponentKey,
};

export const VALID_NAVIGATION_OBJECT_ALT = {
  flow: VALID_FLOW_KEYS.SIMULATION_CREATION as FlowKey,
  returnTo: VALID_COMPONENT_KEYS.SIMULATION_READ_VIEW as ComponentKey,
};

// Invalid navigation objects for testing
export const NAVIGATION_OBJECT_MISSING_FLOW = {
  returnTo: VALID_COMPONENT_KEYS.POLICY_READ_VIEW as ComponentKey,
};

export const NAVIGATION_OBJECT_MISSING_RETURN = {
  flow: VALID_FLOW_KEYS.POLICY_CREATION as FlowKey,
};

export const NAVIGATION_OBJECT_WITH_EXTRA_PROPS = {
  flow: VALID_FLOW_KEYS.POLICY_CREATION as FlowKey,
  returnTo: VALID_COMPONENT_KEYS.POLICY_READ_VIEW as ComponentKey,
  extraProp: 'should not affect validation',
};

export const NAVIGATION_OBJECT_WITH_NULL_FLOW = {
  flow: null,
  returnTo: VALID_COMPONENT_KEYS.POLICY_READ_VIEW as ComponentKey,
};

export const NAVIGATION_OBJECT_WITH_NULL_RETURN = {
  flow: VALID_FLOW_KEYS.POLICY_CREATION as FlowKey,
  returnTo: null,
};

// Various target types for NavigationTarget testing
export const STRING_TARGET = VALID_COMPONENT_KEYS.POLICY_CREATION_FRAME;
export const FLOW_KEY_TARGET = VALID_FLOW_KEYS.POLICY_CREATION as FlowKey;
export const COMPONENT_KEY_TARGET = VALID_COMPONENT_KEYS.POLICY_CREATION_FRAME as ComponentKey;

// Edge case objects
export const EMPTY_OBJECT = {};
export const NULL_OBJECT = null;
export const ARRAY_OBJECT = [];
export const NUMBER_VALUE = 123;
export const BOOLEAN_VALUE = true;

// Mock flow registry for testing (matches the actual registry keys)
export const mockFlowRegistry = {
  [VALID_FLOW_KEYS.POLICY_CREATION]: {},
  [VALID_FLOW_KEYS.POLICY_VIEW]: {},
  [VALID_FLOW_KEYS.POPULATION_CREATION]: {},
  [VALID_FLOW_KEYS.SIMULATION_CREATION]: {},
  [VALID_FLOW_KEYS.SIMULATION_VIEW]: {},
};

// String collections for batch testing
export const ALL_VALID_FLOW_KEYS = Object.values(VALID_FLOW_KEYS);
export const ALL_VALID_COMPONENT_KEYS = Object.values(VALID_COMPONENT_KEYS);
export const ALL_INVALID_KEYS = Object.values(INVALID_KEYS);

// Navigation target test cases
export const VALID_STRING_TARGETS: NavigationTarget[] = [
  STRING_TARGET,
  FLOW_KEY_TARGET,
  COMPONENT_KEY_TARGET,
  SPECIAL_VALUES.RETURN_KEYWORD,
];

export const VALID_OBJECT_TARGETS: NavigationTarget[] = [
  VALID_NAVIGATION_OBJECT,
  VALID_NAVIGATION_OBJECT_ALT,
  NAVIGATION_OBJECT_WITH_EXTRA_PROPS,
];

export const INVALID_NAVIGATION_OBJECTS = [
  NAVIGATION_OBJECT_MISSING_FLOW,
  NAVIGATION_OBJECT_MISSING_RETURN,
  NAVIGATION_OBJECT_WITH_NULL_FLOW,
  NAVIGATION_OBJECT_WITH_NULL_RETURN,
  EMPTY_OBJECT,
  NULL_OBJECT,
  ARRAY_OBJECT,
];

// Type guard test collections
export const TRUTHY_NAVIGATION_OBJECTS = [
  VALID_NAVIGATION_OBJECT,
  VALID_NAVIGATION_OBJECT_ALT,
  NAVIGATION_OBJECT_WITH_EXTRA_PROPS,
  // These have the required properties even though values are null
  NAVIGATION_OBJECT_WITH_NULL_FLOW,
  NAVIGATION_OBJECT_WITH_NULL_RETURN,
];

export const FALSY_NAVIGATION_OBJECTS = [
  NAVIGATION_OBJECT_MISSING_FLOW,
  NAVIGATION_OBJECT_MISSING_RETURN,
  EMPTY_OBJECT,
  NULL_OBJECT,
  ARRAY_OBJECT,
  STRING_TARGET,
  NUMBER_VALUE,
  BOOLEAN_VALUE,
  SPECIAL_VALUES.NULL,
  SPECIAL_VALUES.UNDEFINED,
];

export const TRUTHY_FLOW_KEYS = ALL_VALID_FLOW_KEYS;

export const FALSY_FLOW_KEYS = [
  ...ALL_VALID_COMPONENT_KEYS,
  ...ALL_INVALID_KEYS,
];

export const TRUTHY_COMPONENT_KEYS = [
  ...ALL_VALID_COMPONENT_KEYS,
  ...ALL_INVALID_KEYS, // These are considered component keys since they're not flow keys
];

export const FALSY_COMPONENT_KEYS = ALL_VALID_FLOW_KEYS;