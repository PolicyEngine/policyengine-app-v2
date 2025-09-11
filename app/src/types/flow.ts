import { ComponentKey, FlowKey, flowRegistry } from '../flows/registry';

// Navigation target can be a simple string or an object with flow and returnTo
export type NavigationTarget =
  | string
  | FlowKey
  | {
      flow: FlowKey;
      returnTo: ComponentKey;
    };

export interface EventList {
  // TODO: Define events in a more structured way
  [eventName: string]: NavigationTarget;
}

export interface FlowFrame {
  component: ComponentKey;
  on: EventList;
}

export interface Flow {
  initialFrame: ComponentKey | FlowKey | null;
  frames: Record<string, FlowFrame>;
}

// Helper type to distinguish between component and flow references
export type FrameTarget = ComponentKey | FlowKey;

export function isNavigationObject(
  target: NavigationTarget
): target is { flow: FlowKey; returnTo: ComponentKey } {
  return typeof target === 'object' && target !== null && 'flow' in target && 'returnTo' in target;
}

export function isFlowKey(target: string): target is FlowKey {
  return target in flowRegistry;
}

export function isComponentKey(target: string): target is ComponentKey {
  return !isFlowKey(target);
}

// Define the props that all flow components receive
export interface FlowComponentProps {
  onNavigate: (eventName: string) => void;
  onReturn: () => void;
  flowConfig: FlowFrame;
  isInSubflow: boolean;
  flowDepth: number;
  parentFlowContext?: {
    parentFrame: ComponentKey;
  };
}
