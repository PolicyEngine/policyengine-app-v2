import { describe, test, expect, vi } from 'vitest';

// Mock the flowRegistry before any imports that use it
vi.mock('@/flows/registry', async () => {
  const mocks = await import('@/tests/fixtures/types/flowMocks');
  return {
    flowRegistry: mocks.mockFlowRegistry,
    ComponentKey: {} as any,
    FlowKey: {} as any,
  };
});

import { isNavigationObject, isFlowKey, isComponentKey } from '@/types/flow';
import {
  VALID_FLOW_KEYS,
  VALID_COMPONENT_KEYS,
  INVALID_KEYS,
  SPECIAL_VALUES,
  VALID_NAVIGATION_OBJECT,
  VALID_NAVIGATION_OBJECT_ALT,
  NAVIGATION_OBJECT_MISSING_FLOW,
  NAVIGATION_OBJECT_MISSING_RETURN,
  NAVIGATION_OBJECT_WITH_EXTRA_PROPS,
  NAVIGATION_OBJECT_WITH_NULL_FLOW,
  NAVIGATION_OBJECT_WITH_NULL_RETURN,
  STRING_TARGET,
  FLOW_KEY_TARGET,
  COMPONENT_KEY_TARGET,
  EMPTY_OBJECT,
  NULL_OBJECT,
  ARRAY_OBJECT,
  NUMBER_VALUE,
  BOOLEAN_VALUE,
  ALL_VALID_FLOW_KEYS,
  ALL_VALID_COMPONENT_KEYS,
  ALL_INVALID_KEYS,
  TRUTHY_NAVIGATION_OBJECTS,
  FALSY_NAVIGATION_OBJECTS,
  TRUTHY_FLOW_KEYS,
  FALSY_FLOW_KEYS,
  mockFlowRegistry,
} from '@/tests/fixtures/types/flowMocks';

describe('flow type utilities', () => {
  describe('isNavigationObject', () => {
    describe('valid navigation objects', () => {
      test('given object with flow and returnTo then returns true', () => {
        const result = isNavigationObject(VALID_NAVIGATION_OBJECT);
        
        expect(result).toBe(true);
      });

      test('given alternative valid navigation object then returns true', () => {
        const result = isNavigationObject(VALID_NAVIGATION_OBJECT_ALT);
        
        expect(result).toBe(true);
      });

      test('given navigation object with extra properties then returns true', () => {
        const result = isNavigationObject(NAVIGATION_OBJECT_WITH_EXTRA_PROPS);
        
        expect(result).toBe(true);
      });

      test('given all valid navigation objects then all return true', () => {
        TRUTHY_NAVIGATION_OBJECTS.forEach(obj => {
          expect(isNavigationObject(obj as any)).toBe(true);
        });
      });
    });

    describe('invalid navigation objects', () => {
      test('given object missing flow property then returns false', () => {
        const result = isNavigationObject(NAVIGATION_OBJECT_MISSING_FLOW as any);
        
        expect(result).toBe(false);
      });

      test('given object missing returnTo property then returns false', () => {
        const result = isNavigationObject(NAVIGATION_OBJECT_MISSING_RETURN as any);
        
        expect(result).toBe(false);
      });

      test('given object with null flow then returns true', () => {
        // The function only checks for property existence, not values
        const result = isNavigationObject(NAVIGATION_OBJECT_WITH_NULL_FLOW as any);
        
        expect(result).toBe(true);
      });

      test('given object with null returnTo then returns true', () => {
        // The function only checks for property existence, not values
        const result = isNavigationObject(NAVIGATION_OBJECT_WITH_NULL_RETURN as any);
        
        expect(result).toBe(true);
      });

      test('given empty object then returns false', () => {
        const result = isNavigationObject(EMPTY_OBJECT as any);
        
        expect(result).toBe(false);
      });

      test('given null then returns false', () => {
        const result = isNavigationObject(NULL_OBJECT as any);
        
        expect(result).toBe(false);
      });

      test('given array then returns false', () => {
        const result = isNavigationObject(ARRAY_OBJECT as any);
        
        expect(result).toBe(false);
      });
    });

    describe('non-object inputs', () => {
      test('given string then returns false', () => {
        const result = isNavigationObject(STRING_TARGET);
        
        expect(result).toBe(false);
      });

      test('given number then returns false', () => {
        const result = isNavigationObject(NUMBER_VALUE as any);
        
        expect(result).toBe(false);
      });

      test('given boolean then returns false', () => {
        const result = isNavigationObject(BOOLEAN_VALUE as any);
        
        expect(result).toBe(false);
      });

      test('given undefined then returns false', () => {
        const result = isNavigationObject(SPECIAL_VALUES.UNDEFINED as any);
        
        expect(result).toBe(false);
      });

      test('given all falsy navigation objects then all return false', () => {
        FALSY_NAVIGATION_OBJECTS.forEach(obj => {
          expect(isNavigationObject(obj as any)).toBe(false);
        });
      });
    });
  });

  describe('isFlowKey', () => {
    describe('valid flow keys', () => {
      test('given PolicyCreationFlow then returns true', () => {
        const result = isFlowKey(VALID_FLOW_KEYS.POLICY_CREATION);
        
        expect(result).toBe(true);
      });

      test('given PolicyViewFlow then returns true', () => {
        const result = isFlowKey(VALID_FLOW_KEYS.POLICY_VIEW);
        
        expect(result).toBe(true);
      });

      test('given PopulationCreationFlow then returns true', () => {
        const result = isFlowKey(VALID_FLOW_KEYS.POPULATION_CREATION);
        
        expect(result).toBe(true);
      });

      test('given SimulationCreationFlow then returns true', () => {
        const result = isFlowKey(VALID_FLOW_KEYS.SIMULATION_CREATION);
        
        expect(result).toBe(true);
      });

      test('given SimulationViewFlow then returns true', () => {
        const result = isFlowKey(VALID_FLOW_KEYS.SIMULATION_VIEW);
        
        expect(result).toBe(true);
      });

      test('given all valid flow keys then all return true', () => {
        ALL_VALID_FLOW_KEYS.forEach(key => {
          expect(isFlowKey(key)).toBe(true);
        });
      });
    });

    describe('invalid flow keys', () => {
      test('given component key then returns false', () => {
        const result = isFlowKey(VALID_COMPONENT_KEYS.POLICY_CREATION_FRAME);
        
        expect(result).toBe(false);
      });

      test('given non-existent flow key then returns false', () => {
        const result = isFlowKey(INVALID_KEYS.NON_EXISTENT_FLOW);
        
        expect(result).toBe(false);
      });

      test('given random string then returns false', () => {
        const result = isFlowKey(INVALID_KEYS.RANDOM_STRING);
        
        expect(result).toBe(false);
      });

      test('given empty string then returns false', () => {
        const result = isFlowKey(INVALID_KEYS.EMPTY_STRING);
        
        expect(result).toBe(false);
      });

      test('given special characters then returns false', () => {
        const result = isFlowKey(INVALID_KEYS.SPECIAL_CHARS);
        
        expect(result).toBe(false);
      });

      test('given all invalid keys then all return false', () => {
        ALL_INVALID_KEYS.forEach(key => {
          expect(isFlowKey(key)).toBe(false);
        });
      });

      test('given all component keys then all return false', () => {
        ALL_VALID_COMPONENT_KEYS.forEach(key => {
          expect(isFlowKey(key)).toBe(false);
        });
      });
    });

    describe('edge cases', () => {
      test('given return keyword then returns false', () => {
        const result = isFlowKey(SPECIAL_VALUES.RETURN_KEYWORD);
        
        expect(result).toBe(false);
      });

      test('given numeric string then returns false', () => {
        const result = isFlowKey(INVALID_KEYS.NUMBER_STRING);
        
        expect(result).toBe(false);
      });
    });
  });

  describe('isComponentKey', () => {
    describe('valid component keys', () => {
      test('given PolicyCreationFrame then returns true', () => {
        const result = isComponentKey(VALID_COMPONENT_KEYS.POLICY_CREATION_FRAME);
        
        expect(result).toBe(true);
      });

      test('given PolicyParameterSelectorFrame then returns true', () => {
        const result = isComponentKey(VALID_COMPONENT_KEYS.POLICY_PARAMETER_SELECTOR);
        
        expect(result).toBe(true);
      });

      test('given HouseholdBuilderFrame then returns true', () => {
        const result = isComponentKey(VALID_COMPONENT_KEYS.HOUSEHOLD_BUILDER);
        
        expect(result).toBe(true);
      });

      test('given all valid component keys then all return true', () => {
        ALL_VALID_COMPONENT_KEYS.forEach(key => {
          expect(isComponentKey(key)).toBe(true);
        });
      });

      test('given non-existent component key then returns true', () => {
        // isComponentKey returns true for anything that's not a flow key
        const result = isComponentKey(INVALID_KEYS.NON_EXISTENT_COMPONENT);
        
        expect(result).toBe(true);
      });

      test('given random string then returns true', () => {
        // isComponentKey returns true for anything that's not a flow key
        const result = isComponentKey(INVALID_KEYS.RANDOM_STRING);
        
        expect(result).toBe(true);
      });
    });

    describe('invalid component keys (flow keys)', () => {
      test('given PolicyCreationFlow then returns false', () => {
        const result = isComponentKey(VALID_FLOW_KEYS.POLICY_CREATION);
        
        expect(result).toBe(false);
      });

      test('given PolicyViewFlow then returns false', () => {
        const result = isComponentKey(VALID_FLOW_KEYS.POLICY_VIEW);
        
        expect(result).toBe(false);
      });

      test('given all flow keys then all return false', () => {
        ALL_VALID_FLOW_KEYS.forEach(key => {
          expect(isComponentKey(key)).toBe(false);
        });
      });
    });

    describe('edge cases', () => {
      test('given empty string then returns true', () => {
        // Empty string is not a flow key, so it's considered a component key
        const result = isComponentKey(INVALID_KEYS.EMPTY_STRING);
        
        expect(result).toBe(true);
      });

      test('given special characters then returns true', () => {
        // Special chars are not a flow key, so considered a component key
        const result = isComponentKey(INVALID_KEYS.SPECIAL_CHARS);
        
        expect(result).toBe(true);
      });

      test('given return keyword then returns true', () => {
        // Return keyword is not a flow key, so considered a component key
        const result = isComponentKey(SPECIAL_VALUES.RETURN_KEYWORD);
        
        expect(result).toBe(true);
      });
    });

    describe('relationship with isFlowKey', () => {
      test('given any string then isComponentKey returns opposite of isFlowKey', () => {
        const testStrings = [
          ...ALL_VALID_FLOW_KEYS,
          ...ALL_VALID_COMPONENT_KEYS,
          ...ALL_INVALID_KEYS,
          SPECIAL_VALUES.RETURN_KEYWORD,
        ];

        testStrings.forEach(str => {
          const isFlow = isFlowKey(str);
          const isComponent = isComponentKey(str);
          
          expect(isComponent).toBe(!isFlow);
        });
      });
    });
  });

  describe('type guard behavior', () => {
    test('given navigation object type guard then narrows type correctly', () => {
      const target: any = VALID_NAVIGATION_OBJECT;
      
      if (isNavigationObject(target)) {
        // TypeScript should allow accessing flow and returnTo here
        expect(target.flow).toBe(VALID_FLOW_KEYS.POLICY_CREATION);
        expect(target.returnTo).toBe(VALID_COMPONENT_KEYS.POLICY_READ_VIEW);
      } else {
        // This branch should not be reached
        expect(true).toBe(false);
      }
    });

    test('given flow key type guard then narrows type correctly', () => {
      const key: string = VALID_FLOW_KEYS.POLICY_CREATION;
      
      if (isFlowKey(key)) {
        // TypeScript should treat key as FlowKey here
        expect(key).toBe(VALID_FLOW_KEYS.POLICY_CREATION);
      } else {
        // This branch should not be reached
        expect(true).toBe(false);
      }
    });

    test('given component key type guard then narrows type correctly', () => {
      const key: string = VALID_COMPONENT_KEYS.POLICY_CREATION_FRAME;
      
      if (isComponentKey(key)) {
        // TypeScript should treat key as ComponentKey here
        expect(key).toBe(VALID_COMPONENT_KEYS.POLICY_CREATION_FRAME);
      } else {
        // This branch should not be reached
        expect(true).toBe(false);
      }
    });
  });
});