import { ComponentKey } from "./registry";

export interface EventList {
  [eventName: string]: string
}

export interface FlowFrame {
  name: string;
  component: string;
  on: EventList;
}

export interface Flow {
  name: string;
  initialFrame: ComponentKey | null;
  frames: Record<string, ComponentKey> | {};
}
