import { ComponentKey, componentRegistry, FlowKey, flowRegistry } from './registry';

export interface EventList {
  // TODO: Define events in a more structured way
  [eventName: string]: string | FlowKey;
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
}
