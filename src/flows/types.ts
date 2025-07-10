export interface FlowFrame {
  name: string;
  frame: React.ComponentType;
  nextButtonText?: string; // Defaults to "Next"
}

export interface Flow {
  name: string;
  frames: FlowFrame[];
}

export type FlowCollection = Flow[]