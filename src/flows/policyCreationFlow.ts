import { Flow, FlowFrame, FlowCollection } from "./types";
import PolicyCreationView from "@/policyFlow/PolicyCreationView";

export const policyCreationFlow: Flow = {
  name: "policy-creation",
  frames: [
    {
      name: "policy-input-1",
      frame: PolicyCreationView,
      nextButtonText: "Next",
    },
  ],
};