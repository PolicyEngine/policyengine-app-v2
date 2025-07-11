import PolicyCreationView from "@/policyFlow/PolicyCreationView";

export const componentRegistry = {
  'PolicyCreationView': PolicyCreationView,
  // Add other components here as needed
} as const;

export type ComponentKey = keyof typeof componentRegistry;